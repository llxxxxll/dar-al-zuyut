import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Search, X, Phone, Clock, CheckCircle2, AlertCircle, Loader2, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatArDate } from "@/lib/reminder";

export const Route = createFileRoute("/admin/reminders")({
  component: RemindersAdmin,
});

interface Row {
  id: string;
  user_id: string;
  due_date: string;
  status: string;
  sent_at: string | null;
  profile?: { full_name: string | null; phone: string | null };
}

const TABS = [
  { key: "upcoming", label: "قادمة" },
  { key: "due", label: "مستحقة الآن" },
  { key: "sent", label: "أُرسلت" },
  { key: "all", label: "الكل" },
] as const;

function RemindersAdmin() {
  const [tab, setTab] = useState<typeof TABS[number]["key"]>("upcoming");
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("reminders")
      .select("id,user_id,due_date,status,sent_at")
      .order("due_date", { ascending: true })
      .limit(300);
    const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const map = new Map<string, { full_name: string | null; phone: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,phone").in("id", userIds);
      profs?.forEach((p) => map.set(p.id, { full_name: p.full_name, phone: p.phone }));
    }
    setRows((data ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let list = rows;
    if (tab === "upcoming") list = rows.filter((r) => (r.status === "pending" || r.status === "due") && r.due_date >= today);
    else if (tab === "due") list = rows.filter((r) => (r.status === "pending" || r.status === "due") && r.due_date <= today);
    else if (tab === "sent") list = rows.filter((r) => r.status === "sent");
    const s = q.trim();
    if (s) list = list.filter((r) => (r.profile?.full_name ?? "").includes(s) || (r.profile?.phone ?? "").includes(s));
    return list;
  }, [rows, tab, q]);

  const counts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      upcoming: rows.filter((r) => (r.status === "pending" || r.status === "due") && r.due_date >= today).length,
      due: rows.filter((r) => (r.status === "pending" || r.status === "due") && r.due_date <= today).length,
      sent: rows.filter((r) => r.status === "sent").length,
      all: rows.length,
    };
  }, [rows]);

  const markSent = async (id: string) => {
    setMarking(id);
    await supabase.from("reminders").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
    setMarking(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">التذكيرات</h1>
          <p className="text-muted-foreground mt-1">إدارة تذكيرات تغيير الزيت</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث…" className="w-full h-11 rounded-xl border border-border bg-card pr-10 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          {q && <button onClick={() => setQ("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 h-10 rounded-xl text-sm font-medium border transition ${
              tab === t.key
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border hover:bg-muted/50"
            }`}
          >
            {t.label}
            <span className={`mr-2 inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded-full text-[10px] font-bold ${
              tab === t.key ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
            }`}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">جاري التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground"><Bell className="size-10 mx-auto mb-3 opacity-50" /> لا توجد تذكيرات</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((r, i) => {
              const isOverdue = r.due_date <= new Date().toISOString().slice(0, 10) && (r.status === "pending" || r.status === "due");
              return (
                <motion.li key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.2) }} className="p-4 flex items-center gap-4">
                  <div className={`size-11 rounded-xl grid place-items-center shrink-0 ${
                    r.status === "sent" ? "bg-emerald-100 text-emerald-700" :
                    isOverdue ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {r.status === "sent" ? <CheckCircle2 className="size-5" /> : isOverdue ? <AlertCircle className="size-5" /> : <Clock className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to="/admin/customers/$customerId" params={{ customerId: r.user_id }} className="font-semibold hover:text-primary transition">
                      {r.profile?.full_name || "عميل"}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-2">
                      <Phone className="size-3" /> {r.profile?.phone || "—"} • تاريخ الاستحقاق: {formatArDate(r.due_date)}
                    </div>
                  </div>
                  {r.status !== "sent" && r.status !== "cancelled" && (
                    <button
                      onClick={() => markSent(r.id)}
                      disabled={marking === r.id}
                      className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      {marking === r.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} تمييز كمُرسل
                    </button>
                  )}
                  <Link to="/admin/customers/$customerId" params={{ customerId: r.user_id }} className="text-muted-foreground hover:text-primary"><ChevronLeft className="size-4" /></Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
