import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus, Droplet } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallAppPrompt() {
  const { shouldShow, isIOS, hasNativePrompt, promptInstall, dismiss } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (!shouldShow) { setOpen(false); setShowIosSteps(false); return; }
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [shouldShow]);

  const handleInstall = async () => {
    if (hasNativePrompt) {
      const res = await promptInstall();
      if (res !== "unavailable") {
        setOpen(false);
      }
    } else if (isIOS) {
      setShowIosSteps(true);
    }
  };

  const handleLater = () => { dismiss(); setOpen(false); setShowIosSteps(false); };
  const handleGotIt = () => { dismiss(); setOpen(false); setShowIosSteps(false); };

  if (!shouldShow && !showIosSteps) return null;

  return (
    <AnimatePresence>
      {/* Main Modal */}
      {(open || showIosSteps) && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md grid place-items-center px-4"
          dir="rtl"
        >
          <motion.div
            key="card"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-card rounded-3xl border border-primary/30 shadow-elegant p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              aria-label="إغلاق"
              onClick={handleLater}
              className="absolute top-4 left-4 size-9 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground"
            >
              <X className="size-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="size-20 rounded-2xl bg-gold-gradient grid place-items-center shadow-elegant">
                <Droplet className="size-10 text-primary-foreground" />
              </div>
            </div>

            {/* Title & Description */}
            {!showIosSteps ? (
              <>
                <div className="text-center mb-7">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
                    ثبت تطبيق دار الزيوت
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    لأفضل تجربة ومتابعة مواعيد تغيير الزيت، ثبت التطبيق على هاتفك ثم أكمل التسجيل.
                  </p>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleInstall}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gold-gradient text-primary-foreground font-extrabold text-base shadow-elegant hover:scale-[1.02] transition-transform"
                  >
                    <Download className="size-5" />
                    {hasNativePrompt ? "تثبيت التطبيق الآن" : "طريقة التثبيت"}
                  </button>
                  <button
                    onClick={handleLater}
                    className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    سأثبّت لاحقًا
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-extrabold text-foreground mb-2">
                    طريقة التثبيت على iPhone
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    فقط من Safari، اتبع الخطوات التالية:
                  </p>
                </div>

                <ol className="space-y-3 text-sm text-foreground/90 mb-7">
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                    <span className="shrink-0 size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-extrabold">1</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      اضغط زر المشاركة <Share className="size-5 text-primary" /> في أسفل الشاشة.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                    <span className="shrink-0 size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-extrabold">2</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      اختر <span className="font-bold">إضافة إلى الشاشة الرئيسية</span> <Plus className="size-5 text-primary" />.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                    <span className="shrink-0 size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-extrabold">3</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      افتح التطبيق من الشاشة الرئيسية ثم أكمل التسجيل.
                    </div>
                  </li>
                </ol>

                <button
                  onClick={handleGotIt}
                  className="w-full inline-flex items-center justify-center px-6 py-4 rounded-full bg-gold-gradient text-primary-foreground font-extrabold text-base shadow-elegant hover:scale-[1.02] transition-transform"
                >
                  تم، فهمت
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}