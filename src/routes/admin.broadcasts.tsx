import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone, Plus, Send, Loader2, Bell, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DraftControls } from "@/components/shared/DraftControls";
import { useLocalDraft } from "@/hooks/useLocalDraft";

export const Route = createFileRoute("/admin/broadcasts")({
  component: Broadcasts,
});

interface Broadcast {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  target_type: string;
  send_in_app: boolean;
  send_sms: boolean;
  send_whatsapp: boolean;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

const inputCls = "w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const ta = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const DEFAULT_FORM = {
  title: "",
  body: "",
  link_url: "",
  target_type: "all_customers",
  send_in_app: true,
  send_sms: false,
  send_whatsapp: false,
  scheduled_at: "",
};

function isBroadcastDraftEmpty(draft: typeof DEFAULT_FORM) {
  return !(
    draft.title.trim() ||
    draft.body.trim() ||
    draft.link_url.trim() ||
    draft.scheduled_at ||
    draft.target_type !== DEFAULT_FORM.target_type ||
    draft.send_in_app !== DEFAULT_FORM.send_in_app ||
    draft.send_sms ||
    draft.send_whatsapp
  );
}

function Broadcasts() {
  const [list, setList] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const { clearDraft, hasDraft, restored } = useLocalDraft({
    storageKey: "daralzuyut:broadcast:draft",
    value: form,
    defaultValue: DEFAULT_FORM,
    onRestore: (draft) => {
      setForm({ ...DEFAULT_FORM, ...draft });
      setShowForm(true);
    },
    enabled: true,
    debounceMs: 800,
    isEmpty: isBroadcastDraftEmpty,
    isEqualToDefault: (draft, defaultValue) => JSON.stringify(draft) === JSON.stringify(defaultValue),
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false });
    setList((data as Broadcast[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const user = await supabase.auth.getUser();
    const { error } = await supabase.from("broadcasts").insert({
      title: form.title.trim(),
      body: form.body.trim() || null,
      link_url: form.link_url.trim() || null,
      target_type: form.target_type,
      send_in_app: form.send_in_app,
      send_sms: form.send_sms,
      send_whatsapp: form.send_whatsapp,
      scheduled_at: form.scheduled_at || null,
      status: "draft",
      created_by: user.data.user?.id ?? null,
    });
    setSaving(false);
    if (!error) {
      clearDraft();
      setShowForm(false);
      setForm(DEFAULT_FORM);
      load();
    }
  };

  const sendNow = async (b: Broadcast) => {
    setSending(b.id);
    // 1) target customers
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id");
    const targets = (profiles as { id: string }[]) ?? [];

    // 2) Insert in-app notifications
    if (b.send_in_app && targets.length) {
      const rows = targets.map((p) => ({
        user_id: p.id,
        title: b.title,
        body: b.body,
        link_to: b.link_url,
        type: "system" as const,
      }));
      // chunk to avoid huge payload
      for (let i = 0; i < rows.length; i += 500) {
        await supabase.from("notifications").insert(rows.slice(i, i + 500));
      }
    }

    // 3) SMS / WhatsApp via edge function (best-effort)
    if (b.send_sms || b.send_whatsapp) {
      try { await supabase.functions.invoke("send-reminder-message", { body: { broadcast_id: b.id } }); } catch {}
    }

    await supabase.from("broadcasts").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", b.id);
    setSending(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold inline-flex items-center gap-2"><Megaphone className="size-6 text-primary" /> النشرات والإشعارات</h1>
          <p className="text-sm text-muted-foreground mt-1">أرسل إشعارًا داخل التطبيق أو SMS لجميع العملاء.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold shadow-elegant">
          <Plus className="size-4" /> {showForm ? "إغلاق" : "نشرة جديدة"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <input className={inputCls} placeholder="العنوان" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea rows={3} className={ta} placeholder="النص…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputCls} placeholder="رابط (اختياري)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
            <select className={inputCls} value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })}>
              <option value="all_customers">جميع العملاء</option>
              <option value="specific_customers">عملاء محددون</option>
              <option value="oil_type">حسب نوع الزيت</option>
              <option value="service_type">حسب نوع الخدمة</option>
            </select>
            <input type="datetime-local" className={inputCls} value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </div>
          <div className="flex gap-4 flex-wrap text-sm">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.send_in_app} onChange={(e) => setForm({ ...form, send_in_app: e.target.checked })} /> داخل التطبيق</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.send_sms} onChange={(e) => setForm({ ...form, send_sms: e.target.checked })} /> SMS</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.send_whatsapp} onChange={(e) => setForm({ ...form, send_whatsapp: e.target.checked })} /> WhatsApp</label>
          </div>
          {(form.send_sms || form.send_whatsapp) && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 inline-flex items-center gap-2">
              <AlertCircle className="size-4" /> سيُنفّذ الإرسال الفعلي عند ضبط مفاتيح المزود (Resala) في الإعدادات.
            </div>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DraftControls
              restored={restored}
              hasDraft={hasDraft}
              onClear={clearDraft}
            />
            <button disabled={saving || !form.title.trim()} onClick={create} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-foreground text-background font-bold disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} حفظ كمسودة
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد نشرات بعد.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-4">
              <div className="size-10 rounded-xl bg-secondary grid place-items-center shrink-0">
                <Bell className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{b.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${b.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{b.status === "sent" ? "أُرسلت" : b.status}</span>
                </div>
                {b.body && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.body}</div>}
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-3">
                  <span>أُنشئت: {new Date(b.created_at).toLocaleDateString("ar-LY")}</span>
                  {b.sent_at && <span>أُرسلت: {new Date(b.sent_at).toLocaleDateString("ar-LY")}</span>}
                  <span>{b.send_in_app && "🔔 داخلي"} {b.send_sms && "✉️ SMS"} {b.send_whatsapp && "💬 WA"}</span>
                </div>
              </div>
              {b.status !== "sent" && (
                <button disabled={sending === b.id} onClick={() => sendNow(b)} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-xs disabled:opacity-60">
                  {sending === b.id ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} إرسال الآن
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// keep import to avoid tree-shake noise
