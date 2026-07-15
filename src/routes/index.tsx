import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Hero } from "@/components/site/Hero";
import { ServicesPreview } from "@/components/site/ServicesPreview";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Brands } from "@/components/site/Brands";
import { Testimonials } from "@/components/site/Testimonials";
import { Promotions } from "@/components/site/Promotions";
import { FaqPreview } from "@/components/site/FaqPreview";
import { LocationCta } from "@/components/site/LocationCta";
import { WhyUs } from "@/components/site/WhyUs";
import { ProductShowcase } from "@/components/site/ProductShowcase";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "دار الزيوت — زيوت أصلية وخدمة تذكير ذكية في الزاوية" },
      { name: "description", content: "أفضل زيوت ومواد مضافة وفلاتر في الزاوية، مع نظام تذكير تلقائي على واتساب لموعد تغيير الزيت. سجّل الآن مجاناً." },
      { property: "og:title", content: "دار الزيوت — زيوت أصلية وخدمة تذكير ذكية" },
      { property: "og:description", content: "زيوت أصلية، مواد مضافة، فلاتر، وخدمة تذكير تلقائية لتغيير الزيت." },
    ],
  }),
});

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <Brands />
      <ServicesPreview />
      <WhyUs />
      <HowItWorks />
      <ProductShowcase />
      <Promotions />
      <Testimonials />
      <FaqPreview />
      <LocationCta />
    </SiteLayout>
  );
}
