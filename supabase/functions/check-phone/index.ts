// Public edge function: check if a phone is already registered.
// Returns { exists: boolean }. Uses service role to query profiles by phone.
// Hardened: origin allow-list + per-IP in-memory rate limit to mitigate user
// enumeration. No PII returned beyond existence.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Allow only first-party origins. Add custom domains here as they are configured.
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
  // Add production domain(s) here, e.g.:
  // /^https?:\/\/(.*\.)?daralzuyout\.ly$/i,
];

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "null",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// In-memory token bucket per IP. Resets on cold start (acceptable best-effort).
const RATE_LIMIT_MAX = 8;          // max requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function normalizePhone(input: string): string {
  return (input || "").replace(/\D/g, "");
}

function isValidLibyanPhone(phone: string): boolean {
  const d = normalizePhone(phone);
  return /^09\d{8}$/.test(d) || /^2189\d{8}$/.test(d);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = corsHeadersFor(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Reject cross-origin POSTs from disallowed origins outright
  if (origin && corsHeaders["Access-Control-Allow-Origin"] === "null") {
    return new Response(JSON.stringify({ error: "forbidden_origin" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Per-IP rate limit
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (!rateLimit(ip)) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string" || !isValidLibyanPhone(phone)) {
      return new Response(
        JSON.stringify({ error: "invalid_phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalized = normalizePhone(phone);
    const variants = new Set<string>([normalized]);
    if (normalized.startsWith("09")) variants.add("218" + normalized.slice(1));
    if (normalized.startsWith("2189")) variants.add("0" + normalized.slice(3));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, phone_verified")
      .in("phone", Array.from(variants))
      .limit(1);

    if (error) {
      return new Response(
        JSON.stringify({ error: "lookup_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const row = data?.[0];
    return new Response(
      JSON.stringify({
        exists: !!row,
        phone_verified: !!row?.phone_verified,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (_e) {
    return new Response(
      JSON.stringify({ error: "bad_request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});