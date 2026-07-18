import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Loader2, CheckCircle2, AlertCircle, Wrench, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatArDate } from "@/lib/reminder";

interface Car { id: string; make: string; model: string | null; }
interface Appointment {
  id: string; requested_date: string; time_slot: string;
  service_type: string; status: string; notes: string | null;
  car_id: string | null; admin_notes: string | null;
  service_id?: string | null;
}

const SLOTS = [
  { v: "morning", l: "صباحاً (8 - 12)" },
  { v: "afternoon", l: "ظهراً (12 - 4)" },
  { v: "evening", l: "مساءً (4 - 8)" },
] as const;

interface DbService { id: string; name: string; slug: string; }

export function AppointmentBooking({ userId, cars }: { userId: string; cars: Car[] }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<DbService[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<(typeof SLOTS)[number]["v"]>("morning");
  const [serviceId, setServiceId] = useState<string>("");
  const [carId, setCarId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const refresh = async () => {
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from("appointments")
        .select("id,requested_date,time_slot,service_type,status,notes,car_id,admin_notes,service_id")
        .eq("user_id", userId)
        .order("requested_date", { ascending: false }),
      supabase.from("services").select("id,name,slug").eq("is_active", true).order("sort_order"),
    ]);
    setAppointments((a ?? []) as Appointment[]);
    const list = (s ?? []) as DbService[];
    setServices(list);
    if (!serviceId && list[0]) setServiceId(list[0].id);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  const submit = async () => {
    if (!date) { setMsg({ kind: "err", text: "اختر تاريخ الموعد" }); return; }
    setSaving(true);
    const svc = services.find((x) => x.id === serviceId);
    const { error } = await supabase.from("appointments").insert({
      user_id: userId,
      car_id: carId || null,
      requested_date: date,
      time_slot: slot,
      service_type: svc?.slug ?? svc?.name ?? "service",
      service_id: serviceId || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      setMsg({ kind: "err", text: "تعذّر حجز الموعد. حاول مرة أخرى." });
    } else {
      setMsg({ kind: "ok", text: "تم إرسال طلب موعدك! سنؤكده قريباً." });
      setDate(""); setNotes(""); setShowForm(false);
      refresh();
    }
    setTimeout(() => setMsg(null), 3500);
  };

  const cancel = async (id: string) => {
    if (!confirm("هل تريد إلغاء هذا الموعد؟")) return;
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    refresh();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { l: string; c: string }> = {
      pending: { l: "قيد المراجعة", c: "bg-amber-100 text-amber-700" },
      confirmed: { l: "مؤكد", c: "bg-emerald-100 text-emerald-700" },
      done: { l: "تم", c: "bg-blue-100 text-blue-700" },
      cancelled: { l: "ملغي", c: "bg-rose-100 text-rose-700" },
    };
    const v = map[s] ?? { l: s, c: "bg-gray-100 text-gray-700" };
    return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${v.c}`}>{v.l}</span>;
  };

  return (
    <div className="min-w-0">
      {msg && (
        <div className={`mb-4 flex items-start gap-3 p-4 rounded-xl border text-sm ${
          msg.kind === "ok" ? "bg-success/10 border-success/30 text-success" : "bg-destructive/10 border-destructive/30 text-destructive"
        }`}>
          {msg.kind === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
          <span>{msg.text}</span>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-105 transition-all mb-6"
        >
          <Calendar className="h-5 w-5" /> احجز موعد جديد
        </button>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden mb-6">
          <div className="min-w-0 space-y-4 rounded-2xl border border-border bg-secondary/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="min-w-0 text-lg font-extrabold">حجز موعد</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-card">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">التاريخ</label>
                <input
                  type="date"
                  min={tomorrow}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">الفترة</label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value as typeof slot)}
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
                >
                  {SLOTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">نوع الخدمة</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
                >
                  {services.length === 0 ? <option value="">لا توجد خدمات متاحة</option> : services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">السيارة (اختياري)</label>
                <select
                  value={carId}
                  onChange={(e) => setCarId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
                >
                  <option value="">— اختر سيارة —</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>{c.make} {c.model ?? ""}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">ملاحظات (اختياري)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="أي ملاحظات تحب نعرفها قبل الموعد..."
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
              />
            </div>

            <button
              onClick={submit}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              تأكيد الحجز
            </button>
          </div>
        </motion.div>
      )}

      {appointments.length === 0 ? (
        <div className="py-10 text-center">
          <Calendar className="size-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد مواعيد بعد. احجز موعدك الأول!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const car = cars.find((c) => c.id === a.car_id);
            const slotL = SLOTS.find((s) => s.v === a.time_slot)?.l ?? a.time_slot;
            const svcL = services.find((s) => s.id === a.service_id)?.name ?? a.service_type;
            return (
              <div key={a.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="size-11 rounded-xl bg-gold-soft border border-primary/20 grid place-items-center shrink-0">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold">{svcL}</span>
                      {statusBadge(a.status)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatArDate(a.requested_date)}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {slotL}</span>
                    </div>
                    {car && <div className="text-xs text-muted-foreground mt-1">السيارة: {car.make} {car.model ?? ""}</div>}
                    {a.notes && <div className="text-xs text-muted-foreground mt-1">ملاحظتك: {a.notes}</div>}
                    {a.admin_notes && <div className="text-xs text-primary mt-1 font-semibold">رد الإدارة: {a.admin_notes}</div>}
                  </div>
                </div>
                {(a.status === "pending" || a.status === "confirmed") && (
                  <button
                    onClick={() => cancel(a.id)}
                    className="shrink-0 text-right text-xs font-bold text-destructive hover:underline sm:text-left"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
