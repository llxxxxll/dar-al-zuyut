// Returns whether the SMS provider (Resala) is configured.
// Public: returns only boolean + sender (no secret values).
import { corsHeadersFor } from "../_shared/resala.ts";

Deno.serve((req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeadersFor(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const configured = !!Deno.env.get("RESALA_API_KEY");
  const sender = Deno.env.get("RESALA_SENDER") || "DarAlzuyout";
  return new Response(
    JSON.stringify({ configured, sender, provider: "resala" }),
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
});