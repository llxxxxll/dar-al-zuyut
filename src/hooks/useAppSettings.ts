import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  business_name: string;
  business_phone: string;
  business_address: string;
  business_email: string;
  business_whatsapp: string;
  business_maps_url: string;
  socials_facebook: string;
  socials_instagram: string;
  socials_tiktok: string;
  oil_interval_km: number;
  oil_reminder_days: number;
  reminder_template: string;
}

const DEFAULTS: AppSettings = {
  business_name: "دار الزيوت",
  business_phone: "0927527000",
  business_address: "الزاوية الساحلي — بعد إشارة الضمان، طريق الخدمات غرباً",
  business_email: "dar.alzuyut21@gmail.com",
  business_whatsapp: "218927527000",
  business_maps_url: "https://maps.app.goo.gl/huKzaRsULr8ARJ92A",
  socials_facebook: "",
  socials_instagram: "",
  socials_tiktok: "",
  oil_interval_km: 5000,
  oil_reminder_days: 21,
  reminder_template: "مرّ حوالي {days} يوم من آخر تغيير زيت لسيارتك. يرجى مراجعة عداد السيارة والدخول إلى التطبيق. دار الزيوت",
};

let cache: AppSettings | null = null;

function unwrapSettingValue(raw: unknown) {
  return typeof raw === "object" && raw !== null && "v" in (raw as Record<string, unknown>)
    ? (raw as { v: unknown }).v
    : raw;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(cache ?? DEFAULTS);

  useEffect(() => {
    if (cache) return;
    (async () => {
      const { data } = await supabase.from("app_settings").select("key,value");
      const next: AppSettings = { ...DEFAULTS };
      data?.forEach((row) => {
        const normalizedKey = row.key === "oil_change_km" ? "oil_interval_km" : row.key;
        if (!(normalizedKey in DEFAULTS)) return;

        const v = unwrapSettingValue(row.value as unknown);
        const defaultValue = next[normalizedKey as keyof AppSettings];
        const nextRecord = next as unknown as Record<string, unknown>;

        if (typeof defaultValue === "string" && typeof v === "string") {
          nextRecord[normalizedKey] = v;
        }

        if (typeof defaultValue === "number" && typeof v === "number") {
          nextRecord[normalizedKey] = v;
        }

        if (typeof defaultValue === "number" && typeof v === "string") {
          const parsed = Number(v);
          if (Number.isFinite(parsed)) {
            nextRecord[normalizedKey] = parsed;
          }
        }
      });
      cache = next;
      setSettings(next);
    })();
  }, []);

  return settings;
}

export function useReminderSettings() {
  const settings = useAppSettings();

  return {
    oilIntervalKm: settings.oil_interval_km,
    oilReminderDays: settings.oil_reminder_days,
    reminderTemplate: settings.reminder_template,
  };
}
