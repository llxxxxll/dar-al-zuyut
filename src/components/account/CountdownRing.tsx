import { motion } from "framer-motion";
import { Bell, Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatArDate } from "@/lib/reminder";

interface Props {
  daysLeft: number | null;
  dueDate: string | null;
  totalDays: number;
  isEstimate?: boolean;
}

export function CountdownRing({ daysLeft, dueDate, totalDays, isEstimate }: Props) {
  const elapsed = daysLeft !== null ? Math.max(0, totalDays - daysLeft) : 0;
  const progress = daysLeft !== null ? Math.min(100, Math.max(0, (elapsed / totalDays) * 100)) : 0;
  const overdue = daysLeft !== null && daysLeft < 0;
  const soon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const palette = overdue
    ? { ring: "stroke-rose-400", glow: "from-rose-500/40", chip: "bg-rose-500", chipText: "text-white", title: "text-rose-300", value: "text-white" }
    : soon
    ? { ring: "stroke-amber-400", glow: "from-amber-500/40", chip: "bg-amber-500", chipText: "text-amber-950", title: "text-amber-300", value: "text-white" }
    : { ring: "stroke-primary", glow: "from-primary/40", chip: "bg-gold-gradient", chipText: "text-primary-foreground", title: "text-primary", value: "text-white" };

  const r = 88;
  const C = 2 * Math.PI * r;
  const dash = (progress / 100) * C;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl bg-onyx text-white p-6 md:p-8 border border-white/10 shadow-elegant"
    >
      <div className="absolute inset-0 bg-oil-radial opacity-50" />
      <div className={`absolute -top-24 -left-24 size-72 rounded-full bg-gradient-to-br ${palette.glow} to-transparent blur-3xl`} />
      <div className={`absolute -bottom-24 -right-24 size-64 rounded-full bg-gradient-to-tr ${palette.glow} to-transparent blur-3xl`} />

      <div className="relative grid md:grid-cols-[auto_1fr] items-center gap-8">
        {/* Ring */}
        <div className="relative mx-auto md:mx-0">
          <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
            <defs>
              <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.85 0.16 82)" />
                <stop offset="100%" stopColor="oklch(0.62 0.14 65)" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="14" fill="none" />
            <motion.circle
              cx="110" cy="110" r={r}
              stroke={overdue ? "oklch(0.7 0.22 25)" : soon ? "oklch(0.78 0.16 75)" : "url(#ring-grad)"}
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - dash }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {dueDate === null ? (
              <div className="text-white/60 text-sm">لا يوجد تذكير</div>
            ) : overdue ? (
              <>
                <div className="text-5xl font-black tabular-nums leading-none">{Math.abs(daysLeft!)}</div>
                <div className="text-xs text-rose-300 mt-1.5">يوم متأخر</div>
              </>
            ) : daysLeft === 0 ? (
              <div className="text-2xl font-black">اليوم!</div>
            ) : (
              <>
                <div className="text-6xl font-black tabular-nums leading-none">{daysLeft}</div>
                <div className="text-xs text-white/60 mt-1.5">يوم متبقّي</div>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${palette.chip} ${palette.chipText} text-xs font-bold mb-3`}>
            {overdue ? <AlertTriangle className="size-3.5" /> : soon ? <Clock className="size-3.5" /> : <Bell className="size-3.5" />}
            {overdue ? "تجاوزت الموعد" : soon ? "قريباً جداً" : "كل شيء على ما يرام"}
            {isEstimate && <span className="opacity-80">(تقديري)</span>}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-white">
            {overdue ? "حان وقت تغيير الزيت" : daysLeft === 0 ? "اليوم موعد التغيير" : "موعد تغيير الزيت القادم"}
          </h2>

          {dueDate && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65 mb-5">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4 text-primary" /> {formatArDate(dueDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-primary" /> الكورس {totalDays} يوم
              </span>
            </div>
          )}

          {/* Progress strip */}
          {dueDate && (
            <div>
              <div className="flex justify-between text-[11px] text-white/55 mb-1.5">
                <span>التقدّم</span>
                <span className="tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${overdue ? "bg-rose-400" : soon ? "bg-amber-400" : "bg-gradient-to-l from-primary to-primary-glow"}`}
                />
              </div>
              <div className="text-[11px] text-white/45 mt-2 inline-flex items-center gap-1.5">
                {progress < 100 ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <AlertTriangle className="size-3.5 text-rose-400" />}
                سنرسل لك تذكير على واتساب قبل الموعد
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
