import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Plus, Trash2, Edit3, X, Loader2, Eye, EyeOff, Calendar, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { DraftControls } from "@/components/shared/DraftControls";
import { useLocalDraft } from "@/hooks/useLocalDraft";

export const Route = createFileRoute("/admin/promotions")({
  component: AdminPromotions,
});

interface Promo {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_percent: number | null;
  price: number | null;
  badge: string | null;
  cta_label: string | null;
  cta_link: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
}

const empty: Omit<Promo, "id"> = {
  title: "",
  description: "",
  image_url: "",
  discount_percent: null,
  price: null,
  badge: "",
  cta_label: "",
  cta_link: "",
  starts_at: new Date().toISOString().slice(0, 10),
  ends_at: null,
  is_active: true,
  sort_order: 0,
};

function toPromoDraft(source: Partial<Promo>) {
  return {
    title: source.title ?? "",
    description: source.description ?? "",
    image_url: source.image_url ?? "",
    discount_percent: source.discount_percent ?? null,
    price: source.price ?? null,
    badge: source.badge ?? "",
    cta_label: source.cta_label ?? "",
    cta_link: source.cta_link ?? "",
    starts_at: source.starts_at ?? new Date().toISOString().slice(0, 10),
    ends_at: source.ends_at ?? null,
    is_active: source.is_active ?? true,
    sort_order: source.sort_order ?? 0,
  };
}

function AdminPromotions() {
  const [rows, setRows] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Promo> | null>(null);
  const [baseline, setBaseline] = useState<ReturnType<typeof toPromoDraft> | null>(null);

  const getNewPromotion = () => toPromoDraft({ ...empty, sort_order: (rows.at(-1)?.sort_order ?? 0) + 10 });

  const { clearDraft, hasDraft, restored } = useLocalDraft({
    storageKey: `daralzuyut:promotion:draft:${editing?.id ?? "new"}`,
    value: toPromoDraft(editing ?? getNewPromotion()),
    onRestore: (draft) => setEditing({ ...(baseline ?? getNewPromotion()), ...draft }),
    enabled: !!editing,
    debounceMs: 800,
    shouldSave: (draft) =>
      baseline != null &&
      JSON.stringify(draft) !== JSON.stringify(baseline) &&
      Boolean(
        draft.title.trim() ||
        draft.description?.trim() ||
        draft.image_url?.trim() ||
        draft.discount_percent != null ||
        draft.price != null ||
        draft.badge?.trim() ||
        draft.cta_label?.trim() ||
        draft.cta_link?.trim() ||
        draft.ends_at,
      ),
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("promotions").select("*").order("sort_order").order("created_at", { ascending: false });
    setRows((data ?? []) as Promo[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing || !editing.title) return;
    const draftKeyActive = !editing.id || hasDraft;
    const payload = {
      title: editing.title,
      description: editing.description || null,
      image_url: editing.image_url || null,
      discount_percent: editing.discount_percent ?? null,
      price: editing.price ?? null,
      badge: editing.badge || null,
      cta_label: editing.cta_label || null,
      cta_link: editing.cta_link || null,
      starts_at: editing.starts_at || new Date().toISOString(),
      ends_at: editing.ends_at || null,
      is_active: editing.is_active ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    if (editing.id) {
      await supabase.from("promotions").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("promotions").insert(payload);
    }
    if (draftKeyActive) clearDraft();
    setEditing(null);
    setBaseline(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا العرض؟")) return;
    await supabase.from("promotions").delete().eq("id", id);
    load();
  };

  const toggle = async (p: Promo) => {
    await supabase.from("promotions").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">الإعلانات والعروض</h1>
          <p className="text-muted-foreground mt-1">فقط أضف عنوانًا واحفظ — بقية الحقول اختيارية.</p>
        </div>
        <button onClick={() => {
          const next = getNewPromotion();
          setBaseline(next);
          setEditing(next);
        }}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:scale-[1.02] transition">
          <Plus className="size-4" /> عرض جديد
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center"><Loader2 className="size-8 mx-auto animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Tag className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">لا توجد عروض حالياً. أنشئ أول عرض ترويجي.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border bg-card shadow-card overflow-hidden ${p.is_active ? "border-border/60" : "border-dashed border-border opacity-60"}`}>
              {p.image_url && (
                <div className="h-36 bg-muted overflow-hidden">
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p.badge}</span>}
                    {p.discount_percent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-0.5"><Percent className="size-2.5" />{p.discount_percent}</span>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {p.is_active ? "نشط" : "متوقف"}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg mb-1">{p.title}</h3>
                {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  من {new Date(p.starts_at).toLocaleDateString("ar-LY")}
                  {p.ends_at && ` إلى ${new Date(p.ends_at).toLocaleDateString("ar-LY")}`}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button onClick={() => {
                    const next = toPromoDraft(p);
                    setBaseline(next);
                    setEditing({ ...p });
                  }} className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50">
                    <Edit3 className="size-3.5" /> تعديل
                  </button>
                  <button onClick={() => toggle(p)} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50">
                    {p.is_active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                  <button onClick={() => remove(p.id)} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="bg-card rounded-2xl border border-border shadow-elegant max-w-2xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-xl">{editing.id ? "تعديل عرض" : "عرض جديد"}</h3>
                <button onClick={() => { setEditing(null); setBaseline(null); }} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
              </div>
              <DraftControls
                restored={restored}
                hasDraft={hasDraft}
                className="mb-4"
                onClear={() => {
                  clearDraft();
                  const resetTo = baseline ?? getNewPromotion();
                  setEditing({ ...resetTo });
                }}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="العنوان *">
                  <input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inp} />
                </Field>
                <Field label="الشارة (badge)">
                  <input value={editing.badge || ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} placeholder="مثلاً: عرض الجمعة" className={inp} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="الوصف">
                    <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className={`${inp} h-auto py-3 resize-none`} />
                  </Field>
                </div>
                <Field label="نسبة الخصم %">
                  <input type="number" min="0" max="100" value={editing.discount_percent ?? ""} onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value ? parseInt(e.target.value) : null })} className={inp} />
                </Field>
                <Field label="السعر (د.ل)">
                  <input type="number" min="0" step="0.5" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="مثلاً 120" className={inp} />
                </Field>
                <Field label="ترتيب الظهور">
                  <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className={inp} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="رابط صورة">
                    <ImageUpload
                      value={editing.image_url || ""}
                      onChange={(url) => setEditing({ ...editing, image_url: url })}
                      folder="promotions"
                    />
                  </Field>
                </div>
                <Field label="نص زر الإجراء">
                  <input value={editing.cta_label || ""} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} placeholder="احجز الآن" className={inp} />
                </Field>
                <Field label="رابط الزر">
                  <input value={editing.cta_link || ""} onChange={(e) => setEditing({ ...editing, cta_link: e.target.value })} placeholder="/services" className={inp} dir="ltr" />
                </Field>
                <Field label="يبدأ من">
                  <input type="date" value={editing.starts_at?.slice(0, 10) || ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} className={inp} />
                </Field>
                <Field label="ينتهي في (اختياري)">
                  <input type="date" value={editing.ends_at?.slice(0, 10) || ""} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value || null })} className={inp} />
                </Field>
                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="size-4" />
                    عرض نشط (مرئي للعملاء)
                  </label>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button onClick={() => { setEditing(null); setBaseline(null); }} className="h-11 px-5 rounded-full border border-border font-semibold hover:bg-muted/50">إلغاء</button>
                <button onClick={save} disabled={!editing.title} className="h-11 px-6 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant disabled:opacity-50">
                  حفظ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inp = "w-full h-11 rounded-xl border border-border bg-secondary/40 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 px-3 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-bold text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
