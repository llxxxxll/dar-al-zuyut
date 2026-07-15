import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus, Droplet } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallAppPrompt() {
  const { shouldShow, isIOS, hasNativePrompt, promptInstall, dismiss } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [showIosSheet, setShowIosSheet] = useState(false);

  useEffect(() => {
    if (!shouldShow) { setOpen(false); return; }
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [shouldShow]);

  const handleInstall = async () => {
    if (hasNativePrompt) {
      const res = await promptInstall();
      if (res !== "unavailable") setOpen(false);
    } else if (isIOS) {
      setShowIosSheet(true);
    }
  };

  const handleLater = () => { dismiss(); setOpen(false); setShowIosSheet(false); };

  if (!shouldShow && !showIosSheet) return null;

  return (
    <AnimatePresence>
      {open && !showIosSheet && (
        <motion.div
          key="banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-24 lg:bottom-6 inset-x-3 lg:inset-x-auto lg:right-6 lg:w-[380px] z-50"
          dir="rtl"
        >
          <div className="relative rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/30 shadow-elegant p-4 flex items-start gap-3">
            <button
              aria-label="إغلاق"
              onClick={handleLater}
              className="absolute top-2 left-2 size-7 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground"
            >
              <X className="size-4" />
            </button>
            <div className="shrink-0 size-12 rounded-xl bg-gold-gradient grid place-items-center shadow-elegant">
              <Droplet className="size-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5 pl-5">
              <div className="font-extrabold text-sm text-foreground mb-0.5">ثبّت تطبيق دار الزيوت</div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                ثبّت التطبيق على جوالك للوصول السريع ومتابعة تذكيرات الزيت.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gold-gradient text-primary-foreground text-xs font-bold shadow-elegant hover:scale-[1.03] transition-transform"
                >
                  <Download className="size-3.5" />
                  تثبيت التطبيق
                </button>
                <button
                  onClick={handleLater}
                  className="px-3 py-2 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  لاحقًا
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showIosSheet && (
        <motion.div
          key="ios"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end sm:place-items-center px-3 pb-3 sm:pb-0"
          onClick={handleLater}
          dir="rtl"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-card rounded-3xl border border-primary/30 shadow-elegant p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="size-11 rounded-xl bg-gold-gradient grid place-items-center">
                <Droplet className="size-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-extrabold text-foreground">تثبيت على iPhone</div>
                <div className="text-xs text-muted-foreground">خطوتان فقط من Safari</div>
              </div>
            </div>
            <ol className="space-y-3 text-sm text-foreground/90 mb-5">
              <li className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                <span className="shrink-0 size-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-extrabold">1</span>
                <div className="flex items-center gap-2 flex-wrap">
                  اضغط زر المشاركة <Share className="size-4 text-primary" /> في الأسفل.
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                <span className="shrink-0 size-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-extrabold">2</span>
                <div className="flex items-center gap-2 flex-wrap">
                  اختر <span className="font-bold">إضافة إلى الشاشة الرئيسية</span> <Plus className="size-4 text-primary" />.
                </div>
              </li>
            </ol>
            <button
              onClick={handleLater}
              className="w-full py-3 rounded-full bg-gold-gradient text-primary-foreground font-bold text-sm shadow-elegant"
            >
              فهمت
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}