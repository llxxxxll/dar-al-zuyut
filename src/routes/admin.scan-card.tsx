import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScanLine, Camera, Search, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/scan-card")({
  component: ScanCard,
  beforeLoad: () => {},
});

function ScanCard() {
  const { isStaff } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "err" | "ok" | "loading"; msg?: string }>({ kind: "idle" });
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const containerId = "scan-card-camera";

  useEffect(() => {
    if (!isStaff) navigate({ to: "/" });
  }, [isStaff, navigate]);

  const lookup = async (rawCode: string) => {
    const c = rawCode.trim().toUpperCase();
    if (!c) return;
    setStatus({ kind: "loading" });
    const { data, error } = await supabase
      .from("loyalty_cards")
      .select("id,user_id,status,discount_percent,expires_at")
      .eq("card_code", c)
      .maybeSingle();
    if (error || !data) {
      setStatus({ kind: "err", msg: "البطاقة غير موجودة" });
      return;
    }
    if (data.status !== "active") {
      setStatus({ kind: "err", msg: `البطاقة ${data.status === "inactive" ? "موقوفة" : "منتهية"}` });
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setStatus({ kind: "err", msg: "البطاقة منتهية الصلاحية" });
      return;
    }
    setStatus({ kind: "ok", msg: `خصم ${data.discount_percent}% — تحويل لملف العميل…` });
    setTimeout(() => navigate({ to: "/admin/customers/$customerId", params: { customerId: data.user_id } }), 700);
  };

  const startCamera = async () => {
    setCameraOn(true);
    try {
      const mod = await import("html5-qrcode");
      const Scanner = mod.Html5Qrcode;
      const inst = new Scanner(containerId);
      scannerRef.current = inst as unknown as { stop: () => Promise<void>; clear: () => void };
      await inst.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        async (decoded) => {
          await inst.stop();
          inst.clear();
          scannerRef.current = null;
          setCameraOn(false);
          setCode(decoded);
          lookup(decoded);
        },
        () => {}
      );
    } catch {
      setStatus({ kind: "err", msg: "تعذّر الوصول للكاميرا" });
      setCameraOn(false);
    }
  };

  const stopCamera = async () => {
    try { await scannerRef.current?.stop(); scannerRef.current?.clear(); } catch {}
    scannerRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => { stopCamera(); }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold inline-flex items-center gap-2"><ScanLine className="size-6 text-primary" /> مسح بطاقة الولاء</h1>
        <p className="text-sm text-muted-foreground mt-1">امسح QR Code من بطاقة العميل أو أدخل الكود يدويًا.</p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm space-y-2">
        <div className="font-bold text-primary">كيف تعمل هذه الصفحة؟</div>
        <ol className="list-decimal pr-5 space-y-1 text-muted-foreground">
          <li>وجّه الكاميرا نحو QR على بطاقة العميل، أو اكتب رمز البطاقة يدويًا.</li>
          <li>يتحقق النظام تلقائيًا من صلاحية البطاقة (نشطة، غير منتهية).</li>
          <li>يفتح ملف العميل مباشرة لعرض السيارات والخدمات وتسجيل خدمة جديدة أو تطبيق الخصم.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); lookup(code); }} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="مثال: ABC1234567"
            className="flex-1 h-12 rounded-xl border border-border bg-background px-4 font-mono text-sm uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button className="inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-foreground text-background font-bold">
            <Search className="size-4" /> بحث
          </button>
        </form>

        <div className="flex justify-center">
          {!cameraOn ? (
            <button onClick={startCamera} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border-2 border-dashed border-primary/30 text-primary font-bold hover:bg-primary/5">
              <Camera className="size-4" /> تشغيل الكاميرا
            </button>
          ) : (
            <button onClick={stopCamera} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-border">
              إيقاف الكاميرا
            </button>
          )}
        </div>

        <div id={containerId} className={`${cameraOn ? "block" : "hidden"} mx-auto max-w-sm rounded-xl overflow-hidden border border-border`} />

        {status.kind === "loading" && <div className="text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full"><Loader2 className="size-4 animate-spin" /> جارٍ البحث…</div>}
        {status.kind === "ok" && <div className="text-center text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-3 inline-flex items-center justify-center gap-2 w-full"><CheckCircle2 className="size-4" /> {status.msg}</div>}
        {status.kind === "err" && <div className="text-center text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-3 inline-flex items-center justify-center gap-2 w-full"><AlertCircle className="size-4" /> {status.msg}</div>}
      </div>
    </div>
  );
}