import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle2, XCircle, Trash2, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatArDate } from "@/lib/reminder";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null };
}

function AdminReviews() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const map = new Map<string, { full_name: string | null; phone: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,phone").in("id", userIds);
      profs?.forEach((p) => map.set(p.id, { full_name: p.full_name, phone: p.phone }));
    }
    setRows((data ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) })) as Review[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) =>
    filter === "all" ? true : filter === "pending" ? !r.is_approved : r.is_approved
  );

  const update = async (id: string, patch: { is_approved?: boolean; is_featured?: boolean }) => {
    await supabase.from("reviews").update(patch).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا التقييم؟")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">تقييمات العملاء</h1>
        <p className="text-muted-foreground mt-1">راجع التقييمات واعتمد ما تريد عرضه على الموقع</p>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "approved"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`h-10 px-4 rounded-full border text-sm font-semibold transition ${
              filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted/50"
            }`}>
            {s === "all" ? "الكل" : s === "pending" ? "بانتظار المراجعة" : "معتمدة"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-10 text-center"><Loader2 className="size-8 mx-auto animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <MessageSquare className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">لا توجد تقييمات</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className="font-bold">{r.profile?.full_name || "عميل"}</div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    {r.is_approved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">معتمد</span>}
                    {r.is_featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1"><Sparkles className="size-2.5" />مميز</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.profile?.phone || "—"} · {formatArDate(r.created_at)}</div>
                  {r.comment && <p className="text-sm mt-2.5 leading-relaxed">{r.comment}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!r.is_approved ? (
                    <button onClick={() => update(r.id, { is_approved: true })} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600">
                      <CheckCircle2 className="size-3.5" /> اعتماد
                    </button>
                  ) : (
                    <>
                      <button onClick={() => update(r.id, { is_featured: !r.is_featured })} className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold ${r.is_featured ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted/50"}`}>
                        <Sparkles className="size-3.5" /> {r.is_featured ? "مميّز" : "تمييز"}
                      </button>
                      <button onClick={() => update(r.id, { is_approved: false })} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50">
                        <XCircle className="size-3.5" /> إلغاء الاعتماد
                      </button>
                    </>
                  )}
                  <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
