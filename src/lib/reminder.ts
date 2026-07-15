// Reminder calculation logic
// The fallback policy is based on the last service date plus a fixed
// reminder window, and the next oil change interval.

export const OIL_CHANGE_KM = 5000;
export const OIL_REMINDER_DAYS = 21;

export function computeDueDate(fromISO: string, days: number = OIL_REMINDER_DAYS): Date {
  const base = new Date(fromISO);
  base.setDate(base.getDate() + (Number.isFinite(days) ? days : OIL_REMINDER_DAYS));
  return base;
}

export function formatArDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    year: "numeric", month: "long", day: "numeric",
  }).format(date);
}
