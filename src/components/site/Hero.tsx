import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Phone, MapPin, Sparkles } from "lucide-react";
import { media } from "@/lib/media";

const heroOil = media.heroPoster;
const logo = media.logo;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-onyx-gold text-white">
      {/* Background image */}
      <div className="absolute inset-0">
        <video
          src={media.heroVideo}
          poster={heroOil}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/70 to-black/95" />
        <div className="absolute inset-0 bg-oil-radial opacity-70" />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 -right-24 size-[420px] rounded-full bg-primary/25 blur-[120px]" />
      <div className="absolute bottom-1/4 -left-24 size-[420px] rounded-full bg-primary-glow/15 blur-[120px]" />

      <div className="container relative mx-auto px-4 md:px-8 pt-16 pb-24 md:pt-24 md:pb-36">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 text-center lg:text-right order-2 lg:order-1"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-primary/30 text-xs md:text-sm font-bold mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-white/90">عناية احترافية بمحرك سيارتك منذ 2014</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              <span className="block text-white">دار الزيوت</span>
              <span className="block gold-shimmer mt-2">عناية احترافية لمحركك</span>
            </h1>

            <p className="text-base md:text-xl text-white/75 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
              زيوت أصلية، فلاتر عالية الجودة، ومواد مضافة لكل أنواع المركبات — مع خدمة تغيير وفحص احترافية في
              <span className="font-bold text-primary"> الزاوية الساحلي</span>.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
              <a
                href="tel:0927527000"
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-gold-gradient text-primary-foreground font-extrabold shadow-elegant hover:shadow-glow hover:scale-[1.03] transition-all"
              >
                <Phone className="h-5 w-5" /> اتصل الآن
              </a>
              <a
                href="https://maps.app.goo.gl/huKzaRsULr8ARJ92A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur hover:bg-white/10 hover:border-primary/60 font-bold text-white transition-all"
              >
                <MapPin className="h-5 w-5" /> الموقع على الخريطة
              </a>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-white/85 hover:text-primary font-bold transition-all group"
              >
                خدماتنا <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              {[
                { v: "+10", l: "سنوات خبرة" },
                { v: "+5K", l: "عميل سعيد" },
                { v: "100%", l: "زيوت أصلية" },
              ].map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-center border-r border-white/10 first:border-r-0 px-2"
                >
                  <div className="text-2xl md:text-3xl font-extrabold text-gold-gradient">{s.v}</div>
                  <div className="text-[11px] md:text-xs text-white/55 mt-1">{s.l}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="lg:col-span-5 relative order-1 lg:order-2 flex items-center justify-center"
          >
            <div className="relative w-[260px] h-[260px] md:w-[400px] md:h-[400px]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-primary/40"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-8 rounded-full border border-primary/15"
              />
              <div className="absolute inset-14 rounded-full bg-primary/30 blur-3xl" />
              <div className="absolute inset-12 rounded-full bg-gradient-to-br from-black to-onyx ring-2 ring-primary/40 shadow-glow flex items-center justify-center overflow-hidden">
                <motion.img
                  src={logo}
                  alt="دار الزيوت"
                  className="w-[78%] h-[78%] object-contain"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Floating chips */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -right-2 md:top-2 md:right-0 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5"
              >
                <div className="text-[10px] text-white/55">جودة موثقة</div>
                <div className="text-sm font-bold text-primary">زيوت أصلية</div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="absolute -bottom-2 -left-2 md:bottom-2 md:left-0 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5"
              >
                <div className="text-[10px] text-white/55">تذكير ذكي</div>
                <div className="text-sm font-bold text-primary">واتساب تلقائي</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}
