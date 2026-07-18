import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Save, Loader2, CheckCircle2, AlertCircle, Zap, User, Car as CarIcon, Gauge, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OIL_CHANGE_KM, OIL_REMINDER_DAYS } from "@/lib/reminder";
import { useReminderSettings } from "@/hooks/useAppSettings";
import { DraftControls } from "@/components/shared/DraftControls";
import { useLocalDraft } from "@/hooks/useLocalDraft";

export const Route = createFileRoute("/admin/quick-service")({
  component: QuickService,
});

interface Customer { id: string; full_name: string | null; phone: string | null; }
interface Car { id: string; make: string; model: string | null; plate_number: string | null; odometer_value: number | null; odometer_unit: string | null; }
const EMPTY_QUICK_SERVICE_DRAFT = {
  q: "",
  customer: null as Customer | null,
  carId: "",
  odometer: "",
  unit: "km" as "km" | "mile",
  showMore: false,
  oilBrand: "",
  oilType: "",
  filterChanged: true,
  amount: "",
};

function QuickService() {
  const navigate = useNavigate();
  const { oilIntervalKm, oilReminderDays } = useReminderSettings();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState("");
  const [odometer, setOdometer] = useState("");
  const [unit, setUnit] = useState<"km" | "mile">("km");
  const [showMore, setShowMore] = useState(false);
  const [oilBrand, setOilBrand] = useState("");
  const [oilType, setOilType] = useState("");
  const [filterChanged, setFilterChanged] = useState(true);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const loadCarsForCustomer = async (customerId: string, preferredCarId?: string) => {
    const { data } = await supabase.from("cars")
      .select("id,make,model,plate_number,odometer_value,odometer_unit")
      .eq("user_id", customerId).order("created_at", { ascending: false });
    const list = (data ?? []) as Car[];
    setCars(list);
    const selected = (preferredCarId && list.find((car) => car.id === preferredCarId)) || list[0];
    setCarId(selected?.id ?? "");
    setUnit((selected?.odometer_unit as "km" | "mile") || "km");
    return list;
  };

  const quickDraft = {
    q,
    customer,
    carId,
    odometer,
    unit,
    showMore,
    oilBrand,
    oilType,
    filterChanged,
    amount,
  };

  const { clearDraft, hasDraft, restored } = useLocalDraft({
    storageKey: "daralzuyut:quick-service:draft",
    value: quickDraft,
    onRestore: (draft) => {
      setQ(draft.q ?? EMPTY_QUICK_SERVICE_DRAFT.q);
      setOdometer(draft.odometer ?? EMPTY_QUICK_SERVICE_DRAFT.odometer);
      setUnit(draft.unit ?? EMPTY_QUICK_SERVICE_DRAFT.unit);
      setShowMore(draft.showMore ?? EMPTY_QUICK_SERVICE_DRAFT.showMore);
      setOilBrand(draft.oilBrand ?? EMPTY_QUICK_SERVICE_DRAFT.oilBrand);
      setOilType(draft.oilType ?? EMPTY_QUICK_SERVICE_DRAFT.oilType);
      setFilterChanged(draft.filterChanged ?? EMPTY_QUICK_SERVICE_DRAFT.filterChanged);
      setAmount(draft.amount ?? EMPTY_QUICK_SERVICE_DRAFT.amount);
      if (draft.customer) {
        setCustomer(draft.customer);
        setQ(draft.customer.full_name || draft.customer.phone || draft.q || "");
        void loadCarsForCustomer(draft.customer.id, draft.carId).then(() => {
          setCarId(draft.carId || "");
          setUnit(draft.unit ?? EMPTY_QUICK_SERVICE_DRAFT.unit);
        });
      }
    },
    debounceMs: 800,
    shouldSave: (draft) =>
      Boolean(
        draft.q.trim() ||
        draft.customer?.id ||
        draft.carId ||
        draft.odometer ||
        draft.oilBrand.trim() ||
        draft.oilType.trim() ||
        draft.amount ||
        draft.showMore,
      ),
  });

  // Live search
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2 || customer) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data: customerRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "customer");
      const customerIds = Array.from(new Set((customerRoles ?? []).map((row) => row.user_id)));
      if (!customerIds.length) {
        setResults([]);
        setSearching(false);
        return;
      }
      const { data } = await supabase
        .from("profiles").select("id,full_name,phone")
        .in("id", customerIds)
        .or(`full_name.ilike.%${s}%,phone.ilike.%${s}%`)
        .limit(8);
      setResults((data ?? []) as Customer[]);
      setSearching(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, customer]);

  const pickCustomer = async (c: Customer) => {
    setCustomer(c); setResults([]); setQ(c.full_name || c.phone || "");
    await loadCarsForCustomer(c.id);
  };

  const reset = () => {
    setCustomer(EMPTY_QUICK_SERVICE_DRAFT.customer);
    setCars([]);
    setCarId(EMPTY_QUICK_SERVICE_DRAFT.carId);
    setOdometer(EMPTY_QUICK_SERVICE_DRAFT.odometer);
    setQ(EMPTY_QUICK_SERVICE_DRAFT.q);
    setUnit(EMPTY_QUICK_SERVICE_DRAFT.unit);
    setOilBrand(EMPTY_QUICK_SERVICE_DRAFT.oilBrand);
    setOilType(EMPTY_QUICK_SERVICE_DRAFT.oilType);
    setFilterChanged(EMPTY_QUICK_SERVICE_DRAFT.filterChanged);
    setAmount(EMPTY_QUICK_SERVICE_DRAFT.amount);
    setShowMore(EMPTY_QUICK_SERVICE_DRAFT.showMore);
  };

  const selectedCar = cars.find((c) => c.id === carId);
  const currentOd = selectedCar?.odometer_value ?? null;
  const od = Number(odometer);
  const odValid = Number.isFinite(od) && od > 0;
  const belowCurrent = odValid && currentOd != null && od < currentOd;
  const intervalKm = oilIntervalKm || OIL_CHANGE_KM;
  const reminderDays = oilReminderDays || OIL_REMINDER_DAYS;
  const increment = unit === "mile" ? Math.round(intervalKm / 1.60934) : intervalKm;
  const nextOd = odValid ? od + increment : null;
  const canSave = !!customer && !!carId && odValid && !belowCurrent && !saving;

  const save = async () => {
    if (!canSave || !customer) return;
    setSaving(true); setStatus(null);
    // close open reminders so trigger's new reminder is the only pending one
    await supabase.from("reminders").update({ status: "completed" })
      .eq("user_id", customer.id).in("status", ["pending", "due"]);
    const { error } = await supabase.from("service_records").insert({
      user_id: customer.id,
      car_id: carId,
      service_date: new Date().toISOString().slice(0, 10),
      oil_brand: oilBrand.trim() || null,
      oil_type: oilType.trim() || null,
      filter_changed: filterChanged,
      odometer_value: od,
      odometer_unit: unit,
      total_amount: amount ? Number(amount) : null,
    });
    setSaving(false);
    if (error) { setStatus({ kind: "err", msg: "تعذّر حفظ الخدمة" }); return; }
    setStatus({
      kind: "ok",
      msg: `تم التسجيل. القادم عند ${nextOd?.toLocaleString()} ${unit === "mile" ? "ميل" : "كم"} — تذكير بعد ${reminderDays} يوم.`,
    });
    clearDraft();
    setTimeout(() => { setStatus(null); reset(); }, 3500);
  };

  const inputCls = "w-full h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold inline-flex items-center gap-2">
          <Zap className="size-6 text-primary" /> تسجيل خدمة سريع
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          خطوة واحدة: ابحث عن العميل، أدخل قراءة العدّاد، احفظ. النظام سيحسب الموعد القادم تلقائيًا.
        </p>
      </div>

      {status && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold inline-flex items-center gap-2 w-full ${status.kind === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
          {status.kind === "ok" ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />} {status.msg}
        </div>
      )}

      <DraftControls
        restored={restored}
        hasDraft={hasDraft}
        onClear={() => {
          clearDraft();
          reset();
        }}
      />

      {/* Step 1: customer */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="text-xs font-bold text-muted-foreground inline-flex items-center gap-2"><User className="size-3.5" /> ١ — العميل</div>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); if (customer) setCustomer(null); }}
            placeholder="ابحث بالاسم أو رقم الجوال…"
            className={`${inputCls} pr-11`}
            autoFocus
          />
          {searching && <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
        </div>
        {results.length > 0 && !customer && (
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {results.map((r) => (
              <button key={r.id} onClick={() => pickCustomer(r)} className="w-full flex items-center justify-between p-3 hover:bg-muted/40 text-right">
                <div>
                  <div className="font-semibold">{r.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.phone || "—"}</div>
                </div>
                <ChevronDown className="size-4 text-muted-foreground -rotate-90" />
              </button>
            ))}
          </div>
        )}
        {customer && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div>
              <div className="font-bold">{customer.full_name || "عميل"}</div>
              <div className="text-xs text-muted-foreground">{customer.phone}</div>
            </div>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground underline">تغيير</button>
          </div>
        )}
      </div>

      {/* Step 2: car */}
      {customer && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="text-xs font-bold text-muted-foreground inline-flex items-center gap-2"><CarIcon className="size-3.5" /> ٢ — السيارة</div>
          {cars.length === 0 ? (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <span>لا توجد سيارة مسجّلة لهذا العميل.</span>
              <button onClick={() => navigate({ to: "/admin/customers/$customerId", params: { customerId: customer.id } })} className="text-xs font-bold underline">فتح ملف العميل</button>
            </div>
          ) : (
            <div className="grid gap-2">
              {cars.map((c) => (
                <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${carId === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <input type="radio" checked={carId === c.id} onChange={() => { setCarId(c.id); setUnit((c.odometer_unit as "km" | "mile") || "km"); }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{c.make} {c.model ?? ""} {c.plate_number ? <span className="text-xs text-muted-foreground">— {c.plate_number}</span> : null}</div>
                    {c.odometer_value != null && (
                      <div className="text-xs text-muted-foreground">آخر قراءة: {c.odometer_value.toLocaleString()} {c.odometer_unit === "mile" ? "ميل" : "كم"}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: odometer */}
      {customer && carId && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="text-xs font-bold text-muted-foreground inline-flex items-center gap-2"><Gauge className="size-3.5" /> ٣ — قراءة العدّاد وقت الخدمة</div>
          <div className="flex gap-2">
            <input
              type="number" inputMode="numeric" required
              min={currentOd ?? 0}
              className={`${inputCls} text-2xl font-extrabold tracking-wider`}
              placeholder={currentOd ? `الحد الأدنى: ${currentOd.toLocaleString()}` : "مثال: 45000"}
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              autoFocus
            />
            <select className={`${inputCls} w-24`} value={unit} onChange={(e) => setUnit(e.target.value as "km" | "mile")}>
              <option value="km">كم</option>
              <option value="mile">ميل</option>
            </select>
          </div>
          {belowCurrent && (
            <div className="text-xs text-rose-600 font-semibold">القراءة أقل من العدّاد الحالي للسيارة.</div>
          )}
          {nextOd && !belowCurrent && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-2.5">
              التغيير القادم عند <b>{nextOd.toLocaleString()} {unit === "mile" ? "ميل" : "كم"}</b> — تذكير بعد {reminderDays} يوم.
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {showMore ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            تفاصيل إضافية (اختياري)
          </button>
          {showMore && (
            <div className="grid sm:grid-cols-2 gap-2 pt-2">
              <input className={inputCls} placeholder="ماركة الزيت" value={oilBrand} onChange={(e) => setOilBrand(e.target.value)} />
              <input className={inputCls} placeholder="نوع الزيت (Synthetic…)" value={oilType} onChange={(e) => setOilType(e.target.value)} />
              <input type="number" step="0.01" className={inputCls} placeholder="المبلغ (د.ل)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <label className="inline-flex items-center gap-2 px-3 rounded-xl border border-border bg-background text-sm">
                <input type="checkbox" checked={filterChanged} onChange={(e) => setFilterChanged(e.target.checked)} />
                تم تغيير الفلتر
              </label>
            </div>
          )}
        </div>
      )}

      {/* Save */}
      {customer && carId && (
        <button
          disabled={!canSave}
          onClick={save}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-extrabold text-base shadow-elegant disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          حفظ الخدمة
        </button>
      )}
    </div>
  );
}
