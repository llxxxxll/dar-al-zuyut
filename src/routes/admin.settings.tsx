import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Save, Loader2, Gauge, MessageSquare, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

interface SettingsState {
  oil_interval_km: number;
  oil_reminder_days: number;
  business_name: string;
  business_phone: string;
  business_address: string;
  business_email: string;
  business_whatsapp: string;
  business_maps_url: string;
  socials_facebook: string;
  socials_instagram: string;
  socials_tiktok: string;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  in_app_enabled: boolean;
  sender_name: string;
  reminder_template: string;
}

const DEFAULTS: SettingsState = {
  oil_interval_km: 5000,
  oil_reminder_days: 21,
  business_name: "دار الزيوت",
  business_phone: "0927527000",
  business_address: "الزاوية، ليبيا",
  business_email: "dar.alzuyut21@gmail.com",
  business_whatsapp: "218927527000",
  business_maps_url: "https://maps.app.goo.gl/huKzaRsULr8ARJ92A",
  socials_facebook: "",
  socials_instagram: "",
  socials_tiktok: "",
  sms_enabled: true,
  whatsapp_enabled: false,
  in_app_enabled: true,
  sender_name: "DarAlzuyout",
  reminder_template: "مرحباً {name}، اقترب موعد تغيير زيت سيارتك. زورنا في {brand}.",
};

function AdminSettings() {
  const [state, setState] = useState<SettingsState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [smsConfigured, setSmsConfigured] = useState<boolean | null>(null);
  const [smsSender, setSmsSender] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("key,value");
      const next: SettingsState = { ...DEFAULTS };
      data?.forEach((row) => {
        const v = row.value as unknown;
        const normalizedKey = row.key === "oil_change_km" ? "oil_interval_km" : row.key;
        if (normalizedKey in DEFAULTS) {
          const nextRecord = next as unknown as Record<string, unknown>;
          const value = typeof v === "object" && v !== null && "v" in (v as Record<string, unknown>)
            ? (v as { v: unknown }).v
            : v;
          const defaultsRecord = DEFAULTS as unknown as Record<string, unknown>;
          const defaultValue = defaultsRecord[normalizedKey];
          nextRecord[normalizedKey] =
            typeof defaultValue === "number" && typeof value === "string"
              ? Number(value)
              : value;
        }
      });
      setState(next);
      setLoading(false);
      // Probe SMS provider status
      try {
        const { data: status } = await supabase.functions.invoke("sms-status");
        const s = status as { configured?: boolean; sender?: string } | null;
        setSmsConfigured(!!s?.configured);
        setSmsSender(s?.sender || "");
      } catch {
        setSmsConfigured(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const rows = Object.entries(state).map(([key, value]) => ({ key, value: { v: value }, description: null, updated_at: new Date().toISOString() }));
    await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    setSavedAt(new Date());
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  // Reminder is computed from the oil change interval and the days after the last service.

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">الإعدادات العامة</h1>
        <p className="text-muted-foreground mt-1">إعدادات تتحكم في معادلة التذكير وبيانات الورشة</p>
      </div>

      {/* SMS Provider status */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 shadow-card ${
          smsConfigured === false
            ? "border-amber-300 bg-amber-50"
            : smsConfigured
              ? "border-emerald-300 bg-emerald-50/60"
              : "border-border/60 bg-card"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${
            smsConfigured === false ? "bg-amber-200 text-amber-800"
            : smsConfigured ? "bg-emerald-200 text-emerald-800"
            : "bg-muted text-muted-foreground"
          }`}>
            {smsConfigured === false ? <AlertTriangle className="size-5" /> : smsConfigured ? <CheckCircle2 className="size-5" /> : <MessageSquare className="size-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold flex items-center gap-2">
              مزود الرسائل القصيرة (Resala.ly)
              {smsConfigured === false && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">غير مهيأ</span>}
              {smsConfigured === true && <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">مفعّل</span>}
              {smsConfigured === null && <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted">جارٍ الفحص…</span>}
            </div>
            {smsConfigured === false && (
              <div className="text-sm mt-2 text-amber-900/90 leading-relaxed space-y-2">
                <p>لم يتم تعيين <code className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-xs">RESALA_API_KEY</code>. الرسائل (OTP والتذكيرات) لن تُرسل فعلياً، وسيتم تسجيلها في <strong>سجل الرسائل</strong> بحالة <code className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-xs">provider_not_configured</code> أو <code className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-xs">queued</code> لإعادة الإرسال لاحقاً.</p>
                <p>للتفعيل: أضف المفتاحين التاليين كـ Secrets في Supabase:</p>
                <ul className="list-disc pr-5 text-xs">
                  <li><code className="font-mono">RESALA_API_KEY</code> — مفتاح API من حساب Resala.ly</li>
                  <li><code className="font-mono">RESALA_SENDER</code> — اسم المرسل المعتمد (اختياري، الافتراضي: DarAlzuyout)</li>
                </ul>
                <a href="https://supabase.com/dashboard/project/_/settings/functions" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-1 text-amber-900 hover:underline font-semibold text-xs">
                  فتح Secrets في Supabase <ExternalLink className="size-3" />
                </a>
              </div>
            )}
            {smsConfigured === true && (
              <div className="text-sm mt-1 text-emerald-900/90">
                المزود مفعّل. اسم المرسل: <strong dir="ltr" className="font-mono">{smsSender}</strong>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-card">
        <div className="font-semibold inline-flex items-center gap-2 mb-4"><Gauge className="size-4 text-primary" /> معادلة التذكير</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="مسافة تغيير الزيت (كم)" hint="افتراضي: 5000 كم">
            <input type="number" className={inputCls} value={state.oil_interval_km} onChange={(e) => setState({ ...state, oil_interval_km: Number(e.target.value) })} />
          </Field>
          <Field
            label="أيام التذكير بعد آخر خدمة"
            hint="يتم إنشاء التذكير بعد تسجيل خدمة تغيير الزيت بعدد الأيام المحدد هنا."
          >
            <input type="number" className={inputCls} value={state.oil_reminder_days} onChange={(e) => setState({ ...state, oil_reminder_days: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-card border border-border/60 text-sm">
          يتم إنشاء التذكير بعد تسجيل خدمة تغيير الزيت بعد <b>{state.oil_reminder_days} يوم</b>، مع اعتماد المسافة التالية لتغيير الزيت على <b>{state.oil_interval_km} كم</b>.
        </div>
      </motion.div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
        <div className="font-semibold inline-flex items-center gap-2 mb-4"><SettingsIcon className="size-4 text-primary" /> بيانات الورشة</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="اسم العلامة التجارية"><input className={inputCls} value={state.business_name} onChange={(e) => setState({ ...state, business_name: e.target.value })} /></Field>
          <Field label="رقم التواصل"><input className={inputCls} dir="ltr" value={state.business_phone} onChange={(e) => setState({ ...state, business_phone: e.target.value })} /></Field>
          <Field label="واتساب (مع رمز الدولة)"><input className={inputCls} dir="ltr" value={state.business_whatsapp} onChange={(e) => setState({ ...state, business_whatsapp: e.target.value })} /></Field>
          <Field label="البريد الإلكتروني"><input className={inputCls} dir="ltr" value={state.business_email} onChange={(e) => setState({ ...state, business_email: e.target.value })} /></Field>
          <Field label="العنوان"><input className={inputCls} value={state.business_address} onChange={(e) => setState({ ...state, business_address: e.target.value })} /></Field>
          <Field label="رابط الموقع على الخريطة"><input className={inputCls} dir="ltr" value={state.business_maps_url} onChange={(e) => setState({ ...state, business_maps_url: e.target.value })} /></Field>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
        <div className="font-semibold inline-flex items-center gap-2 mb-4"><MessageSquare className="size-4 text-primary" /> الإشعارات والقنوات</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="اسم المرسل (Sender)"><input className={inputCls} dir="ltr" value={state.sender_name} onChange={(e) => setState({ ...state, sender_name: e.target.value })} /></Field>
          <div className="flex flex-col gap-2 text-sm pt-5">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={state.sms_enabled} onChange={(e) => setState({ ...state, sms_enabled: e.target.checked })} /> تفعيل SMS</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={state.whatsapp_enabled} onChange={(e) => setState({ ...state, whatsapp_enabled: e.target.checked })} /> تفعيل واتساب</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={state.in_app_enabled} onChange={(e) => setState({ ...state, in_app_enabled: e.target.checked })} /> إشعارات داخل التطبيق</label>
          </div>
        </div>
        <Field label="قالب الرسالة الافتراضي"><textarea rows={3} className={`${inputCls} h-auto py-2`} value={state.reminder_template} onChange={(e) => setState({ ...state, reminder_template: e.target.value })} /></Field>
        <div className="text-[11px] text-muted-foreground">المتاح: <code>{"{name}"}</code> <code>{"{brand}"}</code> <code>{"{date}"}</code></div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
        <div className="font-semibold inline-flex items-center gap-2 mb-4"><SettingsIcon className="size-4 text-primary" /> روابط السوشيال ميديا</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Facebook"><input className={inputCls} dir="ltr" value={state.socials_facebook} onChange={(e) => setState({ ...state, socials_facebook: e.target.value })} /></Field>
          <Field label="Instagram"><input className={inputCls} dir="ltr" value={state.socials_instagram} onChange={(e) => setState({ ...state, socials_instagram: e.target.value })} /></Field>
          <Field label="TikTok"><input className={inputCls} dir="ltr" value={state.socials_tiktok} onChange={(e) => setState({ ...state, socials_tiktok: e.target.value })} /></Field>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {savedAt && <div className="text-xs text-emerald-600">تم الحفظ ✓</div>}
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold shadow-elegant disabled:opacity-60 mr-auto">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}
