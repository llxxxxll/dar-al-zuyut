import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tag, Percent, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Promo {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_percent: number | null;
  price: number | null;
  badge: string | null;
  cta_label: string | null;
  cta_link: string | null;
  ends_at: string | null;
}

export function Promotions() {
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("promotions")
        .select("id,title,description,image_url,discount_percent,price,badge,cta_label,cta_link,ends_at")
        .eq("is_active", true)
        .order("sort_order")
        .limit(6);
      setPromos((data ?? []) as Promo[]);
    })();
  }, []);

  if (promos.length === 0) return null;

  return (
    <section className="py-20 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase mb-3">
            <Tag className="size-3.5" /> عروض وخصومات
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">عروض حصرية لعملائنا</h2>
          <p className="text-muted-foreground text-lg">استفد من عروضنا الترويجية وتمتّع بأفضل الأسعار</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative bg-card rounded-3xl overflow-hidden border border-border shadow-card hover:shadow-elegant transition-all"
            >
              {p.image_url ? (
                <div className="h-44 overflow-hidden bg-muted">
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent grid place-items-center">
                  <Tag className="size-16 text-primary/30" />
                </div>
              )}

              {p.discount_percent && (
                <div className="absolute top-4 right-4 size-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 grid place-items-center text-white font-extrabold shadow-elegant rotate-[-8deg]">
                  <div className="text-center leading-none">
                    <div className="text-xl">{p.discount_percent}%</div>
                    <div className="text-[9px] mt-0.5">خصم</div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {p.badge && (
                  <span className="inline-block text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-2">
                    {p.badge}
                  </span>
                )}
                <h3 className="text-xl font-extrabold mb-2">{p.title}</h3>
                {p.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{p.description}</p>}

                {p.price != null && (
                  <div className="mt-3 inline-flex items-baseline gap-1 text-primary">
                    <span className="text-2xl font-extrabold">{p.price}</span>
                    <span className="text-xs font-bold opacity-70">د.ل</span>
                  </div>
                )}

                {p.ends_at && (
                  <div className="text-xs text-muted-foreground mt-3">
                    ⏳ ساري حتى {new Date(p.ends_at).toLocaleDateString("ar-LY")}
                  </div>
                )}

                {p.cta_label && p.cta_link && (
                  <a
                    href={p.cta_link}
                    className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-primary hover:gap-3 transition-all"
                  >
                    {p.cta_label} <ArrowLeft className="size-4" />
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
