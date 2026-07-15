import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Phone, Save, Plus, Wrench, Bell, Calendar, Car as CarIcon, CheckCircle2, AlertCircle, Loader2, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatArDate, OIL_CHANGE_KM, OIL_REMINDER_DAYS } from "@/lib/reminder";
import { LoyaltyCardSection } from "@/components/admin/LoyaltyCardSection";
import { useReminderSettings } from "@/hooks/useAppSettings";

export const Route = createFileRoute("/admin/customers/$customerId")({
  component: CustomerDetail,
});

interface Profile { id: string; full_name: string | null; phone: string | null; notes: string | null; }
interface Car { id: string; make: string; model: string | null; year: number | null; plate_number: string | null; preferred_oil: string | null; odometer_value: number | null; odometer_unit: string | null; }
interface Service { id: string; service_date: string; oil_type: string | null; oil_brand: string | null; oil_viscosity: string | null; filter_changed: boolean | null; additives: string | null; staff_name: string | null; notes: string | null; car_id: string | null; odometer_value: number | null; odometer_unit: string | null; next_odometer_value: number | null; next_odometer_unit: string | null; total_amount: number | null; }
interface Reminder { id: string; due_date: string; status: string; sent_at: string | null; }

function CustomerDetail() {
  const { customerId } = Route.useParams();
  const { oilReminderDays } = useReminderSettings();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  // Service form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showCarForm, setShowCarForm] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }, { data: s }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,notes").eq("id", customerId).single(),
      supabase.from("cars").select("*").eq("user_id", customerId).order("created_at", { ascending: false }),
      supabase.from("service_records").select("*").eq("user_id", customerId).order("service_date", { ascending: false }),
      supabase.from("reminders").select("id,due_date,status,sent_at").eq("user_id", customerId).order("due_date", { ascending: true }),
    ]);
    if (p) setProfile(p as Profile);
    setCars((c ?? []) as Car[]);
    setServices((s ?? []) as Service[]);
    setReminders((r ?? []) as Reminder[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, [customerId]);

  const flash = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
      notes: profile.notes,
    }).eq("id", profile.id);
    setSavingProfile(false);
    if (error) flash("err", "تعذر الحفظ");
    else flash("ok", "تم حفظ بيانات العميل");
  };

  const upcoming = reminders.find((r) => r.status === "pending" || r.status === "due");

  if (loading || !profile) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/customers" search={{ q: "" }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="size-4" /> رجوع للعملاء
      </Link>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-elegant text-sm font-medium ${toast.kind === "ok" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
          >
            <div className="inline-flex items-center gap-2">
              {toast.kind === "ok" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-secondary/30 p-6 shadow-card"
      >
        <div className="absolute -top-16 -left-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-5">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-primary-foreground text-3xl font-extrabold shadow-elegant">
            {(profile.full_name?.trim()?.[0] ?? "؟")}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold truncate">{profile.full_name || "بدون اسم"}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
              <span className="inline-flex items-center gap-1"><Phone className="size-4" /> {profile.phone || "—"}</span>
            </div>
            {upcoming && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <Bell className="size-3.5" /> التذكير القادم: {formatArDate(upcoming.due_date)}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit profile */}
      <Card title="بيانات العميل" icon={Sparkles}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم الكامل">
            <input className={inputCls} value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          </Field>
          <Field label="رقم الجوال">
            <input className={inputCls} value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </Field>
          <Field label="ملاحظات داخلية">
            <input className={inputCls} value={profile.notes ?? ""} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} />
          </Field>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          يتم إنشاء التذكير تلقائيًا بعد آخر خدمة بعدد الأيام المحدد في الإعدادات، وحاليًا هو {oilReminderDays} يوم.
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveProfile} disabled={savingProfile} className={btnPrimary}>
            {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} حفظ
          </button>
        </div>
      </Card>

      {/* Cars */}
      <Card title="سيارات العميل" icon={CarIcon} action={<button onClick={() => setShowCarForm((v) => !v)} className={btnGhost}><Plus className="size-4" /> إضافة سيارة</button>}>
        {showCarForm && <CarForm customerId={customerId} onDone={() => { setShowCarForm(false); refresh(); flash("ok", "تمت إضافة السيارة"); }} />}
        {cars.length === 0 && !showCarForm && <Empty msg="لا توجد سيارات مسجّلة لهذا العميل" />}
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {cars.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/60 bg-secondary/40 p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{c.make} {c.model ?? ""}</div>
                <div className="text-xs text-muted-foreground mt-1 space-x-3 space-x-reverse">
                  {c.year && <span>{c.year}</span>}
                  {c.plate_number && <span>لوحة: {c.plate_number}</span>}
                  {c.preferred_oil && <span>زيت مفضل: {c.preferred_oil}</span>}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!confirm("حذف هذه السيارة؟")) return;
                  await supabase.from("cars").delete().eq("id", c.id);
                  refresh();
                }}
                className="text-muted-foreground hover:text-rose-500 shrink-0"
              ><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </Card>

      {/* Service entry */}
      <Card title="تسجيل خدمة جديدة" icon={Wrench} action={<button onClick={() => setShowServiceForm((v) => !v)} className={btnPrimary}><Plus className="size-4" /> {showServiceForm ? "إغلاق" : "خدمة جديدة"}</button>}>
        <AnimatePresence>
          {showServiceForm && (
            <ServiceForm
              customerId={customerId}
              cars={cars}
              onDone={(msg) => { setShowServiceForm(false); refresh(); flash("ok", msg); }}
              onError={(m) => flash("err", m)}
            />
          )}
        </AnimatePresence>
      </Card>

      {/* Loyalty cards */}
      <Card title="بطاقات الولاء" icon={Sparkles}>
        <LoyaltyCardSection customerId={profile.id} customerName={profile.full_name || "عميل"} />
      </Card>

      {/* Service history */}
      <Card title="سجل الخدمات" icon={Calendar}>
        {services.length === 0 ? <Empty msg="لا توجد خدمات بعد" /> : (
          <ul className="divide-y divide-border/50 -m-2">
            {services.map((s) => {
              const car = cars.find((c) => c.id === s.car_id);
              return (
                <li key={s.id} className="p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {s.oil_brand ? `${s.oil_brand} ` : ""}{s.oil_type || "خدمة زيت"}{s.oil_viscosity ? ` (${s.oil_viscosity})` : ""}
                      {s.filter_changed && <span className="mr-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">+ فلتر</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatArDate(s.service_date)}
                      {car && <> • {car.make} {car.model ?? ""}</>}
                      {s.staff_name && <> • {s.staff_name}</>}
                      {s.odometer_value != null && <> • العداد: {Math.round(s.odometer_value).toLocaleString()} {s.odometer_unit === "mile" ? "ميل" : "كم"}</>}
                      {s.total_amount != null && <> • {s.total_amount} د.ل</>}
                    </div>
                    {s.additives && <div className="text-xs text-muted-foreground mt-0.5">إضافات: {s.additives}</div>}
                    {s.notes && <div className="text-xs text-muted-foreground mt-0.5">{s.notes}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Reminders */}
      <Card title="التذكيرات" icon={Bell}>
        {reminders.length === 0 ? <Empty msg="لا توجد تذكيرات" /> : (
          <ul className="divide-y divide-border/50 -m-2">
            {reminders.map((r) => (
              <li key={r.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{formatArDate(r.due_date)}</div>
                  <div className="text-xs text-muted-foreground">{r.sent_at ? `أُرسلت في ${formatArDate(r.sent_at)}` : "لم تُرسل بعد"}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  r.status === "sent" ? "bg-emerald-100 text-emerald-700" :
                  r.status === "due" ? "bg-amber-100 text-amber-800" :
                  r.status === "completed" ? "bg-muted text-muted-foreground" :
                  "bg-primary/10 text-primary"
                }`}>{statusAr(r.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function statusAr(s: string) {
  return ({ pending: "معلّق", due: "مستحق", sent: "أُرسلت", completed: "مكتمل", snoozed: "مؤجّل" } as Record<string, string>)[s] ?? s;
}

const inputCls = "w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const btnPrimary = "inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm shadow-elegant hover:opacity-95 disabled:opacity-60";
const btnGhost = "inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-card text-sm hover:bg-muted/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>{children}</label>;
}
function Card({ title, icon: Icon, action, children }: { title: string; icon: React.ComponentType<{ className?: string }>; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="inline-flex items-center gap-2 font-semibold"><Icon className="size-4 text-primary" /> {title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}
function Empty({ msg }: { msg: string }) { return <div className="py-8 text-center text-sm text-muted-foreground">{msg}</div>; }

function CarForm({ customerId, onDone }: { customerId: string; onDone: () => void }) {
  const [form, setForm] = useState({ make: "", model: "", year: "", plate_number: "", preferred_oil: "" });
  const [saving, setSaving] = useState(false);
  return (
    <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-xl bg-secondary/40 border border-border/50">
      <input className={inputCls} placeholder="الصانع (مثال: تويوتا)" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
      <input className={inputCls} placeholder="الموديل (مثال: كامري)" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
      <input className={inputCls} placeholder="السنة" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
      <input className={inputCls} placeholder="رقم اللوحة" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} />
      <input className={`${inputCls} sm:col-span-2`} placeholder="الزيت المفضّل (اختياري)" value={form.preferred_oil} onChange={(e) => setForm({ ...form, preferred_oil: e.target.value })} />
      <div className="sm:col-span-2 flex justify-end">
        <button
          disabled={saving || !form.make.trim()}
          onClick={async () => {
            setSaving(true);
            await supabase.from("cars").insert({
              user_id: customerId, make: form.make.trim(),
              model: form.model.trim() || null,
              year: form.year ? Number(form.year) : null,
              plate_number: form.plate_number.trim() || null,
              preferred_oil: form.preferred_oil.trim() || null,
            });
            setSaving(false); onDone();
          }}
          className={btnPrimary}
        >{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} حفظ السيارة</button>
      </div>
    </div>
  );
}

function ServiceForm({ customerId, cars, onDone, onError }: {
  customerId: string; cars: Car[]; onDone: (msg: string) => void; onError: (m: string) => void;
}) {
  const { oilIntervalKm, oilReminderDays } = useReminderSettings();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    service_date: today,
    car_id: cars[0]?.id ?? "",
    service_id: "",
    oil_brand: "",
    oil_type: "",
    oil_viscosity: "",
    filter_changed: true,
    additives: "",
    staff_name: "",
    odometer_value: "",
    odometer_unit: "km" as "km" | "mile",
    total_amount: "",
    notes: "",
    customer_notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<{ id: string; name: string; price: number | null }[]>([]);
  useEffect(() => {
    supabase.from("services").select("id,name,price").eq("is_active", true).order("sort_order").then(({ data }) => setCatalog(data ?? []));
  }, []);
  // Selected car's current odometer — used as minimum allowed service reading.
  const selectedCar = cars.find((c) => c.id === form.car_id);
  const currentOd = selectedCar?.odometer_value ?? null;
  const od = Number(form.odometer_value);
  const odValid = Number.isFinite(od) && od > 0;
  const intervalKm = oilIntervalKm || OIL_CHANGE_KM;
  const reminderDays = oilReminderDays || OIL_REMINDER_DAYS;
  const increment = form.odometer_unit === "mile" ? Math.round(intervalKm / 1.60934) : intervalKm;
  const nextOd = odValid ? od + increment : null;
  const belowCurrent = odValid && currentOd != null && od < currentOd;
  const canSave = odValid && !belowCurrent && !!form.car_id;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="grid sm:grid-cols-2 gap-3 pt-2">
        <Field label="تاريخ الخدمة"><input type="date" className={inputCls} value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} /></Field>
        <Field label="السيارة">
          <select className={inputCls} value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })}>
            <option value="">— غير محدد —</option>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.make} {c.model ?? ""} {c.plate_number ? `(${c.plate_number})` : ""}</option>)}
          </select>
        </Field>
        <Field label="نوع الخدمة">
          <select className={inputCls} value={form.service_id} onChange={(e) => {
            const s = catalog.find((x) => x.id === e.target.value);
            setForm({ ...form, service_id: e.target.value, total_amount: s?.price != null ? String(s.price) : form.total_amount });
          }}>
            <option value="">— تغيير زيت —</option>
            {catalog.map((s) => <option key={s.id} value={s.id}>{s.name}{s.price != null ? ` — ${s.price} د.ل` : ""}</option>)}
          </select>
        </Field>
        <Field label="ماركة الزيت"><input className={inputCls} placeholder="Shell / Mobil / Castrol" value={form.oil_brand} onChange={(e) => setForm({ ...form, oil_brand: e.target.value })} /></Field>
        <Field label="نوع الزيت"><input className={inputCls} placeholder="Synthetic / Semi" value={form.oil_type} onChange={(e) => setForm({ ...form, oil_type: e.target.value })} /></Field>
        <Field label="اللزوجة"><input className={inputCls} placeholder="5W-30" dir="ltr" value={form.oil_viscosity} onChange={(e) => setForm({ ...form, oil_viscosity: e.target.value })} /></Field>
        <Field label="قراءة العدّاد وقت الخدمة *">
          <div className="flex gap-2">
            <input type="number" inputMode="numeric" required min={currentOd ?? 0} className={inputCls} placeholder={currentOd ? `الحد الأدنى: ${currentOd.toLocaleString()}` : "مثال: 45000"} value={form.odometer_value} onChange={(e) => setForm({ ...form, odometer_value: e.target.value })} />
            <select className={`${inputCls} w-24`} value={form.odometer_unit} onChange={(e) => setForm({ ...form, odometer_unit: e.target.value as "km" | "mile" })}>
              <option value="km">كم</option>
              <option value="mile">ميل</option>
            </select>
          </div>
          {currentOd != null && (
            <div className="text-[11px] text-muted-foreground mt-1">
              قراءة السيارة الحالية: {currentOd.toLocaleString()} {selectedCar?.odometer_unit === "mile" ? "ميل" : "كم"}
            </div>
          )}
          {belowCurrent && (
            <div className="text-[11px] text-rose-600 font-semibold mt-1">
              لا يمكن أن تكون قراءة العدّاد أقل من القراءة الحالية للسيارة.
            </div>
          )}
        </Field>
        <Field label="المبلغ الإجمالي (د.ل)"><input type="number" step="0.01" className={inputCls} value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></Field>
        <Field label="الإضافات"><input className={inputCls} placeholder="إضافات (اختياري)" value={form.additives} onChange={(e) => setForm({ ...form, additives: e.target.value })} /></Field>
        <Field label="الموظف المنفّذ"><input className={inputCls} value={form.staff_name} onChange={(e) => setForm({ ...form, staff_name: e.target.value })} /></Field>
        <label className="flex items-center gap-2 self-end pb-2">
          <input type="checkbox" checked={form.filter_changed} onChange={(e) => setForm({ ...form, filter_changed: e.target.checked })} className="size-4" />
          <span className="text-sm">تم تغيير الفلتر</span>
        </label>
        <Field label="ملاحظات داخلية"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <Field label="ملاحظة للعميل (تظهر له)"><input className={inputCls} value={form.customer_notes} onChange={(e) => setForm({ ...form, customer_notes: e.target.value })} /></Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-l from-primary/10 to-transparent border border-primary/20">
        <div className="text-sm space-y-0.5">
          <div>
            <span className="text-muted-foreground">تذكير تلقائي بعد:</span>{" "}
            <span className="font-bold text-primary">{reminderDays} يوم</span>
          </div>
          {nextOd && (
            <div>
              <span className="text-muted-foreground">العداد المتوقّع للتغيير القادم:</span>{" "}
              <span className="font-bold text-primary">{nextOd.toLocaleString()} {form.odometer_unit === "mile" ? "ميل" : "كم"}</span>
            </div>
          )}
        </div>
        <button
          disabled={saving || !canSave}
          onClick={async () => {
            if (!odValid) { onError("قراءة العدّاد مطلوبة"); return; }
            if (belowCurrent) { onError("القراءة أقل من العدّاد الحالي للسيارة"); return; }
            if (!form.car_id) { onError("اختر السيارة"); return; }
            setSaving(true);
            // Mark previous open reminders as completed BEFORE insert so the trigger's
            // new reminder remains the only pending one.
            await supabase.from("reminders").update({ status: "completed" })
              .eq("user_id", customerId).in("status", ["pending", "due"]);

            const { error } = await supabase.from("service_records").insert({
              user_id: customerId,
              car_id: form.car_id || null,
              service_id: form.service_id || null,
              service_date: form.service_date,
              oil_brand: form.oil_brand.trim() || null,
              oil_type: form.oil_type.trim() || null,
              oil_viscosity: form.oil_viscosity.trim() || null,
              filter_changed: form.filter_changed,
              additives: form.additives.trim() || null,
              staff_name: form.staff_name.trim() || null,
              odometer_value: Number(form.odometer_value),
              odometer_unit: form.odometer_unit,
              total_amount: form.total_amount ? Number(form.total_amount) : null,
              customer_notes: form.customer_notes.trim() || null,
              notes: form.notes.trim() || null,
            });
            setSaving(false);
            if (error) { onError("تعذر حفظ الخدمة"); return; }
            const unitLabel = form.odometer_unit === "mile" ? "ميل" : "كم";
            onDone(`تم تسجيل الخدمة. التغيير القادم عند ${nextOd?.toLocaleString()} ${unitLabel}، والتذكير بعد ${reminderDays} يوم.`);
          }}
          className={btnPrimary}
        >{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} تسجيل الخدمة</button>
      </div>
    </motion.div>
  );
}
