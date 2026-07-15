import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Save, Trash2, Loader2, Power, PowerOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/templates")({
  component: Templates,
});

interface Tpl { id: string; name: string; body: string; is_active: boolean; }

const PLACEHOLDERS = ["{{name}}", "{{phone}}", "{{due_date}}", "{{car}}"];

function Templates() {
  const [items, setItems] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", body: "" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("message_templates").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Tpl[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">قوالب الرسائل</h1>
        <p className="text-muted-foreground mt-1">قوالب نصوص التذكيرات (تستخدم لاحقًا عند تفعيل خدمة SMS)</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
        <div className="font-semibold mb-3 inline-flex items-center gap-2"><Plus className="size-4 text-primary" /> إنشاء قالب جديد</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="اسم القالب" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <textarea rows={2} className="sm:col-span-2 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="نص الرسالة. استخدم {{name}} و {{due_date}} لتعويض البيانات." value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        </div>
        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
            متغيرات متاحة: {PLACEHOLDERS.map((p) => (
              <button key={p} onClick={() => setDraft((d) => ({ ...d, body: d.body + " " + p }))} className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/70 font-mono text-[11px]">{p}</button>
            ))}
          </div>
          <button
            disabled={creating || !draft.name.trim() || !draft.body.trim()}
            onClick={async () => {
              setCreating(true);
              await supabase.from("message_templates").insert({ name: draft.name.trim(), body: draft.body.trim(), is_active: true });
              setDraft({ name: "", body: "" }); setCreating(false); load();
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm disabled:opacity-60"
          >{creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} إضافة</button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? <div className="text-center text-muted-foreground py-10">جاري التحميل…</div> :
          items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
              <MessageSquare className="size-10 mx-auto mb-3 opacity-50" /> لا توجد قوالب بعد
            </div>
          ) : items.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <input
                  className="font-semibold text-lg bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none flex-1 min-w-0"
                  value={t.name}
                  onChange={(e) => setItems((arr) => arr.map((x) => x.id === t.id ? { ...x, name: e.target.value } : x))}
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      await supabase.from("message_templates").update({ is_active: !t.is_active }).eq("id", t.id);
                      load();
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-semibold ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {t.is_active ? <><Power className="size-3" /> مفعّل</> : <><PowerOff className="size-3" /> معطّل</>}
                  </button>
                  <button onClick={async () => { if (confirm("حذف القالب؟")) { await supabase.from("message_templates").delete().eq("id", t.id); load(); } }} className="text-muted-foreground hover:text-rose-500"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <textarea
                rows={3}
                className="mt-3 w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                value={t.body}
                onChange={(e) => setItems((arr) => arr.map((x) => x.id === t.id ? { ...x, body: e.target.value } : x))}
              />
              <div className="flex justify-end mt-2">
                <button
                  disabled={saving === t.id}
                  onClick={async () => {
                    setSaving(t.id);
                    await supabase.from("message_templates").update({ name: t.name, body: t.body }).eq("id", t.id);
                    setSaving(null);
                  }}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-foreground text-background text-xs font-semibold"
                >{saving === t.id ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} حفظ</button>
              </div>
            </motion.div>
          ))
        }
      </div>
    </div>
  );
}
