import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  name: string;
  role: string;
  rating: number;
  text: string;
}

const fallback: Item[] = [
  { name: "أحمد المغربي", role: "عميل دائم", rating: 5, text: "خدمة ممتازة وتذكير دقيق. نسيت موعد التغيير لكن وصلتني رسالة الواتساب في الوقت المناسب. شكراً لكم!" },
  { name: "فاطمة الزرقاء", role: "صاحبة سيارة كيا", rating: 5, text: "أول مرة أحس أن في محل زيوت يهتم بعميله بهذا الشكل. أسعار معقولة وزيوت أصلية 100%." },
  { name: "سالم بن علي", role: "سائق أجرة", rating: 5, text: "بالنسبة لي السيارة شغلي. خدمة التذكير وفّرت عليّ وقت ومجهود كبير. ما أصرف عند غيرهم." },
];

export function Testimonials() {
  const [items, setItems] = useState<Item[]>(fallback);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating,comment,user_id,is_featured,created_at")
        .eq("is_approved", true)
        .not("comment", "is", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (!data || data.length === 0) return;
      const userIds = Array.from(new Set(data.map((r) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", userIds);
      const map = new Map<string, string>();
      profs?.forEach((p) => map.set(p.id, p.full_name ?? "عميل"));
      const real: Item[] = data
        .filter((r) => r.comment)
        .map((r) => ({
          name: map.get(r.user_id) ?? "عميل",
          role: "عميل موثّق",
          rating: r.rating,
          text: r.comment ?? "",
        }));
      if (real.length > 0) setItems(real);
    })();
  }, []);

  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-3">آراء عملائنا</div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">+5,000 عميل يثقون بنا</h2>
          <p className="text-muted-foreground text-lg">نحن فخورون بثقة عملائنا. اقرأ تجاربهم بأنفسهم.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.slice(0, 6).map((t, i) => (
            <motion.div
              key={`${t.name}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-card rounded-3xl p-7 border border-border shadow-card hover:shadow-elegant transition-all"
            >
              <Quote className="absolute top-5 left-5 h-10 w-10 text-primary/15" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="size-11 rounded-full bg-gold-gradient grid place-items-center text-primary-foreground font-extrabold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
