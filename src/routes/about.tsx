import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Target, Eye, Gem } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "من نحن | دار الزيوت" },
      { name: "description", content: "تعرف على دار الزيوت، رؤيتنا في تقديم أفضل خدمات زيوت السيارات في الزاوية، ليبيا." },
    ],
  }),
});

const pillars = [
  { icon: Target, title: "رسالتنا", desc: "نسعى لتقديم أفضل تجربة عناية بالسيارات من خلال زيوت أصلية وخدمة شخصية ومتابعة دقيقة لكل عميل." },
  { icon: Eye, title: "رؤيتنا", desc: "أن نكون الوجهة الأولى لأصحاب السيارات في الزاوية لكل ما يخص الزيوت والصيانة الوقائية." },
  { icon: Gem, title: "قيمنا", desc: "الجودة، الأمانة، الاهتمام بالتفاصيل، والابتكار في خدمة العميل." },
];

function About() {
  return (
    <SiteLayout>
      <PageHero eyebrow="من نحن" title="قصة دار الزيوت" subtitle="رحلة من الجودة والاهتمام بكل تفصيل لخدمة سياراتكم." />
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none text-center mb-16"
          >
            <p className="text-lg md:text-xl text-foreground/80 leading-loose">
              <span className="font-bold text-foreground">دار الزيوت</span> هي وجهتك الموثوقة في الزاوية لكل ما يخص زيوت السيارات والشاحنات والدراجات والموطوات البحرية.
              نقدم لك مجموعة شاملة من المنتجات الأصلية، ومن الفلاتر والمواد المضافة، إلى خدمات تنظيف المحركات وفحص زيت الكمبيو والكرونة.
              نحن لا نبيع منتجاً فقط — نحن نهتم بسيارتك كما لو كانت سيارتنا.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-3xl p-8 text-center shadow-card border border-border hover:shadow-elegant transition-all"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gold-gradient flex items-center justify-center mb-5 shadow-elegant">
                  <p.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}