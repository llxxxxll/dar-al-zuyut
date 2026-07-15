// Public edge function: check if a phone is already registered.
// Returns { exists: boolean, phone_verified: boolean, verified: boolean }.
// Uses service role to query profiles by phone.
// Hardened: origin allow-list + per-IP in-memory rate limit.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Allow only first-party origins.
// Add custom domains here later when configured.
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,

  // Vercel production domain
  /^https:\/\/dar-al-zuyut\.vercel\.app$/i,

  // Future custom domain examples - enable when needed:
  // /^https:\/\/(www\.)?daralzuyout\.ly$/i,
  // /^https:\/\/(.*\.)?daralzuyout\.ly$/i,
];

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowed =
    !origin || ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));

  return {
    "Access-Control-Allow-Origin": allowed ? origin || "*" : "null",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// In-memory token bucket per IP. Resets on cold start.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
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
  let d = (input || "").replace(/\D/g, "");

  if (d.startsWith("00218")) {
    d = "0" + d.slice(5);
  } else if (d.startsWith("218")) {
    d = "0" + d.slice(3);
  }

  return d;
}

function isValidLibyanPhone(phone: string): boolean {
  const d = normalizePhone(phone);
  return /^09[1-5]\d{7}$/.test(d);
}

function json(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = corsHeadersFor(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, corsHeaders);
  }

  // Reject browser POSTs from disallowed origins.
  if (origin && corsHeaders["Access-Control-Allow-Origin"] === "null") {
    return json({ error: "forbidden_origin", origin }, 403, corsHeaders);
  }

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  if (!rateLimit(ip)) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string" || !isValidLibyanPhone(phone)) {
      return json(
        {
          exists: false,
          phone_verified: false,
          verified: false,
          error: "invalid_phone",
        },
        400,
        corsHeaders,
      );
    }

    const normalized = normalizePhone(phone);

    const variants = new Set<string>([normalized]);

    // Add international variant for matching old/saved data.
    if (normalized.startsWith("09")) {
      variants.add("218" + normalized.slice(1));
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, phone_verified")
      .in("phone", Array.from(variants))
      .limit(1);

    if (error) {
      return json(
        {
          exists: false,
          phone_verified: false,
          verified: false,
          error: "lookup_failed",
        },
        500,
        corsHeaders,
      );
    }

    const row = data?.[0];
    const phoneVerified = Boolean(row?.phone_verified);

    return json(
      {
        exists: Boolean(row),
        phone_verified: phoneVerified,
        verified: phoneVerified,
      },
      200,
      corsHeaders,
    );
  } catch (_e) {
    return json(
      {
        exists: false,
        phone_verified: false,
        verified: false,
        error: "bad_request",
      },
      400,
      corsHeaders,
    );
  }
});