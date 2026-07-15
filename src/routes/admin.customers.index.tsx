import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Search, Phone, ChevronLeft, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatArDate } from "@/lib/reminder";

export const Route = createFileRoute("/admin/customers/")({
  component: CustomersList,
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
});

interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

function CustomersList() {
  const initialQ = Route.useSearch().q ?? "";
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQ);
  const [extraIds, setExtraIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data: customerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");

    const customerIds = Array.from(new Set((customerRoles ?? []).map((r) => r.user_id)));
    if (!customerIds.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,phone,created_at")
      .in("id", customerIds)
      .order("created_at", { ascending: false });

    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Extra-source lookup: plate numbers + loyalty card codes -> include matching user_ids.
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) { setExtraIds(new Set()); return; }
    let cancelled = false;
    (async () => {
      const [{ data: plates }, { data: cards }] = await Promise.all([
        supabase.from("cars").select("user_id").ilike("plate_number", `%${s}%`).limit(50),
        supabase.from("loyalty_cards").select("user_id").ilike("card_code", `%${s}%`).limit(50),
      ]);
      if (cancelled) return;
      const ids = new Set<string>();
      (plates ?? []).forEach((p) => p.user_id && ids.add(p.user_id));
      (cards ?? []).forEach((c) => c.user_id && ids.add(c.user_id));
      setExtraIds(ids);
    })();
    return () => { cancelled = true; };
  }, [q]);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return items;
    return items.filter(
      (c) => (c.full_name ?? "").includes(s) || (c.phone ?? "").includes(s) || extraIds.has(c.id)
    );
  }, [items, q, extraIds]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">العملاء</h1>
          <p className="text-muted-foreground mt-1">إجمالي {items.length} عميل مسجّل</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الجوال…"
            className="w-full h-11 rounded-xl border border-border bg-card pr-10 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          {q && <button onClick={() => setQ("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">جاري التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <UserPlus className="size-10 mx-auto mb-3 opacity-50" />
            لا يوجد عملاء مطابقون
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((c, i) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <Link
                  to="/admin/customers/$customerId"
                  params={{ customerId: c.id }}
                  className="flex items-center gap-4 p-4 hover:bg-muted/40 transition group"
                >
                  <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary-glow/20 grid place-items-center text-primary font-bold text-lg shrink-0">
                    {(c.full_name?.trim()?.[0] ?? "؟")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{c.full_name || "بدون اسم"}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="inline-flex items-center gap-1"><Phone className="size-3" />{c.phone || "—"}</span>
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground shrink-0">{formatArDate(c.created_at)}</div>
                  <ChevronLeft className="size-5 text-muted-foreground group-hover:text-primary transition shrink-0" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
