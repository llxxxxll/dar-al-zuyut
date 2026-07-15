import { motion } from "framer-motion";
import { Wrench, Droplet, Filter, User, Calendar } from "lucide-react";
import { formatArDate } from "@/lib/reminder";

interface ServiceItem {
  id: string;
  service_date: string;
  oil_type: string | null;
  filter_changed: boolean | null;
  staff_name: string | null;
}

export function ServiceTimeline({ services }: { services: ServiceItem[] }) {
  if (services.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="size-16 mx-auto rounded-2xl bg-secondary grid place-items-center mb-4">
          <Wrench className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="font-bold text-lg mb-1">لا يوجد سجل بعد</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          ستظهر هنا كل خدمات تغيير الزيت تلقائياً بعد أول زيارة لدار الزيوت.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute right-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />

      <ul className="space-y-5">
        {services.map((s, i) => (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative pr-12"
          >
            {/* Dot */}
            <div className={`absolute right-0 top-2 size-10 rounded-xl grid place-items-center ring-4 ring-background ${
              i === 0 ? "bg-gold-gradient shadow-elegant" : "bg-secondary border border-border"
            }`}>
              <Droplet className={`size-4 ${i === 0 ? "text-primary-foreground" : "text-primary"}`} />
            </div>

            {/* Card */}
            <div className={`rounded-2xl border p-4 ${
              i === 0 ? "bg-gradient-to-l from-primary/5 to-card border-primary/30 shadow-soft" : "bg-card border-border"
            }`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-extrabold">{s.oil_type || "تغيير زيت"}</h4>
                    {i === 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        الأحدث
                      </span>
                    )}
                    {s.filter_changed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                        <Filter className="size-3" /> فلتر جديد
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" /> {formatArDate(s.service_date)}
                    </span>
                    {s.staff_name && (
                      <span className="inline-flex items-center gap-1">
                        <User className="size-3" /> {s.staff_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
