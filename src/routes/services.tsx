import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import * as Lucide from "lucide-react";
import { Droplet, Filter, FlaskConical, Wrench, Bell, Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "خدماتنا | دار الزيوت" },
      { name: "description", content: "زيوت سيارات وشاحنات ودراجات، فلاتر، مواد مضافة، وخدمة تذكير ذكية بموعد تغيير الزيت." },
      { property: "og:title", content: "خدماتنا | دار الزيوت" },
      { property: "og:description", content: "زيوت أصلية، فلاتر، مواد مضافة، وخدمة تذكير ذكية." },
    ],
  }),
  component: ServicesPage,
});

const FALLBACK = [
  { icon: Droplet, title: "زيوت سيارات", desc: "أفضل العلامات العالمية للزيوت الاصطناعية ونصف الاصطناعية." },
  { icon: Truck, title: "زيوت شاحنات ودراجات", desc: "زيوت متخصصة للشاحنات الثقيلة والدراجات النارية." },
  { icon: Filter, title: "فلاتر أصلية", desc: "فلاتر زيت وهواء ووقود وكابينة بجودة عالية." },
  { icon: FlaskConical, title: "مواد مضافة", desc: "مواد لتحسين أداء المحرك وإطالة عمره." },
  { icon: Wrench, title: "تغيير الزيت", desc: "خدمة سريعة واحترافية على يد فنيين مختصين." },
  { icon: Bell, title: "تذكير ذكي", desc: "نذكّرك تلقائيًا بموعد تغيير الزيت القادم عبر رسالة SMS." },
];

interface Svc { id: string; name: string; description: string | null; icon: string | null; price: number | null; duration_minutes: number | null; }

function iconFor(name: string | null) {
  if (!name) return Wrench;
  const Comp = (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Comp || Wrench;
}

function ServicesPage() {
  const [items, setItems] = useState<Svc[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("id,name,description,icon,price,duration_minutes")
        .eq("is_active", true)
        .order("sort_order")
        .order("name");
      setItems((data as Svc[]) ?? []);
    })();
  }, []);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="ما نقدمه"
        title="خدمات شاملة لسيارتك"
        subtitle="من اختيار الزيت المناسب إلى تذكيرك بموعد التغيير القادم — نحن معك في كل خطوة."
      />
      <section className="container mx-auto px-4 md:px-8 py-16">
        {items === null ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FALLBACK.map((s) => (
              <div key={s.title} className="group relative rounded-2xl border border-border bg-card p-8 hover:border-primary/40 transition-all hover:shadow-elegant">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((s) => {
              const Icon = iconFor(s.icon);
              return (
                <div key={s.id} className="group relative rounded-2xl border border-border bg-card p-8 hover:border-primary/40 transition-all hover:shadow-elegant">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-2">{s.name}</h3>
                  {s.description && <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>}
                  {(s.price != null || s.duration_minutes) && (
                    <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-3 text-xs text-muted-foreground">
                      {s.price != null && <span className="font-bold text-primary">{s.price} د.ل</span>}
                      {s.duration_minutes && <span>⏱ {s.duration_minutes} د</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}