import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Droplet, Filter, FlaskConical, Sparkles, Wrench } from "lucide-react";
import { media } from "@/lib/media";

const productsImg = media.products;

const categories = [
  { icon: Droplet, label: "زيوت محرّكات" },
  { icon: Filter, label: "فلاتر متنوعة" },
  { icon: FlaskConical, label: "مواد مضافة" },
  { icon: Sparkles, label: "منتجات عناية" },
  { icon: Wrench, label: "مستلزمات سيارات" },
];

export function ProductShowcase() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute -inset-6 bg-primary/10 rounded-[2rem] blur-3xl" />
            <div className="relative rounded-3xl overflow-hidden ring-1 ring-primary/20 shadow-elegant bg-onyx">
              <img src={productsImg} alt="منتجات دار الزيوت" loading="lazy" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">منتجاتنا</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
              تشكيلة <span className="text-gold-gradient">واسعة</span> من المنتجات
              <br />تحت سقف واحد
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
              نوفّر لك كل ما يحتاجه محركك من زيوت وفلاتر ومواد مضافة ومنتجات عناية بأفضل العلامات التجارية العالمية.
            </p>

            <div className="space-y-3 mb-8">
              {categories.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:translate-x-[-4px] transition-all"
                >
                  <div className="size-12 rounded-xl bg-gold-soft border border-primary/25 grid place-items-center">
                    <c.icon className="size-5 text-primary" />
                  </div>
                  <div className="font-bold flex-1">{c.label}</div>
                  <ArrowLeft className="size-5 text-primary/60" />
                </motion.div>
              ))}
            </div>

            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-[1.03] transition-all"
            >
              تعرّف على الخدمات
              <ArrowLeft className="size-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
