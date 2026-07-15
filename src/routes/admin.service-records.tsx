import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Wrench, X, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatArDate } from "@/lib/reminder";

export const Route = createFileRoute("/admin/service-records")({
  component: ServicesAll,
});

interface Row {
  id: string;
  service_date: string;
  oil_type: string | null;
  filter_changed: boolean | null;
  user_id: string;
  staff_name: string | null;
  profile?: { full_name: string | null; phone: string | null };
}

function ServicesAll() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("service_records")
        .select("id,service_date,oil_type,filter_changed,user_id,staff_name")
        .order("service_date", { ascending: false })
        .limit(200);
      const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      const profilesMap = new Map<string, { full_name: string | null; phone: string | null }>();
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name,phone").in("id", userIds);
        profs?.forEach((p) => profilesMap.set(p.id, { full_name: p.full_name, phone: p.phone }));
      }
      setRows((data ?? []).map((r) => ({ ...r, profile: profilesMap.get(r.user_id) })));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return rows;
    return rows.filter((r) =>
      (r.profile?.full_name ?? "").includes(s) ||
      (r.profile?.phone ?? "").includes(s) ||
      (r.oil_type ?? "").includes(s)
    );
  }, [rows, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">سجل الخدمات</h1>
          <p className="text-muted-foreground mt-1">آخر {rows.length} خدمة</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو رقم الجوال أو نوع الزيت…" className="w-full h-11 rounded-xl border border-border bg-card pr-10 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          {q && <button onClick={() => setQ("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">جاري التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground"><Wrench className="size-10 mx-auto mb-3 opacity-50" /> لا توجد خدمات مطابقة</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.2) }}>
                <Link to="/admin/customers/$customerId" params={{ customerId: r.user_id }} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition group">
                  <div className="size-11 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0"><Wrench className="size-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{r.profile?.full_name || "عميل"} <span className="text-xs text-muted-foreground font-normal">— {r.profile?.phone || "—"}</span></div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {r.oil_type || "زيت"}{r.filter_changed && " • فلتر"}{r.staff_name && ` • ${r.staff_name}`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{formatArDate(r.service_date)}</div>
                  <ChevronLeft className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
