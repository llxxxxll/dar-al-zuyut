import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | دار الزيوت" },
      { name: "description", content: "اتصل بنا أو زر محلنا في الزاوية، ليبيا. نحن جاهزون لخدمتك." },
      { property: "og:title", content: "تواصل معنا | دار الزيوت" },
      { property: "og:description", content: "اتصل بنا أو زر محلنا في الزاوية." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const s = useAppSettings();
  return (
    <SiteLayout>
      <PageHero
        eyebrow="تواصل"
        title="نحن هنا لخدمتك"
        subtitle="اتصل بنا، راسلنا على واتساب، أو زر محلنا مباشرة."
      />
      <section className="container mx-auto px-4 md:px-8 py-16 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6">
          <a
            href={`tel:${s.business_phone}`}
            className="group rounded-2xl border border-border bg-card p-8 hover:border-primary/40 hover:shadow-elegant transition-all"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <Phone className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold mb-2">اتصل بنا</h3>
            <p className="text-2xl font-bold text-primary mb-2" dir="ltr">{s.business_phone}</p>
            <p className="text-sm text-muted-foreground">متاحون يوميًا من 8 صباحًا حتى 9 مساءً</p>
          </a>

          <a
            href={`https://wa.me/${s.business_whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-border bg-card p-8 hover:border-primary/40 hover:shadow-elegant transition-all"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold mb-2">واتساب</h3>
            <p className="text-2xl font-bold text-primary mb-2" dir="ltr">+{s.business_whatsapp}</p>
            <p className="text-sm text-muted-foreground">رد سريع خلال دقائق</p>
          </a>

          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
              <MapPin className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold mb-2">موقعنا</h3>
            <p className="text-base font-bold mb-1">{s.business_address}</p>
            {s.business_maps_url && <a href={s.business_maps_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">افتح في الخرائط ←</a>}
          </div>

          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
              <Clock className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold mb-2">ساعات العمل</h3>
            <p className="text-base mb-1"><span className="font-bold">السبت - الخميس:</span> 8:00 ص - 9:00 م</p>
            <p className="text-base"><span className="font-bold">الجمعة:</span> 2:00 م - 9:00 م</p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}