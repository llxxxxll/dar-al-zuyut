import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Plus, Minus, ArrowLeft } from "lucide-react";

const faqs = [
  { q: "كل كم يجب تغيير زيت السيارة؟", a: "يُنصح بتغيير الزيت كل 5,000 كم تقريباً، أو حسب توصية الشركة المصنّعة لسيارتك." },
  { q: "كيف يعمل نظام التذكير؟", a: "نعتمد على قراءة عدّاد سيارتك عند آخر خدمة + المسافة المعتادة لتغيير الزيت (5000 كم / 21 يوم تقريبًا)، ونرسل لك تذكيراً تلقائياً عبر الرسائل والواتساب." },
  { q: "هل الزيوت لديكم أصلية؟", a: "نعم 100%. نتعامل مع موزّعين معتمدين فقط لكل العلامات التجارية المتوفرة." },
  { q: "هل أحتاج لحجز موعد مسبق؟", a: "غير ضروري، لكن الحجز يوفّر وقتك. يمكنك حجز موعد بسهولة من حسابك بعد التسجيل." },
];

export function FaqPreview() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <div className="text-xs font-bold tracking-widest text-primary uppercase mb-3">أسئلة شائعة</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-5">إجابات على أكثر الأسئلة شيوعاً</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              لو ما لقيت إجابتك هنا، تفضّل بزيارة صفحة الأسئلة الشائعة كاملة أو تواصل معنا مباشرة.
            </p>
            <Link to="/faq" className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all">
              كل الأسئلة
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border border-border bg-card rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-5 text-right hover:bg-secondary/40 transition-colors"
                >
                  <span className="font-bold text-base">{f.q}</span>
                  <div className="shrink-0 size-8 rounded-full bg-primary/10 grid place-items-center text-primary">
                    {open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-muted-foreground leading-relaxed">{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}