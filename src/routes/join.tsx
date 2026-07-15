import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import {
  Bell, Phone, Lock, User, Gauge, Loader2, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Car as CarIcon, Droplet, LogIn, ShieldCheck, RefreshCw,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isValidLibyanPhone, phoneInputError, phoneToEmail } from "@/lib/phone";
import { CarMakeModelSelect } from "@/components/shared/CarMakeModelSelect";
import { OtpInput } from "@/components/shared/OtpInput";
import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

// Unknown/missing mode falls back to "signup" instead of throwing.
const searchSchema = z.object({
  mode: fallback(z.enum(["register", "signup", "login", "verify"]), "signup").optional(),
  phone: fallback(z.string(), "").optional(),
});

export const Route = createFileRoute("/join")({
  component: Join,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "انضم إلى دار الزيوت | تسجيل ودخول" },
      { name: "description", content: "سجّل في دار الزيوت برقم هاتفك واحصل على تذكير تلقائي على واتساب لموعد تغيير الزيت." },
    ],
  }),
});

type Mode = "signup" | "login" | "verify";

function Join() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isStaff } = useAuth();
  const search = Route.useSearch();
  const urlMode: Mode =
    search.mode === "login" ? "login"
    : search.mode === "verify" ? "verify"
    : "signup";
  const urlPhone = (search.phone ?? "").replace(/\D/g, "");

  const [mode, setMode] = useState<Mode>(urlMode);

  // Keep mode in sync if URL changes (e.g. /welcome → /join?mode=...)
  useEffect(() => { setMode(urlMode); }, [urlMode]);

  // Authenticated users: only redirect when NOT in verify mode (verify needs the session)
  useEffect(() => {
    if (authLoading || !user) return;
    if (isStaff) { navigate({ to: "/admin" }); return; }
    if (mode === "verify") return; // stay so the user can complete OTP
    navigate({ to: "/account" });
  }, [authLoading, user, isStaff, mode, navigate]);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-onyx text-white pt-16 pb-32">
        <div className="absolute inset-0 bg-oil-radial opacity-50" />
        <div className="absolute -top-40 -right-40 size-[420px] rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 size-[420px] rounded-full bg-primary-glow/15 blur-[120px]" />
        <div className="container relative mx-auto px-4 md:px-8 max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-primary/30 text-xs font-bold mb-5">
              <Bell className="size-3.5 text-primary" />
              {mode === "signup" ? "انضم لخدمة التذكير الذكي" : mode === "login" ? "أهلاً بعودتك" : "تأكيد رقم هاتفك"}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-3">
              <span className="block text-white">
                {mode === "signup" ? "ابدأ رحلتك" : mode === "login" ? "ادخل إلى" : "خطوة أخيرة"}
              </span>
              <span className="block gold-shimmer mt-1">
                {mode === "signup" ? "مع دار الزيوت" : mode === "login" ? "حسابك" : "لتأكيد هاتفك"}
              </span>
            </h1>
            <p className="text-white/65 max-w-md mx-auto">
              {mode === "signup"
                ? "أنشئ حسابك لتفعيل التذكير الذكي ومتابعة سيارتك."
                : mode === "login"
                ? "ادخل برقم هاتفك وكلمة المرور للوصول إلى حسابك."
                : "أدخل الكود المُرسل إلى هاتفك لإكمال تفعيل حسابك."}
            </p>
          </div>

          {/* Tabs — hidden in verify mode (focused single-task screen) */}
          {mode !== "verify" && (
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 mb-6">
              <button
                onClick={() => setMode("signup")}
                className={`h-12 rounded-xl font-bold transition-all ${
                  mode === "signup" ? "bg-gold-gradient text-primary-foreground shadow-elegant" : "text-white/65 hover:text-white"
                }`}
              >
                تسجيل جديد
              </button>
              <button
                onClick={() => setMode("login")}
                className={`h-12 rounded-xl font-bold transition-all ${
                  mode === "login" ? "bg-gold-gradient text-primary-foreground shadow-elegant" : "text-white/65 hover:text-white"
                }`}
              >
                تسجيل دخول
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SignupWizard initialPhone={urlPhone} onSwitchToLogin={() => setMode("login")} />
              </motion.div>
            )}
            {mode === "login" && (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <LoginForm
                  initialPhone={urlPhone}
                  onSwitchToSignup={() => setMode("signup")}
                  onUnverified={(p) => navigate({ to: "/join", search: { mode: "verify", phone: p } as never })}
                />
              </motion.div>
            )}
            {mode === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <VerifyOnlyForm initialPhone={urlPhone} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </SiteLayout>
  );
}

/* -------------------- Login -------------------- */
function LoginForm({
  initialPhone, onSwitchToSignup, onUnverified,
}: { initialPhone: string; onSwitchToSignup: () => void; onUnverified: (phone: string) => void }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const pErr = phoneInputError(phone);
    if (pErr) return setError(pErr);
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password: password.trim(),
    });
    if (err) {
      setLoading(false);
      setError("بيانات الدخول غير صحيحة. تحقق من رقم الهاتف وكلمة المرور.");
      return;
    }
    setLoading(false);
    navigate({ to: "/account" });
  };

  return (
    <form onSubmit={onSubmit} className="bg-card rounded-3xl shadow-elegant border border-border p-8 md:p-10">
      <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-2">ادخل إلى حسابك</h2>
      <p className="text-center text-muted-foreground mb-8">ادخل برقم هاتفك وكلمة المرور للوصول إلى حسابك.</p>

      {error && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-5">
        <Field icon={Phone} label="رقم الهاتف" type="tel" value={phone} onChange={setPhone} placeholder="0912345678" dir="ltr" />
        <Field icon={Lock} label="كلمة المرور" type="password" value={password} onChange={setPassword} placeholder="كلمة المرور" />

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          {loading ? "جاري الدخول..." : "تسجيل الدخول"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          ليس لديك حساب؟{" "}
          <button type="button" onClick={onSwitchToSignup} className="font-bold text-primary hover:underline">
            أنشئ حساب جديد
          </button>
        </p>
      </div>
    </form>
  );
}

/* -------------------- Signup Wizard -------------------- */
function SignupWizard({ initialPhone, onSwitchToLogin }: { initialPhone: string; onSwitchToLogin: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Step 1: Account
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Step 2: OTP
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpProviderConfigured, setOtpProviderConfigured] = useState(true);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Step 3: Car
  const [skipCar, setSkipCar] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [preferredOil, setPreferredOil] = useState("");
  const [odometer, setOdometer] = useState("");
  const [odometerUnit, setOdometerUnit] = useState<"km" | "mile">("km");

  // Step 4: Preferences
  // Deprecated: weekly_fuel_fills no longer collected.

  // cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const validateStep1 = () => {
    if (!fullName.trim()) return "الرجاء إدخال الاسم الكامل";
    const pErr = phoneInputError(phone);
    if (pErr) return pErr;
    if (password.length < 6) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    if (password !== passwordConfirm) return "كلمتا المرور غير متطابقتين";
    return null;
  };

  const validateStep3 = () => {
    if (skipCar) return null;
    if (!make.trim()) return "أدخل ماركة السيارة (أو اضغط 'تخطّي')";
    return null;
  };

  const sendOtp = async () => {
    setError(null);
    setOtpCode("");
    setOtpVerified(false);
    setDevCode(null);
    setLoading(true);
    try {
      // Check phone uniqueness first
      const { data: pc } = await supabase.functions.invoke("check-phone", { body: { phone } });
      if (pc && (pc as { exists?: boolean }).exists) {
        setLoading(false);
        setError("هذا الرقم مسجّل بالفعل. يمكنك تسجيل الدخول.");
        return false;
      }
      const { data, error: err } = await supabase.functions.invoke("send-otp", {
        body: { phone, purpose: "registration" },
      });
      setLoading(false);
      if (err) { setError("تعذّر إرسال كود التحقق. حاول مرة أخرى."); return false; }
      const res = data as { ok?: boolean; provider_configured?: boolean; dev_code?: string; error?: string; retry_after?: number };
      if (res?.error) {
        if (res.error === "cooldown") {
          const s = Math.max(1, res.retry_after ?? 60);
          setCooldown(s);
          setError(`الرجاء الانتظار ${s} ثانية قبل إعادة إرسال الكود`);
        } else {
          const map: Record<string, string> = {
            rate_limited_hour: "تجاوزت الحد الأقصى لطلبات الكود (5 خلال ساعة). حاول لاحقاً.",
            invalid_phone: "رقم الهاتف غير صحيح",
            provider_not_configured: "خدمة الرسائل غير مهيأة حالياً. لا يمكن إكمال التسجيل. يرجى التواصل مع الإدارة.",
          };
          setError(map[res.error] || res.error);
        }
        return false;
      }
      setOtpProviderConfigured(res?.provider_configured !== false);
      if (res?.dev_code) setDevCode(res.dev_code);
      setCooldown(60);
      return true;
    } catch {
      setLoading(false);
      setError("تعذّر الاتصال بخدمة التحقق");
      return false;
    }
  };

  const verifyOtp = async () => {
    setError(null);
    if (!/^\d{6}$/.test(otpCode)) { setError("أدخل كود مكوّن من 6 أرقام"); return; }
    setLoading(true);
    const { data, error: err } = await supabase.functions.invoke("verify-otp", {
      body: { phone, code: otpCode, purpose: "registration" },
    });
    setLoading(false);
    if (err) { setError("تعذّر التحقق من الكود"); return; }
    const res = data as { ok?: boolean; error?: string; remaining?: number };
    if (res?.error) {
      const map: Record<string, string> = {
        wrong_code: `كود غير صحيح${typeof res.remaining === "number" ? ` (المحاولات المتبقية: ${res.remaining})` : ""}`,
        expired: "انتهت صلاحية الكود. أعد الإرسال",
        no_active_code: "لا يوجد كود نشط. اضغط 'إعادة إرسال'",
        too_many_attempts: "تم تجاوز عدد المحاولات",
      };
      setError(map[res.error] || res.error);
      return;
    }
    setOtpVerified(true);
    setStep(3);
  };

  const next = async () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) return setError(err);
      const ok = await sendOtp();
      if (ok) setStep(2);
      return;
    }
    if (step === 2) {
      if (!otpVerified) { setError("الرجاء التحقق من الكود أولاً"); return; }
      setStep(3);
      return;
    }
    if (step === 3) {
      const err = validateStep3();
      if (err) return setError(err);
      await submit();
      return;
    }
  };

  const back = () => {
    setError(null);
    if (step === 2) {
      setOtpCode("");
      setOtpVerified(false);
      setDevCode(null);
      setCooldown(0);
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    setError(null);
    if (!otpVerified) { setError("يجب التحقق من رقم الهاتف أولاً"); return; }

    setLoading(true);
    const emailAlias = phoneToEmail(phone);
    const pwd = password.trim();

    const odom = odometer ? Number(odometer) : null;
    const { data: createAccountResponse, error: createAccountError } = await supabase.functions.invoke("create-customer-account", {
      body: {
        fullName: fullName.trim(),
        phone,
        password: pwd,
        car: skipCar ? null : {
          make: make.trim(),
          model: model.trim() || null,
          year: year ? Number(year) : null,
          plate: plate.trim() || null,
          preferredOil: preferredOil.trim() || null,
          odometer: Number.isFinite(odom) ? odom : null,
          odometerUnit,
        },
      },
    });

    const createAccountResult = createAccountResponse as { ok?: boolean; error?: string } | null;
    if (createAccountError || createAccountResult?.error) {
      const message = (createAccountResult?.error ?? createAccountError?.message ?? "").toLowerCase();
      setLoading(false);
      if (message.includes("phone_exists")) {
        setError("هذا الرقم مسجّل بالفعل. يمكنك تسجيل الدخول.");
      } else if (message.includes("missing_verified_otp") || message.includes("otp_verification_expired")) {
        setError("انتهت صلاحية التحقق من الهاتف. أعد إرسال الكود وتحقق منه مرة أخرى.");
      } else {
        setError("تعذّر إنشاء الحساب حالياً. حاول مرة أخرى.");
      }
      return;
    }

    let signInError: string | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: emailAlias,
        password: pwd,
      });
      if (!err) {
        signInError = null;
        break;
      }
      signInError = err.message;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    setLoading(false);
    setSuccess(true);
    if (signInError) {
      setTimeout(() => navigate({ to: "/join", search: { mode: "login", phone } as never }), 900);
      return;
    }
    setTimeout(() => navigate({ to: "/account" }), 900);
  };

  return (
    <div className="bg-card rounded-3xl shadow-elegant border border-border p-8 md:p-10">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`size-9 rounded-full grid place-items-center font-extrabold text-sm transition-all ${
                step >= n ? "bg-gold-gradient text-primary-foreground shadow-elegant" : "bg-secondary text-muted-foreground"
              }`}
            >
              {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
            </div>
            {n < 3 && <div className={`w-8 h-0.5 ${step > n ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="text-center mb-6">
        <div className="text-xs font-bold tracking-widest text-primary uppercase mb-2">
          الخطوة {step} من 3
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold">
          {step === 1 && "بياناتك الأساسية"}
          {step === 2 && "تأكيد رقم الهاتف"}
          {step === 3 && "أضف سيارتك"}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {step === 1 && "نحتاج اسمك ورقم هاتفك للتواصل."}
          {step === 2 && "أدخل الكود المكوّن من 6 أرقام المُرسل إلى هاتفك."}
          {step === 3 && "يمكنك إضافتها الآن أو لاحقاً من حسابك."}
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>تم إنشاء حسابك بنجاح! جاري تحويلك إلى حسابك...</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <Field icon={User} label="الاسم الكامل" type="text" value={fullName} onChange={setFullName} placeholder="مثال: محمد أحمد" />
            <Field icon={Phone} label="رقم الهاتف" type="tel" value={phone} onChange={setPhone} placeholder="0912345678" dir="ltr" />
            <Field icon={Lock} label="كلمة المرور" type="password" value={password} onChange={setPassword} placeholder="6 أحرف على الأقل" />
            <Field icon={Lock} label="تأكيد كلمة المرور" type="password" value={passwordConfirm} onChange={setPasswordConfirm} placeholder="أعد كتابة كلمة المرور" />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
            {!otpProviderConfigured && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>مزود الرسائل (Resala) غير مهيأ بعد. الكود التالي للتجربة فقط: <strong dir="ltr">{devCode}</strong></span>
              </div>
            )}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">أدخل كود التحقق</h3>
              <p className="text-sm text-muted-foreground">
                تم إرسال كود مكون من 6 أرقام إلى الرقم: <span dir="ltr" className="font-bold text-foreground">{phone}</span>
              </p>
            </div>
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              error={!!error}
              disabled={otpVerified || loading}
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={verifyOtp}
                disabled={loading || otpVerified || otpCode.length < 6}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {otpVerified ? "تم التحقق ✓" : "تحقق من الكود"}
              </button>
              <button
                type="button"
                onClick={sendOtp}
                disabled={cooldown > 0 || loading || otpVerified}
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full border-2 border-border bg-card font-semibold hover:border-primary/40 transition-all disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown}ث` : "إعادة الإرسال"}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            {!skipCar ? (
              <>
                <CarMakeModelSelect value={{ make, model }} onChange={(v) => { setMake(v.make); setModel(v.model); }} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <SelectField icon={CarIcon} label="سنة الصنع" value={year} onChange={setYear}
                    options={[{ value: "", label: "اختر السنة" }, ...buildYearOptions()]} />
                  <Field icon={CarIcon} label="رقم اللوحة" type="text" value={plate} onChange={setPlate} placeholder="اختياري" />
                </div>
                <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
                  <Field icon={Gauge} label="قراءة العداد الحالية" type="number" value={odometer} onChange={setOdometer} placeholder="مثال: 85000" />
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">الوحدة</label>
                    <div className="inline-flex rounded-xl border border-border p-1 bg-secondary/40">
                      {(["km", "mile"] as const).map((u) => (
                        <button
                          key={u} type="button" onClick={() => setOdometerUnit(u)}
                          className={`px-4 h-11 rounded-lg text-sm font-bold transition-all ${
                            odometerUnit === u ? "bg-gold-gradient text-primary-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {u === "km" ? "كم" : "ميل"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed -mt-1 p-3 rounded-xl bg-secondary/40 border border-border">
                  اكتب قراءة عدّاد سيارتك الآن. عند تغيير الزيت في المحل سيقوم الموظف بتسجيل قراءة العدّاد وقت الخدمة، ويُحسب موعد التغيير القادم تلقائيًا.
                </p>
                <SelectField icon={Droplet} label="نوع الزيت المفضّل" value={preferredOil} onChange={setPreferredOil}
                  options={[
                    { value: "", label: "اختر اللزوجة" },
                    { value: "0W-20", label: "0W-20" },
                    { value: "5W-20", label: "5W-20" },
                    { value: "5W-30", label: "5W-30" },
                    { value: "5W-40", label: "5W-40" },
                    { value: "10W-30", label: "10W-30" },
                    { value: "10W-40", label: "10W-40" },
                    { value: "15W-40", label: "15W-40" },
                    { value: "20W-50", label: "20W-50" },
                    { value: "other", label: "غير ذلك (سأخبر الفني)" },
                  ]} />
                <button
                  type="button"
                  onClick={() => setSkipCar(true)}
                  className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  تخطّي وإضافتها لاحقاً ←
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <CarIcon className="size-16 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground mb-4">سيتم تخطّي هذه الخطوة. يمكنك إضافة سيارتك من حسابك في أي وقت.</p>
                <button
                  type="button"
                  onClick={() => setSkipCar(false)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  أو أضفها الآن
                </button>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex items-center justify-between gap-3 mt-8">
        <button
          type="button"
          onClick={back}
          disabled={step === 1 || loading}
          className="inline-flex items-center gap-2 h-12 px-5 rounded-full border-2 border-foreground/15 bg-card font-bold text-foreground hover:border-primary disabled:opacity-30 disabled:hover:border-foreground/15 transition-all"
        >
          <ChevronRight className="h-4 w-4" /> السابق
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            disabled={loading || (step === 2 && !otpVerified)}
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            التالي <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-105 transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
            {loading ? "جاري التسجيل..." : "إنهاء التسجيل"}
          </button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        لديك حساب بالفعل؟{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-bold text-primary hover:underline">
          سجّل الدخول
        </button>
      </p>
    </div>
  );
}

/* -------------------- Field -------------------- */
/* -------------------- VerifyOnlyForm --------------------
 * Completes OTP verification for an existing (unverified) account.
 * If the user isn't signed in, asks for password first to establish a session,
 * then sends + verifies the OTP. */
function VerifyOnlyForm({ initialPhone }: { initialPhone: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpProviderConfigured, setOtpProviderConfigured] = useState(true);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [phoneAtSend, setPhoneAtSend] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (sent && phoneAtSend && phone !== phoneAtSend) {
      setOtpCode("");
      setSent(false);
      setDevCode(null);
      setCooldown(0);
    }
  }, [phone, sent, phoneAtSend]);

  const ensureSession = async (): Promise<boolean> => {
    if (user) return true;
    const pErr = phoneInputError(phone);
    if (pErr) { setError(pErr); return false; }
    if (!password) { setError("أدخل كلمة المرور للمتابعة."); return false; }
    const { error: err } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone), password: password.trim(),
    });
    if (err) { setError("بيانات الدخول غير صحيحة."); return false; }
    return true;
  };

  const sendOtp = async () => {
    setError(null);
    setLoading(true);
    const ok = await ensureSession();
    if (!ok) { setLoading(false); return; }
    const { data, error: err } = await supabase.functions.invoke("send-otp", {
      body: { phone, purpose: "registration" },
    });
    setLoading(false);
    if (err) { setError("تعذّر إرسال كود التحقق."); return; }
    const res = data as { ok?: boolean; provider_configured?: boolean; dev_code?: string; error?: string; retry_after?: number };
    if (res?.error) {
      if (res.error === "cooldown") {
        const s = Math.max(1, res.retry_after ?? 60);
        setCooldown(s);
        setError(`الرجاء الانتظار ${s} ثانية قبل إعادة إرسال الكود`);
      } else {
        const map: Record<string, string> = {
          rate_limited_hour: "تجاوزت الحد الأقصى لطلبات الكود (5 خلال ساعة). حاول لاحقاً.",
          provider_not_configured: "خدمة الرسائل غير مهيأة حالياً. تواصل مع الإدارة.",
        };
        setError(map[res.error] || res.error);
      }
      return;
    }
    setOtpProviderConfigured(res?.provider_configured !== false);
    if (res?.dev_code) setDevCode(res.dev_code);
    setSent(true);
    setPhoneAtSend(phone);
    setCooldown(60);
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otpCode)) return setError("أدخل كود مكوّن من 6 أرقام");
    setLoading(true);
    const { data, error: err } = await supabase.functions.invoke("verify-otp", {
      body: { phone, code: otpCode, purpose: "registration" },
    });
    setLoading(false);
    if (err) return setError("تعذّر التحقق من الكود");
    const res = data as { ok?: boolean; error?: string; remaining?: number };
    if (res?.error) {
      const map: Record<string, string> = {
        wrong_code: `كود غير صحيح${typeof res.remaining === "number" ? ` (المتبقي: ${res.remaining})` : ""}`,
        expired: "انتهت صلاحية الكود. أعد الإرسال",
        no_active_code: "لا يوجد كود نشط. اضغط 'إرسال'",
        too_many_attempts: "تم تجاوز عدد المحاولات",
      };
      return setError(map[res.error] || res.error);
    }
    navigate({ to: "/account" });
  };

  return (
    <form onSubmit={verifyOtp} className="bg-card rounded-3xl shadow-elegant border border-border p-8 md:p-10 space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {!otpProviderConfigured && devCode && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>مزود الرسائل غير مهيأ. كود التجربة: <strong dir="ltr">{devCode}</strong></span>
        </div>
      )}

      <Field icon={Phone} label="رقم الهاتف" type="tel" value={phone} onChange={setPhone} placeholder="0912345678" dir="ltr" />
      {!user && (
        <Field icon={Lock} label="كلمة المرور" type="password" value={password} onChange={setPassword} placeholder="كلمة المرور" />
      )}

      {!sent ? (
        <button
          type="button" onClick={sendOtp} disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          إرسال كود التحقق
        </button>
      ) : (
        <>
          <div className="text-center space-y-2 mb-2">
            <h3 className="text-xl font-bold">أدخل كود التحقق</h3>
            <p className="text-sm text-muted-foreground">
              تم إرسال كود مكون من 6 أرقام إلى الرقم: <span dir="ltr" className="font-bold text-foreground">{phone}</span>
            </p>
          </div>
          <OtpInput
            value={otpCode}
            onChange={setOtpCode}
            error={!!error}
            disabled={loading}
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="submit" disabled={loading || otpCode.length < 6}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              تأكيد ومتابعة
            </button>
            <button type="button" onClick={sendOtp} disabled={cooldown > 0 || loading}
              className="inline-flex items-center gap-2 h-12 px-5 rounded-full border-2 border-border bg-card font-semibold hover:border-primary/40 transition-all disabled:opacity-50">
              <RefreshCw className="h-4 w-4" />
              {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown}ث` : "إعادة الإرسال"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

function Field({
  icon: Icon, label, type, value, onChange, placeholder, dir,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-foreground mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-secondary/40 border border-border focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  );
}

function buildYearOptions() {
  const current = new Date().getFullYear() + 1;
  const out: { value: string; label: string }[] = [];
  for (let y = current; y >= 1990; y--) out.push({ value: String(y), label: String(y) });
  return out;
}

function SelectField({
  icon: Icon, label, value, onChange, options,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-foreground mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-secondary/40 border border-border focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground appearance-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
