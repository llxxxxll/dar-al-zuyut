import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Clock, Mail, Bell } from "lucide-react";

export function LocationCta() {
  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">تواصل وموقع</div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-3">
            زرنا في <span className="text-gold-gradient">الزاوية الساحلي</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            نحن قريبون منك. تواصل أو زرنا في موقعنا.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl overflow-hidden border border-border shadow-card min-h-[420px] relative"
          >
            <iframe
              title="موقع دار الزيوت"
              src="https://www.google.com/maps?q=32.7572,12.7281&z=14&output=embed"
              className="w-full h-full min-h-[420px] border-0"
              loading="lazy"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-onyx text-white rounded-3xl p-8 md:p-10 shadow-elegant relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-20 -left-20 size-60 bg-primary/20 rounded-full blur-3xl" />

            <div className="relative space-y-5">
              <Info icon={MapPin} title="العنوان" value="الزاوية الساحلي - بعد إشارة الضمان، طريق الخدمات غرباً" />
              <Info icon={Phone} title="الهاتف" value="0927527000" dir="ltr" href="tel:0927527000" />
              <Info icon={Mail} title="البريد الإلكتروني" value="dar.alzuyut21@gmail.com" href="mailto:dar.alzuyut21@gmail.com" />
              <Info icon={Clock} title="ساعات العمل" value="السبت - الخميس | 8 صباحاً - 8 مساءً" />
            </div>

            <div className="relative grid sm:grid-cols-2 gap-3 mt-8">
              <a
                href="tel:0927527000"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all"
              >
                <Phone className="h-5 w-5" /> اتصل الآن
              </a>
              <a
                href="https://maps.app.goo.gl/huKzaRsULr8ARJ92A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary font-bold text-white transition-all"
              >
                <MapPin className="h-5 w-5" /> الخريطة
              </a>
              <Link
                to="/join"
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 font-bold text-primary transition-all"
              >
                <Bell className="h-5 w-5" /> سجّل في خدمة التذكير
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Info({ icon: Icon, title, value, href, dir }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string; href?: string; dir?: "ltr" | "rtl" }) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="shrink-0 size-11 rounded-xl bg-gold-gradient grid place-items-center shadow-elegant">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <div className="text-[11px] font-bold text-white/55 uppercase tracking-[0.15em]">{title}</div>
        <div className="font-bold text-white mt-0.5 text-sm md:text-base" dir={dir}>{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} className="block hover:opacity-90 transition">{content}</a> : content;
}
