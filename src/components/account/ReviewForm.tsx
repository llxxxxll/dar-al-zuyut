import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
}

interface Eligible {
  id: string; // appointment id
  service_type: string;
  requested_date: string;
}

export function ReviewForm({ userId }: Props) {
  const [eligible, setEligible] = useState<Eligible[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Eligible | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const load = async () => {
    const [{ data: appts }, { data: reviews }] = await Promise.all([
      supabase.from("appointments").select("id,service_type,requested_date").eq("user_id", userId).eq("status", "done").order("requested_date", { ascending: false }).limit(20),
      supabase.from("reviews").select("appointment_id").eq("user_id", userId),
    ]);
    setEligible((appts ?? []) as Eligible[]);
    setReviewedIds(new Set((reviews ?? []).map((r) => r.appointment_id).filter(Boolean) as string[]));
  };

  useEffect(() => { load(); }, [userId]);

  const pending = eligible.filter((e) => !reviewedIds.has(e.id));

  const submit = async () => {
    if (!active || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      appointment_id: active.id,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (!error) {
      setDone(true);
      setTimeout(() => {
        setActive(null);
        setRating(0);
        setComment("");
        setDone(false);
        load();
      }, 1800);
    }
  };

  if (pending.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <CheckCircle2 className="size-10 mx-auto text-emerald-500/50 mb-2" />
        لا توجد خدمات بانتظار التقييم. شكراً لك!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">شاركنا رأيك في الخدمات التي تلقّيتها مؤخراً:</p>
      {pending.map((e) => (
        <button
          key={e.id}
          onClick={() => setActive(e)}
          className="w-full text-right p-4 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 transition flex items-center justify-between gap-3"
        >
          <div>
            <div className="font-semibold">{e.service_type === "oil_change" ? "تغيير زيت" : e.service_type}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{new Date(e.requested_date).toLocaleDateString("ar-LY")}</div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
            <Star className="size-4" /> قيّم الآن
          </div>
        </button>
      ))}

      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="bg-card rounded-3xl border border-border shadow-elegant max-w-md w-full p-7">
              {done ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                    className="size-16 rounded-full bg-emerald-100 grid place-items-center mx-auto mb-4">
                    <CheckCircle2 className="size-8 text-emerald-600" />
                  </motion.div>
                  <h3 className="font-extrabold text-xl">شكراً لتقييمك!</h3>
                  <p className="text-sm text-muted-foreground mt-2">سنراجع تعليقك قريباً.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-extrabold text-xl text-center mb-2">كيف كانت تجربتك؟</h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">{active.service_type === "oil_change" ? "تغيير زيت" : active.service_type} · {new Date(active.requested_date).toLocaleDateString("ar-LY")}</p>

                  <div className="flex justify-center gap-1 mb-5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star className={`size-9 transition ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                      </button>
                    ))}
                  </div>

                  <label className="block">
                    <div className="text-xs font-bold text-muted-foreground mb-1.5 inline-flex items-center gap-1.5">
                      <MessageSquare className="size-3.5" /> تعليقك (اختياري)
                    </div>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                      placeholder="ما الذي أعجبك؟ وهل لديك اقتراحات؟"
                      className="w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  </label>

                  <div className="flex gap-2 mt-5">
                    <button onClick={() => { setActive(null); setRating(0); setComment(""); }}
                      className="flex-1 h-11 rounded-full border border-border font-semibold hover:bg-muted/50">
                      إلغاء
                    </button>
                    <button onClick={submit} disabled={rating === 0 || submitting}
                      className="flex-1 h-11 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant disabled:opacity-50 inline-flex items-center justify-center gap-2">
                      <Send className="size-4" /> إرسال
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
