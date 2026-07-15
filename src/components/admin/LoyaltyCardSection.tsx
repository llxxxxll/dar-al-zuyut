import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, Printer, Power, Loader2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

interface Card {
  id: string;
  card_code: string;
  discount_percent: number;
  status: string;
  issued_at: string;
  expires_at: string | null;
  notes: string | null;
}

const btn = "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition";
const inputCls = "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";

export function LoyaltyCardSection({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ discount_percent: 10, expires_at: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("loyalty_cards")
      .select("id,card_code,discount_percent,status,issued_at,expires_at,notes")
      .eq("user_id", customerId)
      .order("issued_at", { ascending: false });
    setCards((data as Card[]) ?? []);
    setLoading(false);
    // generate QR data URLs
    const qrs: Record<string, string> = {};
    for (const c of (data as Card[]) ?? []) {
      qrs[c.id] = await QRCode.toDataURL(c.card_code, { width: 180, margin: 1 });
    }
    setQrMap(qrs);
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const issue = async () => {
    setSaving(true);
    const { data: codeData } = await supabase.rpc("gen_loyalty_code");
    const card_code = (codeData as string) ?? Math.random().toString(36).slice(2, 12).toUpperCase();
    const user = await supabase.auth.getUser();
    const { error } = await supabase.from("loyalty_cards").insert({
      user_id: customerId,
      card_code,
      discount_percent: Number(form.discount_percent) || 0,
      status: "active",
      expires_at: form.expires_at || null,
      notes: form.notes.trim() || null,
      created_by: user.data.user?.id ?? null,
    });
    setSaving(false);
    if (!error) {
      setShowForm(false);
      setForm({ discount_percent: 10, expires_at: "", notes: "" });
      load();
    }
  };

  const toggle = async (card: Card) => {
    const next = card.status === "active" ? "inactive" : "active";
    await supabase.from("loyalty_cards").update({ status: next }).eq("id", card.id);
    load();
  };

  const printCard = (card: Card) => {
    const qrUrl = qrMap[card.id];
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) return;
    win.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>بطاقة ${customerName}</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;background:#f5f5f5;}
        .card{background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);color:#fff;border-radius:20px;padding:28px;box-shadow:0 12px 40px rgba(0,0,0,.3);max-width:380px;margin:0 auto;}
        .brand{font-weight:900;font-size:22px;background:linear-gradient(90deg,#d4a44a,#f5d97a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .sub{font-size:11px;letter-spacing:.3em;opacity:.6;text-transform:uppercase;margin-bottom:18px;}
        .name{font-size:18px;font-weight:700;margin-top:14px;}
        .discount{font-size:32px;font-weight:900;color:#f5d97a;margin:8px 0;}
        .code{font-family:monospace;letter-spacing:.2em;font-size:14px;opacity:.85;margin-top:6px;}
        .qr{background:#fff;padding:12px;border-radius:12px;display:inline-block;margin-top:14px;}
        .qr img{display:block;}
        @media print{body{background:#fff;padding:0;}}
      </style></head><body>
      <div class="card">
        <div class="sub">دار الزيوت — Loyalty Card</div>
        <div class="brand">Dar Alzuyout</div>
        <div class="name">${customerName}</div>
        <div class="discount">${card.discount_percent}% خصم</div>
        <div class="code">${card.card_code}</div>
        <div class="qr"><img src="${qrUrl}" alt="QR"/></div>
      </div>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 font-extrabold text-lg">
          <CreditCard className="size-4 text-primary" /> بطاقات الولاء
        </div>
        <button onClick={() => setShowForm((v) => !v)} className={`${btn} bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-elegant`}>
          <Plus className="size-4" /> {showForm ? "إغلاق" : "إصدار بطاقة"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="grid sm:grid-cols-3 gap-3 mb-4 p-4 rounded-2xl bg-secondary/40 border border-border">
              <label className="block">
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">نسبة الخصم %</div>
                <input type="number" min={0} max={100} className={inputCls} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} />
              </label>
              <label className="block">
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">تاريخ الانتهاء (اختياري)</div>
                <input type="date" className={inputCls} value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
              </label>
              <label className="block">
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">ملاحظات</div>
                <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              <div className="sm:col-span-3 flex justify-end">
                <button disabled={saving} onClick={issue} className={`${btn} bg-foreground text-background`}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} إصدار
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-10 grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : cards.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <QrCode className="size-10 mx-auto mb-2 text-muted-foreground/40" />
          لا توجد بطاقات لهذا العميل بعد.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {cards.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border p-4 bg-card flex gap-4 items-center">
              {qrMap[c.id] && <img src={qrMap[c.id]} alt="QR" className="size-24 rounded-lg border border-border bg-white p-1.5 shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {c.status === "active" ? "فعّالة" : c.status === "inactive" ? "موقوفة" : "منتهية"}
                  </span>
                  <span className="text-xs text-muted-foreground" dir="ltr">{c.card_code}</span>
                </div>
                <div className="text-2xl font-extrabold text-primary">{c.discount_percent}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  صدرت: {new Date(c.issued_at).toLocaleDateString("ar-LY")}
                  {c.expires_at && <> · تنتهي: {new Date(c.expires_at).toLocaleDateString("ar-LY")}</>}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => printCard(c)} className="inline-flex items-center gap-1 text-xs h-8 px-3 rounded-lg border border-border hover:bg-muted">
                    <Printer className="size-3.5" /> طباعة
                  </button>
                  <button onClick={() => toggle(c)} className="inline-flex items-center gap-1 text-xs h-8 px-3 rounded-lg border border-border hover:bg-muted">
                    <Power className="size-3.5" /> {c.status === "active" ? "إيقاف" : "تفعيل"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}