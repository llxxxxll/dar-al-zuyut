// Sends a reminder SMS via Resala.
// Modes:
//   - Single: POST { reminder_id } sends one reminder.
//   - Batch:  POST {} (or no body) processes all pending reminders due today/earlier.
// Respects app_settings.sms_enabled. If RESALA_API_KEY is missing, logs
// each attempt as provider_not_configured WITHOUT failing.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeadersFor, normalizePhone, sendSmsViaResala, toE164Libya } from "../_shared/resala.ts";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    let payload: { reminder_id?: string } = {};
    try { payload = await req.json(); } catch { /* empty body = batch */ }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load shared settings once.
    const { data: enabledSet } = await admin
      .from("app_settings").select("value").eq("key", "sms_enabled").maybeSingle();
    const smsEnabled = !!(enabledSet?.value as { v?: boolean } | null)?.v;
    const { data: tpl } = await admin
      .from("app_settings").select("value").eq("key", "reminder_template").maybeSingle();
    const { data: daysSet } = await admin
      .from("app_settings").select("value").eq("key", "oil_reminder_days").maybeSingle();
    const days = Number((daysSet?.value as { v?: number } | null)?.v ?? 21);
    const template = (tpl?.value as { v?: string } | null)?.v
      ?? "حان وقت مراجعة عداد سيارتك. دار الزيوت";
    const providerConfigured = !!Deno.env.get("RESALA_API_KEY");

    async function processOne(reminderId: string) {
      const { data: r } = await admin
        .from("reminders")
        .select("id, user_id, due_date, status")
        .eq("id", reminderId).maybeSingle();
      if (!r) return { id: reminderId, status: "not_found" };

      const { data: prof } = await admin
        .from("profiles").select("phone").eq("id", r.user_id).maybeSingle();
      if (!prof?.phone) {
        await admin.from("message_logs").insert({
          user_id: r.user_id, reminder_id: r.id, phone: "",
          body: "[reminder] no_phone", status: "failed",
          provider_response: "profile missing phone",
        });
        return { id: r.id, status: "no_phone" };
      }
      const body = template.replace("{days}", String(days));

      // Skip if SMS disabled or provider missing — log without sending.
      if (!smsEnabled || !providerConfigured) {
        await admin.from("message_logs").insert({
          user_id: r.user_id, reminder_id: r.id,
          phone: normalizePhone(prof.phone), body,
          status: !providerConfigured ? "provider_not_configured" : "disabled",
          provider_response: !providerConfigured
            ? "RESALA_API_KEY not set"
            : "sms_enabled=false",
        });
        return { id: r.id, status: !providerConfigured ? "provider_not_configured" : "disabled" };
      }

      const result = await sendSmsViaResala({ to: toE164Libya(prof.phone), body });
      await admin.from("message_logs").insert({
        user_id: r.user_id, reminder_id: r.id,
        phone: normalizePhone(prof.phone), body,
        status: result.status === "sent" ? "sent" : (result.status === "failed" ? "failed" : "queued"),
        provider_response: `[${result.status}] ${result.providerResponse}`,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      });
      if (result.status === "sent") {
        await admin.from("reminders").update({
          status: "sent", sent_at: new Date().toISOString(),
        }).eq("id", r.id);
      }
      return { id: r.id, status: result.status };
    }

    // Single mode.
    if (payload.reminder_id) {
      const out = await processOne(payload.reminder_id);
      return json({ ok: true, provider_configured: providerConfigured, sms_enabled: smsEnabled, result: out }, 200, cors);
    }

    // Batch mode: pending reminders due today or earlier.
    const today = new Date().toISOString().slice(0, 10);
    const { data: due } = await admin
      .from("reminders")
      .select("id")
      .eq("status", "pending")
      .lte("due_date", today)
      .limit(500);

    const results: Array<{ id: string; status: string }> = [];
    for (const row of due ?? []) {
      results.push(await processOne(row.id));
    }
    return json({
      ok: true,
      provider_configured: providerConfigured,
      sms_enabled: smsEnabled,
      processed: results.length,
      summary: results.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
      }, {}),
    }, 200, cors);
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