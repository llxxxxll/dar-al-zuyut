import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle2, XCircle, Loader2, Search, Filter, MessageSquare, Phone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatArDate } from "@/lib/reminder";

export const Route = createFileRoute("/admin/appointments")({
  component: AdminAppointments,
});

type Status = "pending" | "confirmed" | "cancelled" | "done";
type Slot = "morning" | "afternoon" | "evening";

interface Appt {
  id: string;
  user_id: string;
  car_id: string | null;
  requested_date: string;
  time_slot: Slot;
  service_type: string;
  status: Status;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null };
  car?: { make: string | null; model: string | null; plate_number: string | null } | null;
}

const STATUS_LABELS: Record<Status, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  done: "تمت الخدمة",
  cancelled: "ملغي",
};

const STATUS_COLORS: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  done: "bg-sky-100 text-sky-700 border-sky-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

const SLOT_LABELS: Record<Slot, string> = {
  morning: "صباحاً",
  afternoon: "ظهراً",
  evening: "مساءً",
};

function AdminAppointments() {
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Appt | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id,user_id,car_id,requested_date,time_slot,service_type,status,notes,admin_notes,created_at")
      .order("requested_date", { ascending: true })
      .limit(200);

    const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const carIds = Array.from(new Set((data ?? []).map((r) => r.car_id).filter(Boolean) as string[]));
    const profilesMap = new Map<string, { full_name: string | null; phone: string | null }>();
    const carsMap = new Map<string, { make: string | null; model: string | null; plate_number: string | null }>();

    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,phone").in("id", userIds);
      profs?.forEach((p) => profilesMap.set(p.id, { full_name: p.full_name, phone: p.phone }));
    }
    if (carIds.length) {
      const { data: cs } = await supabase.from("cars").select("id,make,model,plate_number").in("id", carIds);
      cs?.forEach((c) => carsMap.set(c.id, { make: c.make, model: c.model, plate_number: c.plate_number }));
    }

    setRows((data ?? []).map((r) => ({
      ...r,
      profile: profilesMap.get(r.user_id),
      car: r.car_id ? carsMap.get(r.car_id) ?? null : null,
    })) as Appt[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (filter !== "all") out = out.filter((r) => r.status === filter);
    const s = q.trim();
    if (s) out = out.filter((r) =>
      (r.profile?.full_name ?? "").includes(s) ||
      (r.profile?.phone ?? "").includes(s) ||
      r.requested_date.includes(s)
    );
    return out;
  }, [rows, filter, q]);

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    done: rows.filter((r) => r.status === "done").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
  }), [rows]);

  const updateStatus = async (id: string, status: Status, admin_notes?: string) => {
    const payload: { status: Status; admin_notes?: string } = { status };
    if (admin_notes !== undefined) payload.admin_notes = admin_notes;
    await supabase.from("appointments").update(payload).eq("id", id);
    await load();
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">إدارة المواعيد</h1>
          <p className="text-muted-foreground mt-1">راجع طلبات الحجز وأكّد المواعيد</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الجوال…"
            className="w-full h-11 rounded-xl border border-border bg-card pr-10 pl-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "done", "cancelled"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-semibold transition ${
              filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted/50"
            }`}>
            {s === "all" ? <Filter className="size-4" /> : null}
            {s === "all" ? "الكل" : STATUS_LABELS[s]}
            <span className={`text-xs px-2 py-0.5 rounded-full ${filter === s ? "bg-primary-foreground/20" : "bg-muted"}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="size-8 mx-auto animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Calendar className="size-10 mx-auto mb-3 opacity-50" /> لا توجد مواعيد
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.2) }}
                className="p-4 flex flex-wrap items-start gap-4 hover:bg-muted/30 transition">
                <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
                  <Calendar className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="font-bold">{r.profile?.full_name || "عميل"}</div>
                    <a href={`tel:${r.profile?.phone}`} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary" dir="ltr">
                      <Phone className="size-3" /> {r.profile?.phone || "—"}
                    </a>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {formatArDate(r.requested_date)}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {SLOT_LABELS[r.time_slot]}</span>
                    {r.car && <span>🚗 {r.car.make} {r.car.model ?? ""}{r.car.plate_number ? ` · ${r.car.plate_number}` : ""}</span>}
                  </div>
                  {r.notes && <div className="text-xs text-muted-foreground mt-1.5 inline-flex items-start gap-1"><MessageSquare className="size-3 mt-0.5" /> {r.notes}</div>}
                  {r.admin_notes && <div className="text-xs text-primary/80 mt-1 bg-primary/5 px-2 py-1 rounded inline-block">ملاحظة: {r.admin_notes}</div>}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => updateStatus(r.id, "confirmed")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600">
                        <CheckCircle2 className="size-3.5" /> تأكيد
                      </button>
                      <button onClick={() => setEditing(r)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600">
                        <XCircle className="size-3.5" /> رفض
                      </button>
                    </>
                  )}
                  {r.status === "confirmed" && (
                    <>
                      <button onClick={() => updateStatus(r.id, "done")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-sky-500 text-white text-xs font-bold hover:bg-sky-600">
                        <CheckCircle2 className="size-3.5" /> تمّت
                      </button>
                      <button onClick={() => setEditing(r)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600">
                        <XCircle className="size-3.5" /> إلغاء
                      </button>
                    </>
                  )}
                  {(r.status === "done" || r.status === "cancelled") && (
                    <>
                      {r.status === "done" && (
                        <a
                          href={`/admin/customers/${r.user_id}?newService=1${r.car_id ? `&carId=${r.car_id}` : ""}${r.service_type ? `&svc=${encodeURIComponent(r.service_type)}` : ""}`}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90"
                        >
                          + تسجيل خدمة
                        </a>
                      )}
                      <button onClick={() => updateStatus(r.id, "pending")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50">
                        إعادة فتح
                      </button>
                    </>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {editing && <CancelModal appt={editing} onClose={() => setEditing(null)} onConfirm={(notes) => updateStatus(editing.id, "cancelled", notes)} />}
      </AnimatePresence>
    </div>
  );
}

function CancelModal({ appt, onClose, onConfirm }: { appt: Appt; onClose: () => void; onConfirm: (notes: string) => void }) {
  const [notes, setNotes] = useState("");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="bg-card rounded-2xl border border-border shadow-elegant max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg">إلغاء الموعد</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          سيتم إشعار {appt.profile?.full_name || "العميل"} بإلغاء الموعد. أضف سبباً (اختياري):
        </p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="مثال: عذراً، الفرع مغلق هذا اليوم. يمكنك حجز موعد جديد."
          className="w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50">تراجع</button>
          <button onClick={() => onConfirm(notes)} className="h-10 px-4 rounded-lg bg-rose-500 text-white text-sm font-bold hover:bg-rose-600">تأكيد الإلغاء</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
