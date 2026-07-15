import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة | دار الزيوت" },
      { name: "description", content: "إجابات على أكثر الأسئلة شيوعًا حول الزيوت والفلاتر وخدمة التذكير." },
      { property: "og:title", content: "الأسئلة الشائعة | دار الزيوت" },
      { property: "og:description", content: "كل ما تحتاج معرفته عن خدماتنا." },
    ],
  }),
  component: FAQPage,
});

const fallback: { q: string; a: string }[] = [
  { q: "متى أحتاج لتغيير الزيت؟", a: "عادة كل 5,000 إلى 10,000 كم حسب نوع الزيت ونمط القيادة. نظامنا يحسب الموعد بدقة بناءً على استهلاك الوقود الأسبوعي." },
  { q: "كيف يعمل نظام التذكير؟", a: "بعد تسجيلك معنا، نحتفظ ببيانات سيارتك ومتوسط استهلاكك الأسبوعي ونرسل لك رسالة SMS قبل موعد التغيير القادم." },
  { q: "هل الزيوت لديكم أصلية؟", a: "نعم 100% — نتعامل مباشرة مع الموزعين الرسميين للعلامات العالمية في ليبيا." },
  { q: "هل تقدمون خدمة تغيير الزيت في الموقع؟", a: "نعم، يمكنك زيارة محلنا في الزاوية ونقوم بالخدمة خلال دقائق معدودة." },
  { q: "ما هي تكلفة الخدمة؟", a: "تختلف حسب نوع الزيت والسيارة. تواصل معنا للحصول على عرض سعر دقيق." },
  { q: "هل خدمة التذكير مجانية؟", a: "نعم، خدمة التذكير عبر SMS مجانية تمامًا لعملائنا المسجلين." },
];

function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("faqs")
        .select("question,answer,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      const rows = (data ?? []).map((r) => ({ q: r.question, a: r.answer }));
      setFaqs(rows.length ? rows : fallback);
      setLoading(false);
    })();
  }, []);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="مساعدة"
        title="الأسئلة الشائعة"
        subtitle="إجابات سريعة لأكثر ما يسأل عنه عملاؤنا."
      />
      <section className="container mx-auto px-4 md:px-8 py-16 max-w-3xl">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : (
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-right hover:bg-primary/5 transition-colors"
              >
                <span className="font-bold text-base md:text-lg">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 text-primary transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </section>
    </SiteLayout>
  );
}