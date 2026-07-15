import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Users, Wrench, Bell, Clock, Calendar, ArrowLeft, Plus, Tag,
  TrendingUp, Sparkles, Star, MessageSquare,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatArDate } from "@/lib/reminder";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

interface Stats {
  customers: number;
  servicesThisMonth: number;
  pendingReminders: number;
  dueThisWeek: number;
  pendingAppointments: number;
  reviewsAvg: number;
  reviewsCount: number;
}

interface ChartPoint { day: string; services: number; appointments: number; }

function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    customers: 0, servicesThisMonth: 0, pendingReminders: 0, dueThisWeek: 0,
    pendingAppointments: 0, reviewsAvg: 0, reviewsCount: 0,
  });
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [recent, setRecent] = useState<Array<{ id: string; service_date: string; oil_type: string | null; user_id: string; profile?: { full_name: string | null; phone: string | null } }>>([]);
  const [upcoming, setUpcoming] = useState<Array<{ id: string; due_date: string; user_id: string; profile?: { full_name: string | null; phone: string | null } }>>([]);
  const [pendingApts, setPendingApts] = useState<Array<{ id: string; requested_date: string; service_type: string; user_id: string; profile?: { full_name: string | null; phone: string | null } }>>([]);

  useEffect(() => {
    (async () => {
      const today = new Date();
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
      const last30 = new Date(); last30.setDate(last30.getDate() - 30);

      const [
        { count: customers },
        { count: servicesThisMonth },
        { count: pendingReminders },
        { count: dueThisWeek },
        { count: pendingAppointments },
        { data: reviewsData },
        { data: recentSv },
        { data: upcomingRm },
        { data: pendingApt },
        { data: svFor30 },
        { data: aptFor30 },
      ] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("service_records").select("id", { count: "exact", head: true }).gte("service_date", monthStart.toISOString().slice(0,10)),
        supabase.from("reminders").select("id", { count: "exact", head: true }).in("status", ["pending", "due"]),
        supabase.from("reminders").select("id", { count: "exact", head: true }).in("status", ["pending", "due"]).lte("due_date", weekEnd.toISOString().slice(0,10)),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("rating").eq("is_approved", true),
        supabase.from("service_records").select("id,service_date,oil_type,user_id").order("service_date", { ascending: false }).limit(5),
        supabase.from("reminders").select("id,due_date,user_id").in("status", ["pending", "due"]).order("due_date", { ascending: true }).limit(5),
        supabase.from("appointments").select("id,requested_date,service_type,user_id").eq("status", "pending").order("requested_date").limit(5),
        supabase.from("service_records").select("service_date").gte("service_date", last30.toISOString().slice(0,10)),
        supabase.from("appointments").select("requested_date").gte("requested_date", last30.toISOString().slice(0,10)),
      ]);

      // Build last-30-day chart
      const dayMap = new Map<string, { services: number; appointments: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        dayMap.set(d.toISOString().slice(0, 10), { services: 0, appointments: 0 });
      }
      svFor30?.forEach((r) => {
        const k = r.service_date.slice(0, 10);
        const e = dayMap.get(k);
        if (e) e.services += 1;
      });
      aptFor30?.forEach((r) => {
        const k = r.requested_date.slice(0, 10);
        const e = dayMap.get(k);
        if (e) e.appointments += 1;
      });
      const chartArr = Array.from(dayMap.entries()).map(([k, v]) => ({
        day: new Date(k).toLocaleDateString("ar-LY", { day: "numeric", month: "short" }),
        ...v,
      }));

      // Reviews avg
      const ratings = (reviewsData ?? []).map((r) => r.rating ?? 0);
      const reviewsAvg = ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

      // Hydrate profiles for recent/upcoming/apts
      const userIds = Array.from(new Set([...(recentSv ?? []), ...(upcomingRm ?? []), ...(pendingApt ?? [])].map((r) => r.user_id)));
      const profilesMap = new Map<string, { full_name: string | null; phone: string | null }>();
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name,phone").in("id", userIds);
        profs?.forEach((p) => profilesMap.set(p.id, { full_name: p.full_name, phone: p.phone }));
      }

      setStats({
        customers: customers ?? 0,
        servicesThisMonth: servicesThisMonth ?? 0,
        pendingReminders: pendingReminders ?? 0,
        dueThisWeek: dueThisWeek ?? 0,
        pendingAppointments: pendingAppointments ?? 0,
        reviewsAvg, reviewsCount: ratings.length,
      });
      setChart(chartArr);
      setRecent((recentSv ?? []).map((s) => ({ ...s, profile: profilesMap.get(s.user_id) })));
      setUpcoming((upcomingRm ?? []).map((r) => ({ ...r, profile: profilesMap.get(r.user_id) })));
      setPendingApts((pendingApt ?? []).map((a) => ({ ...a, profile: profilesMap.get(a.user_id) })));
    })();
  }, []);

  const cards = [
    { label: "إجمالي العملاء", value: stats.customers, icon: Users, accent: "from-primary/30 to-primary/5", iconBg: "bg-gold-gradient" },
    { label: "خدمات هذا الشهر", value: stats.servicesThisMonth, icon: Wrench, accent: "from-emerald-500/25 to-transparent", iconBg: "bg-emerald-500" },
    { label: "تذكيرات نشطة", value: stats.pendingReminders, icon: Bell, accent: "from-amber-500/25 to-transparent", iconBg: "bg-amber-500" },
    { label: "تستحق هذا الأسبوع", value: stats.dueThisWeek, icon: Clock, accent: "from-rose-500/25 to-transparent", iconBg: "bg-rose-500" },
  ];

  const quickActions = [
    { to: "/admin/customers", label: "إضافة عميل", icon: Users, desc: "تسجيل عميل جديد" },
    { to: "/admin/services", label: "تسجيل خدمة", icon: Wrench, desc: "إضافة سجل تغيير زيت" },
    { to: "/admin/promotions", label: "إنشاء عرض", icon: Tag, desc: "عرض ترويجي جديد" },
    { to: "/admin/templates", label: "قالب رسالة", icon: MessageSquare, desc: "تخصيص رسالة تذكير" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Greeting strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-onyx text-white p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-oil-radial opacity-40" />
        <div className="absolute -top-16 -left-16 size-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-primary mb-2">
              <Sparkles className="size-3.5" /> أهلاً بك مجدداً
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-1">لوحة تحكم دار الزيوت</h2>
            <p className="text-white/60 text-sm">إليك ملخّص النشاط لآخر 30 يوماً.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 border border-white/10">
              <div className="flex items-center gap-2 text-amber-300 text-sm font-bold">
                <Star className="size-4 fill-amber-300" /> {stats.reviewsAvg || "—"}
              </div>
              <div className="text-[11px] text-white/55 mt-0.5">{stats.reviewsCount} تقييم</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 border border-white/10">
              <div className="flex items-center gap-2 text-primary text-sm font-bold">
                <Calendar className="size-4" /> {stats.pendingAppointments}
              </div>
              <div className="text-[11px] text-white/55 mt-0.5">حجوزات معلّقة</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elegant transition-all group"
          >
            <div className={`absolute -top-12 -left-12 size-32 rounded-full bg-gradient-to-br ${c.accent} blur-2xl opacity-60 group-hover:opacity-100 transition`} />
            <div className="flex items-center justify-between relative">
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{c.label}</div>
                <div className="text-3xl font-extrabold mt-2">{c.value}</div>
              </div>
              <div className={`size-12 rounded-2xl ${c.iconBg} grid place-items-center text-white shadow-elegant`}>
                <c.icon className="size-6" strokeWidth={2} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" /> نشاط آخر 30 يوماً
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">الخدمات والمواعيد بحسب التاريخ</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" /> خدمات
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" /> مواعيد
              </div>
            </div>
          </div>
          <div className="h-[280px] -mx-2">
            <ResponsiveContainer>
              <AreaChart data={chart} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.15 70)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="oklch(0.72 0.15 70)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.16 155)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.65 0.16 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 75)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "oklch(0.46 0.025 60)" }} interval="preserveStartEnd" minTickGap={20} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.46 0.025 60)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.88 0.02 75)", background: "oklch(0.99 0.005 80)", fontSize: 12 }}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="services" stroke="oklch(0.72 0.15 70)" strokeWidth={2.5} fill="url(#g1)" />
                <Area type="monotone" dataKey="appointments" stroke="oklch(0.6 0.14 155)" strokeWidth={2.5} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <h3 className="font-extrabold text-lg flex items-center gap-2 mb-4">
            <Plus className="size-4 text-primary" /> اختصارات سريعة
          </h3>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="size-10 rounded-xl bg-gold-soft border border-primary/25 grid place-items-center group-hover:scale-105 transition">
                  <a.icon className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{a.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{a.desc}</div>
                </div>
                <ArrowLeft className="size-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity lists */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Section title="حجوزات معلّقة" icon={Calendar} link="/admin/appointments" color="text-amber-600">
          {pendingApts.length === 0 && <Empty msg="لا توجد حجوزات معلّقة" />}
          {pendingApts.map((a) => (
            <Row
              key={a.id}
              title={a.profile?.full_name || "عميل"}
              subtitle={a.profile?.phone || "—"}
              meta={a.service_type === "oil_change" ? "تغيير زيت" : a.service_type}
              date={formatArDate(a.requested_date)}
              dotColor="bg-amber-500"
            />
          ))}
        </Section>

        <Section title="آخر الخدمات" icon={Wrench} link="/admin/services" color="text-emerald-600">
          {recent.length === 0 && <Empty msg="لا توجد خدمات بعد" />}
          {recent.map((s) => (
            <Row
              key={s.id}
              title={s.profile?.full_name || "عميل"}
              subtitle={s.profile?.phone || "—"}
              meta={s.oil_type || "زيت"}
              date={formatArDate(s.service_date)}
              dotColor="bg-emerald-500"
            />
          ))}
        </Section>

        <Section title="تذكيرات قادمة" icon={Bell} link="/admin/reminders" color="text-primary">
          {upcoming.length === 0 && <Empty msg="لا توجد تذكيرات قادمة" />}
          {upcoming.map((r) => (
            <Row
              key={r.id}
              title={r.profile?.full_name || "عميل"}
              subtitle={r.profile?.phone || "—"}
              meta="تغيير زيت"
              date={formatArDate(r.due_date)}
              dotColor="bg-primary"
            />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, link, color, children }: {
  title: string; icon: React.ComponentType<{ className?: string }>; link: string; color: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 font-bold">
          <Icon className={`size-4 ${color}`} /> {title}
        </div>
        <Link to={link} className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-bold">
          الكل <ArrowLeft className="size-3" />
        </Link>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </motion.div>
  );
}

function Row({ title, subtitle, meta, date, dotColor }: { title: string; subtitle: string; meta: string; date: string; dotColor: string }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className={`shrink-0 size-2 rounded-full ${dotColor}`} />
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{title}</div>
          <div className="text-[11px] text-muted-foreground truncate" dir="ltr">{subtitle}</div>
        </div>
      </div>
      <div className="text-left shrink-0">
        <div className="text-[11px] font-semibold text-foreground/70">{meta}</div>
        <div className="text-[11px] text-muted-foreground">{date}</div>
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="px-5 py-10 text-center text-xs text-muted-foreground">{msg}</div>;
}
