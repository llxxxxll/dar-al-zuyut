import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Droplet, Truck, Bike, Anchor, Filter, FlaskConical, Sparkles, Wrench, Gauge, ArrowLeft } from "lucide-react";

const services = [
  { icon: Droplet, title: "زيوت السيارات", desc: "زيوت أصلية لكل أنواع المحركات الحديثة." },
  { icon: Truck, title: "زيوت الشاحنات", desc: "زيوت ثقيلة الأداء للشاحنات والمعدّات." },
  { icon: Bike, title: "زيوت الموطوات", desc: "زيوت مخصّصة للدراجات النارية." },
  { icon: Anchor, title: "زيوت الموطوات البحرية", desc: "للقوارب والمحركات البحرية." },
  { icon: Filter, title: "الفلاتر", desc: "فلاتر زيت، هواء، بنزين أصلية وعالية الأداء." },
  { icon: FlaskConical, title: "المواد المضافة", desc: "إضافات تحسّن أداء المحرك وتطيل عمره." },
  { icon: Sparkles, title: "منتجات العناية", desc: "كل ما تحتاجه لعناية كاملة بسيارتك." },
  { icon: Wrench, title: "تنظيف المحركات", desc: "تنظيف داخلي احترافي لمحركات السيارات." },
  { icon: Gauge, title: "فحص الكمبيو والكرونة", desc: "فحص دقيق لزيت ناقل الحركة والكرونة." },
];

export function ServicesPreview() {
  return (
    <section className="relative py-20 md:py-28 oil-drops">
      <div className="container relative mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase mb-4">
            <span className="h-px w-8 bg-primary/50" /> خدماتنا <span className="h-px w-8 bg-primary/50" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            كل ما يحتاجه <span className="text-gold-gradient">محركك</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            تشكيلة شاملة من الزيوت والفلاتر والخدمات لجميع أنواع المركبات.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="group relative overflow-hidden border-luxe rounded-3xl p-6 hover:shadow-elegant hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute -top-12 -left-12 size-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative size-14 rounded-2xl bg-gradient-to-br from-onyx to-onyx-soft grid place-items-center mb-5 shadow-elegant ring-1 ring-primary/30">
                <s.icon className="h-7 w-7 text-primary" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-extrabold mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/services"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/30 hover:bg-primary/10 text-sm font-bold text-foreground hover:gap-3 transition-all"
          >
            استكشف كل الخدمات
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
