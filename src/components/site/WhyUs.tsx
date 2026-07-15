import { motion } from "framer-motion";
import { ShieldCheck, Zap, ClipboardList, Heart, MapPin, Award } from "lucide-react";
import { media } from "@/lib/media";

const serviceImg = media.service;

const points = [
  { icon: ShieldCheck, title: "منتجات أصلية وموثوقة", desc: "نتعامل مع موزّعين معتمدين فقط لجميع العلامات." },
  { icon: Zap, title: "خدمة سريعة ومنظّمة", desc: "نحترم وقتك. خدمة احترافية بدون تأخير." },
  { icon: ClipboardList, title: "فحص ومتابعة دقيقة", desc: "نتابع حالة زيت سيارتك ونذكّرك تلقائياً." },
  { icon: Heart, title: "اهتمام بأداء محركك", desc: "نختار لك الزيت المناسب لنوع سيارتك." },
  { icon: MapPin, title: "موقع سهل الوصول", desc: "في الزاوية الساحلي على طريق الخدمات." },
  { icon: Award, title: "+10 سنوات خبرة", desc: "خبرة موثوقة في مجال زيوت السيارات." },
];

export function WhyUs() {
  return (
    <section className="relative py-20 md:py-28 bg-onyx text-white overflow-hidden">
      <div className="absolute inset-0 bg-oil-radial opacity-40" />
      <div className="absolute top-0 right-0 size-96 bg-primary/15 rounded-full blur-[120px]" />

      <div className="container relative mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-elegant ring-1 ring-primary/30">
              <img src={serviceImg} alt="خدمة احترافية" loading="lazy" className="w-full h-[460px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 right-6 left-6">
                <div className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-2">
                  منذ 2014
                </div>
                <div className="text-2xl font-extrabold">خبرة محلية موثوقة</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-gold-gradient text-primary-foreground rounded-2xl p-5 shadow-elegant w-44 hidden md:block">
              <div className="text-3xl font-extrabold">+5,000</div>
              <div className="text-xs font-bold mt-1">عميل يثق بنا</div>
            </div>
          </motion.div>

          <div className="lg:col-span-7">
            <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">لماذا دار الزيوت</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              نختلف بـ <span className="text-gold-gradient">التفاصيل</span><br /> ونتميّز بـ <span className="text-gold-gradient">الثقة</span>
            </h2>
            <p className="text-white/65 text-base md:text-lg mb-8 leading-relaxed">
              في دار الزيوت لا نبيع زيتاً فقط — نقدّم رعاية حقيقية لمحرك سيارتك تبدأ من اختيار المنتج الصحيح وتنتهي
              بتذكير ذكي بموعد التغيير القادم.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {points.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/[0.07] transition-all"
                >
                  <div className="shrink-0 size-11 rounded-xl bg-gold-gradient grid place-items-center shadow-elegant">
                    <p.icon className="size-5 text-primary-foreground" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-bold mb-1">{p.title}</div>
                    <div className="text-xs text-white/60 leading-relaxed">{p.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
