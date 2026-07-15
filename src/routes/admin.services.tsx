import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Wrench, Save, X, ArrowUp, ArrowDown, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/shared/ImageUpload";

export const Route = createFileRoute("/admin/services")({
  component: ServicesCatalog,
});

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const EMPTY: Omit<Service, "id"> = {
  name: "", slug: "", description: "", price: null, duration_minutes: null,
  icon: "", image_url: "", is_active: true, sort_order: 0,
};

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-").slice(0, 60);
}

function ServicesCatalog() {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | (Omit<Service, "id"> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("sort_order").order("name");
    setRows((data as Service[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...EMPTY, sort_order: (rows.at(-1)?.sort_order ?? 0) + 10 });
  const openEdit = (s: Service) => setEditing({ ...s });

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return;
    setSaving(true);
    const slug = editing.slug?.trim() || slugify(editing.name);
    const payload = {
      name: editing.name.trim(),
      slug,
      description: editing.description?.trim() || null,
      price: editing.price ?? null,
      duration_minutes: editing.duration_minutes ?? null,
      icon: editing.icon?.trim() || null,
      image_url: editing.image_url?.trim() || null,
      is_active: editing.is_active,
      sort_order: editing.sort_order ?? 0,
    };
    if ("id" in editing && editing.id) {
      await supabase.from("services").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("services").insert(payload);
    }
    setSaving(false);
    setEditing(null);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    load();
  };

  const toggleActive = async (s: Service) => {
    await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    setRows((rs) => rs.map((r) => (r.id === s.id ? { ...r, is_active: !s.is_active } : r)));
  };

  const move = async (s: Service, dir: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === s.id);
    const other = rows[idx + dir];
    if (!other) return;
    await Promise.all([
      supabase.from("services").update({ sort_order: other.sort_order }).eq("id", s.id),
      supabase.from("services").update({ sort_order: s.sort_order }).eq("id", other.id),
    ]);
    load();
  };

  const remove = async (s: Service) => {
    if (!confirm(`حذف "${s.name}" نهائياً؟`)) return;
    await supabase.from("services").delete().eq("id", s.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">كتالوج الخدمات</h1>
          <p className="text-muted-foreground mt-1">الخدمات التي تظهر للعملاء في الموقع وعند الحجز</p>
        </div>
        <div className="flex items-center gap-3">
          {savedFlash && <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle2 className="size-4" /> تم الحفظ</span>}
          <button onClick={openNew} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow transition">
            <Plus className="size-4" /> خدمة جديدة
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground"><Wrench className="size-10 mx-auto mb-3 opacity-50" /> لا توجد خدمات بعد. أضف أول خدمة.</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {rows.map((s, i) => (
              <motion.li key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.2) }}
                className="flex items-center gap-3 p-4 hover:bg-muted/40 transition">
                <div className={`size-11 rounded-xl grid place-items-center shrink-0 ${s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Wrench className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {s.name}
                    {!s.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">معطّلة</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {s.description || s.slug}
                    {s.price != null && <> • <span className="text-foreground">{s.price} د.ل</span></>}
                    {s.duration_minutes && <> • {s.duration_minutes} د</>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => move(s, -1)} disabled={i === 0} className="size-9 grid place-items-center rounded-lg hover:bg-muted disabled:opacity-30" title="فوق"><ArrowUp className="size-4" /></button>
                  <button onClick={() => move(s, 1)} disabled={i === rows.length - 1} className="size-9 grid place-items-center rounded-lg hover:bg-muted disabled:opacity-30" title="تحت"><ArrowDown className="size-4" /></button>
                  <button onClick={() => toggleActive(s)} className="size-9 grid place-items-center rounded-lg hover:bg-muted" title={s.is_active ? "تعطيل" : "تفعيل"}>
                    {s.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button onClick={() => openEdit(s)} className="size-9 grid place-items-center rounded-lg hover:bg-muted text-primary" title="تعديل"><Pencil className="size-4" /></button>
                  <button onClick={() => remove(s)} className="size-9 grid place-items-center rounded-lg hover:bg-rose-50 text-rose-600" title="حذف"><Trash2 className="size-4" /></button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !saving && setEditing(null)}>
            <motion.div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-elegant overflow-hidden"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="font-extrabold text-lg">{"id" in editing && editing.id ? "تعديل خدمة" : "خدمة جديدة"}</div>
                <button onClick={() => setEditing(null)} className="size-9 grid place-items-center rounded-lg hover:bg-muted"><X className="size-4" /></button>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                <Lbl text="الاسم *"><input className={inp} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Lbl>
                <Lbl text="الرابط (slug)"><input className={inp} dir="ltr" value={editing.slug} placeholder="auto" onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Lbl>
                <Lbl text="الوصف"><textarea className={`${inp} h-24 py-2`} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Lbl>
                <Lbl text="السعر (د.ل)"><input type="number" className={inp} value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value ? Number(e.target.value) : null })} /></Lbl>
                <Lbl text="المدة (دقيقة)"><input type="number" className={inp} value={editing.duration_minutes ?? ""} onChange={(e) => setEditing({ ...editing, duration_minutes: e.target.value ? Number(e.target.value) : null })} /></Lbl>
                <Lbl text="أيقونة (lucide name)"><input className={inp} dir="ltr" value={editing.icon ?? ""} placeholder="Wrench" onChange={(e) => setEditing({ ...editing, icon: e.target.value })} /></Lbl>
                <Lbl text="ترتيب الظهور"><input type="number" className={inp} value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Lbl>
                <div className="sm:col-span-2">
                  <Lbl text="صورة الخدمة (اختياري)">
                    <ImageUpload
                      value={editing.image_url || ""}
                      onChange={(url) => setEditing({ ...editing, image_url: url })}
                      folder="services"
                    />
                  </Lbl>
                </div>
                <label className="flex items-center gap-3 mt-6">
                  <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="size-5 accent-primary" />
                  <span className="font-semibold">مفعّلة وتظهر للعملاء</span>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-border bg-muted/30">
                <button onClick={() => setEditing(null)} disabled={saving} className="h-11 px-5 rounded-xl border border-border bg-card font-semibold">إلغاء</button>
                <button onClick={save} disabled={saving || !editing.name.trim()} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gold-gradient text-primary-foreground font-bold disabled:opacity-60">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} حفظ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inp = "w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
function Lbl({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block sm:col-span-1 [&:has(textarea)]:sm:col-span-2">
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{text}</div>
      {children}
    </label>
  );
}
