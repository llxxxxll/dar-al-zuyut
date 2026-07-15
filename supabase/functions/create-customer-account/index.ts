import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeadersFor, isValidLibyanPhone, normalizePhone } from "../_shared/resala.ts";

const OTP_VALID_WINDOW_MS = 10 * 60 * 1000;

type CarPayload = {
  make?: string;
  model?: string;
  year?: number | null;
  plate?: string;
  preferredOil?: string;
  odometer?: number | null;
  odometerUnit?: "km" | "mile";
};

function normalizePhoneForAuth(input: string): string {
  let digits = (input ?? "").replace(/\D/g, "");

  if (digits.startsWith("00218")) {
    digits = "0" + digits.slice(5);
  } else if (digits.startsWith("218")) {
    digits = "0" + digits.slice(3);
  }

  return digits;
}

function phoneToEmail(phone: string): string {
  return `p${normalizePhoneForAuth(phone)}@example.com`;
}

function buildPhoneVariants(phone: string): string[] {
  const local = normalizePhoneForAuth(phone);
  const variants = new Set<string>([local]);

  if (local.startsWith("09")) {
    variants.add(`218${local.slice(1)}`);
  }

  const digitsOnly = normalizePhone(phone);
  if (digitsOnly) {
    variants.add(digitsOnly);
  }

  return Array.from(variants);
}

function json(obj: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const {
      fullName,
      phone,
      password,
      car,
    } = await req.json() as {
      fullName?: string;
      phone?: string;
      password?: string;
      car?: CarPayload | null;
    };

    if (!phone || !isValidLibyanPhone(phone)) {
      return json({ error: "invalid_phone" }, 200, cors);
    }

    const trimmedName = fullName?.trim() ?? "";
    if (!trimmedName) {
      return json({ error: "missing_full_name" }, 200, cors);
    }

    const trimmedPassword = password?.trim() ?? "";
    if (trimmedPassword.length < 6) {
      return json({ error: "weak_password" }, 200, cors);
    }

    const otpLookupPhone = normalizePhone(phone);
    const profilePhone = normalizePhoneForAuth(phone);
    const email = phoneToEmail(phone);
    const phoneVariants = buildPhoneVariants(phone);
    const nowIso = new Date().toISOString();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: latestOtp, error: otpError } = await admin
      .from("otp_codes")
      .select("id, verified_at, created_at")
      .eq("phone", otpLookupPhone)
      .eq("purpose", "registration")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("otp_lookup_failed", otpError.message);
      return json({ error: "otp_lookup_failed" }, 500, cors);
    }

    if (!latestOtp?.verified_at) {
      return json({ error: "missing_verified_otp" }, 200, cors);
    }

    const verifiedAge = Date.now() - new Date(latestOtp.verified_at).getTime();
    if (!Number.isFinite(verifiedAge) || verifiedAge > OTP_VALID_WINDOW_MS) {
      return json({ error: "otp_verification_expired" }, 200, cors);
    }

    const { data: existingProfile, error: existingProfileError } = await admin
      .from("profiles")
      .select("id")
      .in("phone", phoneVariants)
      .limit(1)
      .maybeSingle();

    if (existingProfileError) {
      console.error("profile_lookup_failed", existingProfileError.message);
      return json({ error: "profile_lookup_failed" }, 500, cors);
    }

    if (existingProfile) {
      return json({ error: "phone_exists" }, 200, cors);
    }

    const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password: trimmedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        phone: profilePhone,
      },
    });

    if (createUserError) {
      const message = createUserError.message.toLowerCase();
      if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
        return json({ error: "phone_exists" }, 200, cors);
      }
      console.error("create_user_failed", createUserError.message);
      return json({ error: "create_user_failed" }, 500, cors);
    }

    const userId = createdUserData.user?.id;
    if (!userId) {
      return json({ error: "create_user_failed" }, 500, cors);
    }

    try {
      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        full_name: trimmedName,
        phone: profilePhone,
        phone_verified: true,
        phone_verified_at: nowIso,
      });

      if (profileError) {
        throw new Error(`profile_upsert_failed:${profileError.message}`);
      }

      const { error: roleError } = await admin.from("user_roles").upsert({
        user_id: userId,
        role: "customer",
      }, {
        onConflict: "user_id,role",
      });

      if (roleError) {
        throw new Error(`role_upsert_failed:${roleError.message}`);
      }

      const hasCar =
        !!car &&
        typeof car === "object" &&
        typeof car.make === "string" &&
        car.make.trim().length > 0;

      if (hasCar) {
        const parsedYear = typeof car.year === "number" && Number.isFinite(car.year) ? car.year : null;
        const parsedOdometer = typeof car.odometer === "number" && Number.isFinite(car.odometer) ? car.odometer : null;

        const { error: carError } = await admin.from("cars").insert({
          user_id: userId,
          make: car.make!.trim(),
          model: typeof car.model === "string" && car.model.trim() ? car.model.trim() : null,
          year: parsedYear,
          plate_number: typeof car.plate === "string" && car.plate.trim() ? car.plate.trim() : null,
          preferred_oil: typeof car.preferredOil === "string" && car.preferredOil.trim() ? car.preferredOil.trim() : null,
          odometer_value: parsedOdometer,
          odometer_unit: car.odometerUnit === "mile" ? "mile" : "km",
        });

        if (carError) {
          throw new Error(`car_insert_failed:${carError.message}`);
        }
      }
    } catch (persistError) {
      console.error("registration_persist_failed", String(persistError));
      await admin.auth.admin.deleteUser(userId);
      return json({ error: "registration_persist_failed" }, 500, cors);
    }

    return json({ ok: true }, 200, cors);
  } catch (error) {
    console.error("create_customer_account_bad_request", String(error));
    return json({ error: "bad_request" }, 400, cors);
  }
});
