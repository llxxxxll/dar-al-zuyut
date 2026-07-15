// Sends an OTP via Resala SMS and stores its hash in otp_codes.
// If RESALA_API_KEY is missing, logs a queued message and returns
// { provider_configured: false } so the UI can show a clear notice
// (and in development we also include the code to allow manual testing).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  corsHeadersFor, isValidLibyanPhone, normalizePhone, sendOtpViaResala,
  sha256Hex,
} from "../_shared/resala.ts";

const OTP_TTL_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;
const HOURLY_LIMIT_PER_PHONE = 5;

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { phone, purpose } = await req.json();
    if (!phone || !isValidLibyanPhone(phone)) {
      return json({ error: "invalid_phone" }, 400, cors);
    }
    const p = (purpose ?? "registration") as string;
    if (!["registration", "login", "reset"].includes(p)) {
      return json({ error: "invalid_purpose" }, 400, cors);
    }

    const phoneNorm = normalizePhone(phone);
    const ip = req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limits
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent, error: recErr } = await admin
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phoneNorm)
      .eq("purpose", p)
      .gte("created_at", sinceHour)
      .order("created_at", { ascending: false });
    if (recErr) return json({ error: "lookup_failed" }, 500, cors);

    if ((recent?.length ?? 0) >= HOURLY_LIMIT_PER_PHONE) {
      return json({ error: "rate_limited_hour" }, 429, cors);
    }
    if (recent && recent[0]) {
      const elapsed = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        return json({ error: "cooldown", retry_after: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) }, 429, cors);
      }
    }

    // Invalidate any previous unconsumed codes for this phone+purpose
    await admin.from("otp_codes").update({ consumed_at: new Date().toISOString() })
      .eq("phone", phoneNorm).eq("purpose", p).is("consumed_at", null);

    // Determine provider readiness BEFORE generating/persisting a code.
    const providerConfigured = !!Deno.env.get("RESALA_API_KEY");
    const allowDevOtp = Deno.env.get("ALLOW_DEV_OTP") === "true";

    if (!providerConfigured && !allowDevOtp) {
      // Production posture: refuse to issue an OTP we can't deliver.
      await admin.from("message_logs").insert({
        phone: phoneNorm,
        body: "[otp:not_sent] provider_not_configured",
        status: "failed",
        provider_response: "RESALA_API_KEY missing; registration blocked",
      });
      return json({
        ok: false,
        provider_configured: false,
        error: "provider_not_configured",
      }, 503, cors);
    }

    // Build the Resala phone format: international without '+', e.g. 218910024433
    const intl = phoneNorm.startsWith("0") ? "218" + phoneNorm.slice(1) : phoneNorm;

    // Ask Resala to generate + deliver the OTP
    const result = await sendOtpViaResala({ phone: intl, lang: "ar", length: 6 });

    // Diagnostic: provider outcome (no OTP content).
    console.log(JSON.stringify({
      tag: "resala_send",
      status: result.status,
      ok: result.ok,
      provider_response: result.providerResponse?.slice(0, 300) ?? null,
    }));

    if (result.ok && result.pin) {
      const codeHash = await sha256Hex(`${phoneNorm}:${p}:${result.pin}`);
      const expires = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
      const { error: insErr } = await admin.from("otp_codes").insert({
        phone: phoneNorm, code_hash: codeHash, purpose: p,
        expires_at: expires, ip_address: ip,
      });
      if (insErr) {
        console.error("otp_insert_failed", insErr.message);
        return json({ error: "insert_failed", detail: insErr.message }, 500, cors);
      }
    }

    // Log — never persist the real OTP body. Store an opaque, non-sensitive marker.
    await admin.from("message_logs").insert({
      phone: phoneNorm,
      body: "تم إرسال كود تحقق إلى العميل",
      status: result.status === "sent" ? "sent" : (result.status === "failed" ? "failed" : "queued"),
      // Persist provider response (truncated). Resala /pins response includes
      // the pin in plaintext on success — so on success we redact it.
      provider_response: result.ok
        ? `[otp:sent]`
        : `[otp:${result.status}] ${(result.providerResponse || "").slice(0, 300)}`,
      sent_at: result.status === "sent" ? new Date().toISOString() : null,
    });

    if (result.status === "provider_not_configured") {
      // Reachable only when ALLOW_DEV_OTP=true. Never expose the code otherwise.
      // Dev mode previously returned a dev code; with Resala-issued pins we
      // no longer have one to surface. Always 503 here.
      return json({
        ok: false,
        provider_configured: false,
        error: "provider_not_configured",
      }, 503, cors);
    }

    if (!result.ok) {
      return json({ ok: false, provider_configured: true, error: "send_failed" }, 502, cors);
    }
    return json({ ok: true, provider_configured: true }, 200, cors);
  } catch (e) {
    return json({ error: "bad_request", detail: String(e) }, 400, cors);
  }
});

function json(obj: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}