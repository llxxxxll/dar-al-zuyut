import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Wrench, Database, MessageCircle, ArrowLeft } from "lucide-react";

const steps = [
  { icon: Wrench, num: "01", title: "غيّر الزيت في دار الزيوت", desc: "زرنا للحصول على خدمة تغيير زيت احترافية ومناسبة لسيارتك." },
  { icon: Database, num: "02", title: "نسجّل بيانات الخدمة", desc: "نوع الزيت، التاريخ، وعدد الكيلومترات في حسابك الخاص." },
  { icon: MessageCircle, num: "03", title: "نذكّرك في الوقت المناسب", desc: "تصلك رسالة على الواتساب قبل موعد التغيير القادم." },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 md:py-28 bg-secondary/40 oil-drops overflow-hidden">
      <div className="container relative mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-4">
            🚀 ميزة حصرية
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            خدمة <span className="text-gold-gradient">التذكير الذكي</span> بتغيير الزيت
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            سجّل رقمك وننسى بالك من موعد تغيير الزيت — نحن نتذكّر عنك.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6 lg:gap-8">
          {/* connector line */}
          <div className="hidden md:block absolute top-16 right-[16%] left-[16%] h-px bg-gradient-to-l from-primary/40 via-primary/20 to-primary/40" />

          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative bg-card border-luxe rounded-3xl p-7 text-center hover:shadow-elegant transition-all"
            >
              <div className="relative mx-auto mb-5">
                <div className="size-20 mx-auto rounded-full bg-gradient-to-br from-onyx to-onyx-soft grid place-items-center shadow-elegant ring-4 ring-background">
                  <s.icon className="size-9 text-primary" strokeWidth={1.6} />
                </div>
                <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-gold-gradient text-primary-foreground text-xs font-extrabold shadow-elegant">
                  {s.num}
                </div>
              </div>
              <h3 className="text-xl font-extrabold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/join"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gold-gradient text-primary-foreground font-extrabold shadow-elegant hover:shadow-glow hover:scale-[1.03] transition-all"
          >
            سجّل في خدمة التذكير
            <ArrowLeft className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
