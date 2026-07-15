/**
 * Phone-based auth helper.
 *
 * The customer enters phone + password.
 * Internally, Supabase Auth uses a stable generated email based on the phone.
 * The customer NEVER sees this email.
 */

const PHONE_DOMAIN = "example.com";

export function normalizePhone(input: string): string {
  // Strip all non-digits: spaces, dashes, parentheses, leading "+".
  let d = (input ?? "").replace(/\D/g, "");

  // International prefixes → local:
  // 00218XXXXXXXXX or 218XXXXXXXXX → 0XXXXXXXXX
  if (d.startsWith("00218")) {
    d = "0" + d.slice(5);
  } else if (d.startsWith("218")) {
    d = "0" + d.slice(3);
  }

  return d;
}

export function isValidLibyanPhone(phone: string): boolean {
  const d = normalizePhone(phone);

  // After normalization, must be 09XXXXXXXX.
  // Allowed prefixes: 091/092/093/094/095
  return /^09[1-5]\d{7}$/.test(d);
}

/**
 * Returns a precise, user-facing Arabic error,
 * or null if the phone is valid.
 */
export function phoneInputError(input: string): string | null {
  const raw = (input ?? "").trim();

  if (!raw) return "أدخل رقم الهاتف";

  const d = normalizePhone(raw);

  if (!/^\d+$/.test(d)) {
    return "أرقام فقط مسموحة";
  }

  if (d.length < 10) {
    return "الرقم قصير جداً — أدخل 10 أرقام تبدأ بـ 09";
  }

  if (d.length > 10) {
    return "الرقم طويل جداً — أدخل 10 أرقام تبدأ بـ 09";
  }

  if (!d.startsWith("09")) {
    return "يجب أن يبدأ بـ 09 (رقم ليبي)";
  }

  if (!/^09[1-5]\d{7}$/.test(d)) {
    return "بادئة الشبكة غير صحيحة (091/092/093/094/095)";
  }

  return null;
}

export function phoneToEmail(phone: string): string {
  const digits = normalizePhone(phone).replace(/\D/g, "");

  // Internal auth email only.
  // Example: 0947950003 → p0947950003@example.com
  return `p${digits}@${PHONE_DOMAIN}`;
}

export function formatPhoneDisplay(phone: string): string {
  const d = normalizePhone(phone);

  if (d.length === 10) {
    return d.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
  }

  return d;
}