import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import {
  Phone, Loader2, AlertCircle, CheckCircle2, ChevronLeft,
  Droplet, ScanLine, Sparkles, Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { normalizePhone, phoneInputError } from "@/lib/phone";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";

export const Route = createFileRoute("/welcome")({
  component: Welcome,
  head: () => ({
    meta: [
      { title: "أهلاً بك في دار الزيوت" },
      { name: "description", content: "أدخل رقم هاتفك لنكمل معك — تسجيل دخول أو حساب جديد." },
      { property: "og:title", content: "أهلاً بك في دار الزيوت" },
      { property: "og:description", content: "أدخل رقم هاتفك ونوجّهك للمسار الصحيح تلقائياً." },
    ],
  }),
});

type CheckResp = { exists?: boolean; phone_verified?: boolean; error?: string };

function Welcome() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isStaff } = useAuth();
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed-in, jump straight to the right place.
  useEffect(() => {
    if (authLoading || !user) return;
    if (isStaff) { navigate({ to: "/admin" }); return; }
    navigate({ to: "/account" });
  }, [authLoading, user, isStaff, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const pErr = phoneInputError(phone);
    if (pErr) return setError(pErr);
    const p = normalizePhone(phone);
    setChecking(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("check-phone", {
        body: { phone: p },
      });
      setChecking(false);
      if (fnErr) return setError("تعذّر التحقق من الرقم. حاول مرة أخرى.");
      const res = (data ?? {}) as CheckResp;

      const mode: "login" | "register" = res.exists ? "login" : "register";
      navigate({ to: "/join", search: { mode, phone: p } as never });
    } catch {
      setChecking(false);
      setError("تعذّر التحقق من الرقم. حاول مرة أخرى.");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-onyx text-white relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-oil-radial opacity-60" />
      <div className="absolute -top-32 -right-32 size-[480px] rounded-full bg-primary/25 blur-[140px]" />
      <div className="absolute -bottom-32 -left-32 size-[480px] rounded-full bg-primary-glow/15 blur-[140px]" />

      <header className="relative z-10 px-6 pt-7">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="size-11 rounded-2xl bg-gold-gradient grid place-items-center shadow-elegant group-hover:scale-105 transition-transform">
            <Droplet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-lg gold-shimmer">دار الزيوت</div>
            <div className="text-[10px] tracking-widest text-white/50 uppercase">Premium Oil Care</div>
          </div>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-primary/40 text-xs font-bold mb-6">
                <ScanLine className="size-3.5 text-primary" />
                تم المسح بنجاح
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-3">
                <span className="block text-white">أهلاً بك في</span>
                <span className="block gold-shimmer mt-1">دار الزيوت</span>
              </h1>
              <p className="text-white/65 leading-relaxed">
                أدخل رقم هاتفك لنكمل معك.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-elegant border border-white/10 p-7"
            >
              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <label className="block text-sm font-bold text-foreground mb-2">رقم الهاتف</label>
              <div className="relative mb-3">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  dir="ltr"
                  className="w-full pr-12 pl-4 py-4 rounded-xl bg-secondary/40 border border-border focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground text-lg font-semibold placeholder:text-muted-foreground/60"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                سنبحث عن حسابك، وإذا لم يكن لديك حساب سنكمل التسجيل.
              </p>

              <button
                type="submit"
                disabled={checking}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gold-gradient text-primary-foreground font-bold text-base shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
              >
                {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronLeft className="h-5 w-5" />}
                {checking ? "جاري التحقق..." : "متابعة"}
              </button>
            </form>

            <div className="grid grid-cols-3 gap-3 mt-6 text-center">
              {[
                { icon: Bell, label: "تذكير تلقائي" },
                { icon: Sparkles, label: "خدمة فورية" },
                { icon: CheckCircle2, label: "بدون تطبيق" },
              ].map((p) => (
                <div key={p.label} className="px-2 py-3 rounded-xl bg-white/5 border border-white/10">
                  <p.icon className="size-4 text-primary mx-auto mb-1.5" />
                  <div className="text-[11px] text-white/70 font-semibold">{p.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-white/40 py-5">
        © {new Date().getFullYear()} دار الزيوت — جميع الحقوق محفوظة
      </footer>
      <InstallAppPrompt />
    </div>
  );
}