// Verifies a phone+code combination. On success:
// - marks the code consumed
// - records verified_at so downstream registration can require a real OTP check
// - sets profiles.phone_verified = true for any profile matching the phone
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeadersFor, isValidLibyanPhone, normalizePhone, sha256Hex } from "../_shared/resala.ts";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { phone, code, purpose } = await req.json();
    if (!phone || !isValidLibyanPhone(phone)) return json({ error: "invalid_phone" }, 400, cors);
    if (!code || !/^\d{6}$/.test(String(code))) return json({ error: "invalid_code" }, 400, cors);
    const p = (purpose ?? "registration") as string;

    const phoneNorm = normalizePhone(phone);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rec, error } = await admin
      .from("otp_codes")
      .select("id, code_hash, expires_at, attempts_count, max_attempts, consumed_at")
      .eq("phone", phoneNorm).eq("purpose", p)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
    if (error) return json({ error: "lookup_failed" }, 500, cors);
    if (!rec) return json({ error: "no_active_code" }, 400, cors);

    if (new Date(rec.expires_at).getTime() < Date.now()) {
      await admin.from("otp_codes").update({ consumed_at: new Date().toISOString() }).eq("id", rec.id);
      return json({ error: "expired" }, 400, cors);
    }
    if (rec.attempts_count >= rec.max_attempts) {
      await admin.from("otp_codes").update({ consumed_at: new Date().toISOString() }).eq("id", rec.id);
      return json({ error: "too_many_attempts" }, 429, cors);
    }

    const candidate = await sha256Hex(`${phoneNorm}:${p}:${String(code)}`);
    if (candidate !== rec.code_hash) {
      await admin.from("otp_codes").update({ attempts_count: rec.attempts_count + 1 }).eq("id", rec.id);
      return json({ error: "wrong_code", remaining: rec.max_attempts - rec.attempts_count - 1 }, 400, cors);
    }

    const verifiedAt = new Date().toISOString();
    await admin.from("otp_codes").update({
      consumed_at: verifiedAt,
      verified_at: verifiedAt,
    }).eq("id", rec.id);

    // Mark phone verified on any matching profile (phone variants)
    const variants = new Set<string>([phoneNorm]);
    if (phoneNorm.startsWith("09")) variants.add("218" + phoneNorm.slice(1));
    if (phoneNorm.startsWith("2189")) variants.add("0" + phoneNorm.slice(3));
    await admin.from("profiles").update({
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    }).in("phone", Array.from(variants));

    return json({ ok: true }, 200, cors);
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
