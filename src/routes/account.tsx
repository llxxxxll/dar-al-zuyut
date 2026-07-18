import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, User, Phone, Save, CheckCircle2, AlertCircle, LogOut,
  Bell, Calendar, Car as CarIcon, Plus, Trash2, Wrench, Sparkles, Droplet,
  LayoutDashboard, Star,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CarMakeModelSelect } from "@/components/shared/CarMakeModelSelect";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { computeDueDate, formatArDate, OIL_REMINDER_DAYS } from "@/lib/reminder";
import { useReminderSettings } from "@/hooks/useAppSettings";
import { AppointmentBooking } from "@/components/account/AppointmentBooking";
import { ReviewForm } from "@/components/account/ReviewForm";
import { CountdownRing } from "@/components/account/CountdownRing";
import { ServiceTimeline } from "@/components/account/ServiceTimeline";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";

export const Route = createFileRoute("/account")({
  component: Account,
  head: () => ({ meta: [{ title: "حسابي | دار الزيوت" }] }),
});

interface Profile { full_name: string; phone: string; created_at: string; phone_verified: boolean; }
interface Car {
  id: string; make: string; model: string | null; year: number | null;
  plate_number: string | null; preferred_oil: string | null;
  odometer_value: number | null; odometer_unit: string;
  last_service_odometer: number | null; next_service_odometer: number | null;
  last_service_date: string | null;
}
interface LoyaltyCard { id: string; card_code: string; discount_percent: number; status: string; expires_at: string | null; }
interface ServiceRow { id: string; service_date: string; oil_type: string | null; filter_changed: boolean | null; staff_name: string | null; }
interface AccountPromo { id: string; title: string; description: string | null; image_url: string | null; discount_percent: number | null; price: number | null; badge: string | null; cta_label: string | null; cta_link: string | null; ends_at: string | null; }
interface AccountNotification {
  id: string;
  title: string;
  body: string | null;
  link_to: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

type Tab = "overview" | "cars" | "services" | "appointments" | "reviews" | "notifications" | "profile";

function Account() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isStaff } = useAuth();
  const { oilReminderDays } = useReminderSettings();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [nextReminder, setNextReminder] = useState<{ due_date: string } | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [showCarForm, setShowCarForm] = useState(false);
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([]);
  const [promos, setPromos] = useState<AccountPromo[]>([]);
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setNotificationsLoading(false);
      return;
    }

    setNotificationsLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,link_to,is_read,read_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications((data ?? []) as AccountNotification[]);
    setNotificationsLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/join", search: { mode: "login" } as never });
  }, [authLoading, user, navigate]);

  // Admins/staff don't have a customer dashboard — redirect them to the admin panel
  useEffect(() => {
    if (!authLoading && user && isStaff) navigate({ to: "/admin" });
  }, [authLoading, user, isStaff, navigate]);

  const refresh = async () => {
    if (!user) return;
    const [{ data: p }, { data: c }, { data: s }, { data: r }, { data: lc }, { data: pr }] = await Promise.all([
      supabase.from("profiles").select("full_name,phone,created_at,phone_verified").eq("id", user.id).single(),
      supabase.from("cars").select("id,make,model,year,plate_number,preferred_oil,odometer_value,odometer_unit,last_service_odometer,next_service_odometer,last_service_date").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("service_records").select("id,service_date,oil_type,filter_changed,staff_name").eq("user_id", user.id).order("service_date", { ascending: false }).limit(20),
      supabase.from("reminders").select("due_date").eq("user_id", user.id).in("status", ["pending", "due"]).order("due_date", { ascending: true }).limit(1).maybeSingle(),
      supabase.from("loyalty_cards").select("id,card_code,discount_percent,status,expires_at").eq("user_id", user.id).eq("status", "active"),
      supabase.from("promotions").select("id,title,description,image_url,discount_percent,price,badge,cta_label,cta_link,ends_at").eq("is_active", true).order("sort_order").limit(6),
    ]);
    if (p) setProfile({ full_name: p.full_name ?? "", phone: p.phone ?? "", created_at: p.created_at, phone_verified: !!p.phone_verified });
    setCars((c ?? []) as Car[]);
    setServices((s ?? []) as ServiceRow[]);
    setNextReminder(r);
    setLoyaltyCards((lc ?? []) as LoyaltyCard[]);
    setPromos((pr ?? []) as AccountPromo[]);
  };
  useEffect(() => {
    refresh();
    loadNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`account-notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => loadNotifications(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const flash = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const unreadNotificationsCount = notifications.filter((item) => !item.is_read).length;

  const markNotificationsAsRead = async (ids?: string[]) => {
    if (!user) return;

    const unreadIds = (ids ?? notifications.filter((item) => !item.is_read).map((item) => item.id)).filter(Boolean);
    if (unreadIds.length === 0) return;

    const readAt = new Date().toISOString();
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .in("id", unreadIds)
      .eq("user_id", user.id);

    setNotifications((current) => current.map((item) => (
      unreadIds.includes(item.id) ? { ...item, is_read: true, read_at: item.read_at ?? readAt } : item
    )));
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ full_name: profile.full_name })
      .eq("id", user.id);
    setSaving(false);
    if (error) flash("err", "تعذر الحفظ");
    else flash("ok", "تم حفظ التعديلات");
  };

  // Effective due date:
  // 1) Use stored reminder if exists
  // 2) Else use last service + interval
  // 3) Otherwise NULL — لا نعرض موعد متوقّع قبل أوّل خدمة فعلية
  const effectiveDueDate = useMemo<string | null>(() => {
    if (nextReminder?.due_date) return nextReminder.due_date;
    if (services[0]?.service_date && profile) {
      return computeDueDate(services[0].service_date, oilReminderDays).toISOString();
    }
    return null;
  }, [nextReminder, services, profile, oilReminderDays]);

  const hasService = services.length > 0;
  const isVirtual = !nextReminder?.due_date && hasService;

  const daysLeft = useMemo(() => {
    if (!effectiveDueDate) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(effectiveDueDate);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  }, [effectiveDueDate]);

  useEffect(() => {
    if (tab === "notifications" && unreadNotificationsCount > 0) {
      void markNotificationsAsRead();
    }
  }, [tab, unreadNotificationsCount]);

  if (authLoading || !profile) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  const tabs: { v: Tab; l: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { v: "overview", l: "نظرة عامة", icon: LayoutDashboard },
    { v: "appointments", l: "مواعيدي", icon: Calendar },
    { v: "cars", l: "سياراتي", icon: CarIcon },
    { v: "services", l: "سجل الخدمات", icon: Wrench },
    { v: "reviews", l: "تقييماتي", icon: Star },
    { v: "notifications", l: "الإشعارات", icon: Bell },
    { v: "profile", l: "الإعدادات", icon: User },
  ];

  return (
    <SiteLayout>
      {/* Personal hero */}
      <section className="relative overflow-x-hidden overflow-y-visible pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-10 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="container mx-auto max-w-5xl min-w-0 px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-4 md:flex md:flex-wrap md:items-center md:gap-5"
          >
            <div className="size-16 rounded-2xl bg-gold-gradient grid place-items-center text-primary-foreground text-2xl font-extrabold shadow-elegant">
              {(profile.full_name?.trim()?.[0] ?? "؟")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground">حسابي</div>
              <h1 className="text-3xl md:text-4xl font-extrabold mt-0.5 truncate">أهلاً، {profile.full_name || "بك"}</h1>
              <div className="mt-1 truncate text-sm text-muted-foreground" dir="ltr">{profile.phone}</div>
            </div>
            <button
              onClick={() => signOut()}
              className="col-span-2 md:col-span-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-destructive/30 px-4 font-semibold text-destructive transition hover:bg-destructive/5 md:ms-auto md:w-auto"
            >
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-elegant text-sm font-medium ${toast.kind === "ok" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
            <div className="inline-flex items-center gap-2">
              {toast.kind === "ok" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="overflow-x-hidden pb-[calc(120px+env(safe-area-inset-bottom))]">
        <div className="container mx-auto max-w-5xl min-w-0 overflow-x-hidden px-4 md:px-8">
          {/* Tabs */}
          <div className="mb-6 -mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-1.5 rounded-2xl border border-border bg-secondary/60 p-1.5 md:w-auto">
              {tabs.map((t) => (
                <button
                  key={t.v}
                  onClick={() => setTab(t.v)}
                  className={`inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    tab === t.v ? "bg-card shadow-card text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4" /> {t.l}
                  {t.v === "notifications" && unreadNotificationsCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                      {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 space-y-6 overflow-x-hidden"
            >
              {tab === "overview" && (
                <>
                  {hasService && effectiveDueDate ? (
                    <CountdownRing
                      daysLeft={daysLeft}
                      dueDate={effectiveDueDate}
                      totalDays={oilReminderDays || OIL_REMINDER_DAYS}
                      isEstimate={isVirtual}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="min-w-0 overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-gradient-to-br from-secondary/40 to-card p-6 text-center shadow-card md:p-8"
                    >
                      <div className="size-14 mx-auto rounded-2xl bg-secondary grid place-items-center mb-4">
                        <Wrench className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg md:text-xl font-extrabold">لم يتم تسجيل أوّل تغيير زيت لهذه السيارة بعد.</h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
                        بعد زيارتك للمحل وتسجيل الخدمة، سيظهر لك موعد التغيير القادم والعدّاد القادم تلقائيًا.
                      </p>
                      <button
                        onClick={() => setTab("appointments")}
                        className="mt-5 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all"
                      >
                        <Calendar className="h-4 w-4" /> حجز موعد تغيير زيت
                      </button>
                    </motion.div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Stat icon={Calendar} label="آخر تغيير زيت" value={services[0] ? formatArDate(services[0].service_date) : "لم يُسجَّل بعد"} />
                    <Stat icon={CarIcon} label="عدد سياراتك" value={String(cars.length)} />
                  </div>

                  <Panel title="إجراءات سريعة" icon={Sparkles}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <QuickAction icon={Calendar} label="احجز موعد" desc="حدّد تاريخ مناسب لك" onClick={() => setTab("appointments")} />
                      <QuickAction icon={Plus} label="أضف سيارة" desc="لمتابعة أفضل" onClick={() => { setTab("cars"); setShowCarForm(true); }} />
                      <QuickAction icon={Star} label="قيّم خدمة" desc="شاركنا رأيك" onClick={() => setTab("reviews")} />
                    </div>
                  </Panel>

                  <Panel title="آخر الخدمات" icon={Wrench} action={
                    <button onClick={() => setTab("services")} className="text-xs font-bold text-primary hover:underline">عرض الكل ←</button>
                  }>
                    <ServiceTimeline services={services.slice(0, 3)} />
                  </Panel>

                  {cars.length > 0 && (
                    <Panel title="عدّاد سياراتك" icon={CarIcon}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {cars.map((c) => <OdometerCard key={c.id} car={c} onUpdate={refresh} flash={flash} />)}
                      </div>
                    </Panel>
                  )}

                  {loyaltyCards.length > 0 && (
                    <Panel title="بطاقات الولاء" icon={Star}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {loyaltyCards.map((card) => (
                          <div key={card.id} className="rounded-2xl bg-gradient-to-br from-onyx to-onyx-soft p-5 text-white border border-primary/30">
                            <div className="text-xs text-primary/90 mb-1">بطاقة الولاء</div>
                            <div className="font-extrabold text-xl tracking-wider" dir="ltr">{card.card_code}</div>
                            <div className="mt-3 flex items-center justify-between text-xs">
                              <span>خصم: <b className="text-primary">{card.discount_percent}%</b></span>
                              {card.expires_at && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary">حتى {new Date(card.expires_at).toLocaleDateString("ar-LY")}</span>}
                            </div>
                            <div className="text-[10px] text-white/50 mt-2">اعرض هذا الكود لموظف المحل لتجميع النقاط.</div>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  )}

                  {promos.length > 0 && (
                    <Panel title="عروض وخصومات لك" icon={Sparkles}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {promos.map((pr) => (
                          <a
                            key={pr.id}
                            href={pr.cta_link || "#"}
                            onClick={(e) => { if (!pr.cta_link) e.preventDefault(); }}
                            className="group rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elegant transition block"
                          >
                            {pr.image_url && (
                              <div className="h-32 bg-muted overflow-hidden">
                                <img src={pr.image_url} alt={pr.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {pr.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{pr.badge}</span>}
                                {pr.discount_percent != null && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">خصم {pr.discount_percent}%</span>}
                              </div>
                              <div className="font-extrabold">{pr.title}</div>
                              {pr.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{pr.description}</div>}
                              <div className="flex items-center justify-between mt-2">
                                {pr.price != null ? (
                                  <div className="text-primary"><span className="text-lg font-extrabold">{pr.price}</span> <span className="text-[10px] font-bold opacity-70">د.ل</span></div>
                                ) : <span />}
                                {pr.ends_at && <span className="text-[10px] text-muted-foreground">حتى {new Date(pr.ends_at).toLocaleDateString("ar-LY")}</span>}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </Panel>
                  )}
                </>
              )}

              {tab === "appointments" && (
                <Panel title="مواعيدي" icon={Calendar}>
                  <AppointmentBooking userId={user!.id} cars={cars} />
                </Panel>
              )}

              {tab === "reviews" && (
                <Panel title="تقييم خدماتك" icon={Star}>
                  <ReviewForm userId={user!.id} />
                </Panel>
              )}

              {tab === "cars" && (
                <Panel
                  title="سياراتي"
                  icon={CarIcon}
                  action={
                    <button onClick={() => setShowCarForm((v) => !v)} className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-card hover:bg-muted/50 text-sm font-semibold">
                      <Plus className="h-4 w-4" /> {showCarForm ? "إلغاء" : "إضافة سيارة"}
                    </button>
                  }
                >
                  <AnimatePresence>
                    {showCarForm && user && (
                      <CarForm userId={user.id} onDone={() => { setShowCarForm(false); refresh(); flash("ok", "تمت إضافة السيارة"); }} />
                    )}
                  </AnimatePresence>

                  {cars.length === 0 && !showCarForm ? (
                    <div className="py-10 text-center">
                      <CarIcon className="size-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">لا توجد سيارات مسجّلة بعد. أضف سيارتك الآن لتسهيل المتابعة.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                      {cars.map((c) => (
                        <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className="group flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-border bg-secondary/40 p-4 transition hover:border-primary/30">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="size-11 rounded-xl bg-gold-gradient grid place-items-center shrink-0">
                              <CarIcon className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold truncate">{c.make} {c.model ?? ""}{c.year ? ` · ${c.year}` : ""}</div>
                              {c.plate_number && <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{c.plate_number}</div>}
                              {c.preferred_oil && <div className="text-xs text-muted-foreground mt-0.5">زيت مفضّل: {c.preferred_oil}</div>}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (!confirm("حذف هذه السيارة من حسابك؟")) return;
                              await supabase.from("cars").delete().eq("id", c.id);
                              refresh(); flash("ok", "تم حذف السيارة");
                            }}
                            className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition"
                            aria-label="حذف"
                          ><Trash2 className="h-4 w-4" /></button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Panel>
              )}

              {tab === "services" && (
                <Panel title="سجل خدماتي" icon={Wrench}>
                  <ServiceTimeline services={services} />
                </Panel>
              )}

              {tab === "notifications" && (
                <Panel
                  title="الإشعارات"
                  icon={Bell}
                  action={(
                    <div className="inline-flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-secondary px-3 py-1 font-bold text-muted-foreground">
                        غير المقروء: {unreadNotificationsCount}
                      </span>
                    </div>
                  )}
                >
                  {notificationsLoading ? (
                    <div className="grid place-items-center py-16">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell className="mx-auto mb-3 size-12 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">لا توجد إشعارات بعد</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`rounded-2xl border p-4 transition ${
                            notification.is_read
                              ? "border-border bg-secondary/20"
                              : "border-primary/20 bg-primary/5"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold">{notification.title}</h3>
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  notification.is_read
                                    ? "bg-secondary text-muted-foreground"
                                    : "bg-primary/10 text-primary"
                                }`}>
                                  {notification.is_read ? "مقروء" : "غير مقروء"}
                                </span>
                              </div>
                              {notification.body && (
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                  {notification.body}
                                </p>
                              )}
                            </div>
                            {!notification.is_read && (
                              <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              أُرسلت: {new Date(notification.created_at).toLocaleString("ar-LY", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                            {notification.read_at && (
                              <span>
                                قُرئت: {new Date(notification.read_at).toLocaleString("ar-LY", { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            )}
                          </div>

                          {notification.link_to && (
                            <div className="mt-3">
                              <a
                                href={notification.link_to}
                                onClick={() => {
                                  if (!notification.is_read) {
                                    void markNotificationsAsRead([notification.id]);
                                  }
                                }}
                                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                              >
                                فتح الرابط
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              )}

              {tab === "profile" && (
                <Panel title="بياناتي" icon={Sparkles}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FieldWrap label="الاسم الكامل" icon={User}>
                      <input
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className={inputCls}
                      />
                    </FieldWrap>
                    <FieldWrap label="رقم الهاتف" icon={Phone}>
                      <input value={profile.phone} disabled dir="ltr" className={`${inputCls} bg-muted text-muted-foreground`} />
                    </FieldWrap>
                    <div className="sm:col-span-2 text-xs text-muted-foreground leading-relaxed p-3 rounded-xl bg-secondary/40 border border-border">
                      نظام التذكير يعتمد على آخر خدمة مسجلة + <b>{oilReminderDays || OIL_REMINDER_DAYS} يوم</b>.
                      حدّث قراءة عدّاد سيارتك من تبويب «نظرة عامة» لتحصل على تذكير أدق.
                    </div>
                  </div>
                  <div className="flex justify-end mt-5">
                    <button onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant hover:scale-[1.02] transition disabled:opacity-60">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ التعديلات
                    </button>
                  </div>
                </Panel>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="text-center pt-8">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← العودة للرئيسية</Link>
          </div>
        </div>
      </section>
      <InstallAppPrompt />
    </SiteLayout>
  );
}

const inputCls = "w-full h-12 rounded-xl bg-secondary/40 border border-border focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 transition px-4 text-sm";

function FieldWrap({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-bold text-muted-foreground mb-1.5 inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {label}</div>
      {children}
    </label>
  );
}

function Panel({ title, icon: Icon, action, children }: { title: string; icon: React.ComponentType<{ className?: string }>; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="min-w-0 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5 md:p-7">
      <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="inline-flex min-w-0 items-center gap-2 text-lg font-extrabold"><Icon className="h-4 w-4 shrink-0 text-primary" /> <span className="truncate">{title}</span></div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="size-9 rounded-xl bg-secondary grid place-items-center"><Icon className="h-4 w-4 text-primary" /></div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      <div className="truncate text-base font-extrabold">{value}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-right transition-all hover:border-primary/30 hover:bg-secondary/60"
    >
      <div className="size-12 rounded-xl bg-gold-gradient grid place-items-center shadow-elegant group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-bold">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}

function CarForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [form, setForm] = useState({ make: "", model: "", year: "", plate_number: "", preferred_oil: "", odometer: "" });
  const [saving, setSaving] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden">
      <div className="space-y-3 p-4 rounded-2xl bg-secondary/40 border border-border mb-4">
        <CarMakeModelSelect value={{ make: form.make, model: form.model }} onChange={(v) => setForm({ ...form, make: v.make, model: v.model })} />
        <div className="grid sm:grid-cols-3 gap-3">
          <input className={inputCls} placeholder="السنة" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          <input className={inputCls} placeholder="رقم اللوحة (اختياري)" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} />
          <input className={inputCls} placeholder="العدّاد الحالي (كم)" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
        </div>
        <input className={inputCls} placeholder="الزيت المفضّل (اختياري)" value={form.preferred_oil} onChange={(e) => setForm({ ...form, preferred_oil: e.target.value })} />
        <div className="flex justify-end">
          <button
            disabled={saving || !form.make.trim()}
            onClick={async () => {
              setSaving(true);
              await supabase.from("cars").insert({
                user_id: userId,
                make: form.make.trim(),
                model: form.model.trim() || null,
                year: form.year ? Number(form.year) : null,
                plate_number: form.plate_number.trim() || null,
                preferred_oil: form.preferred_oil.trim() || null,
                odometer_value: form.odometer ? Number(form.odometer) : null,
              });
              setSaving(false); onDone();
            }}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-gold-gradient text-primary-foreground font-bold shadow-elegant disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ السيارة
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function OdometerCard({ car, onUpdate, flash }: { car: Car; onUpdate: () => void; flash: (k: "ok" | "err", m: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(car.odometer_value?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const daysSinceLast = car.last_service_date
    ? Math.floor((Date.now() - new Date(car.last_service_date).getTime()) / 86400000)
    : null;
  const overdue = daysSinceLast !== null && daysSinceLast >= 21;
  const overdueKm = car.next_service_odometer !== null && car.odometer_value !== null && car.odometer_value >= car.next_service_odometer;
  const remainingKm = car.next_service_odometer !== null && car.odometer_value !== null ? car.next_service_odometer - car.odometer_value : null;

  const save = async () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return flash("err", "قيمة غير صالحة");
    if (car.last_service_odometer !== null && n < car.last_service_odometer) {
      return flash("err", "العدّاد لا يمكن أن يقل عن آخر قراءة");
    }
    if (car.last_service_odometer === null && car.odometer_value !== null && n < car.odometer_value) {
      return flash("err", "القراءة الجديدة لا يمكن أن تقل عن القراءة الحالية المحفوظة");
    }
    setSaving(true);
    const { error } = await supabase.from("cars").update({ odometer_value: n }).eq("id", car.id);
    setSaving(false);
    if (error) { flash("err", "تعذر التحديث"); return; }
    if (car.next_service_odometer !== null && n >= car.next_service_odometer) {
      flash("ok", "تم التحديث. لقد تجاوزت موعد تغيير الزيت — يُنصح بحجز موعد الآن.");
    } else {
      flash("ok", "تم تحديث القراءة الحالية");
    }
    setEditing(false);
    onUpdate();
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-secondary/30 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 font-bold truncate">{car.make} {car.model ?? ""}</div>
        {overdueKm ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">⚠ متجاوز موعد التغيير</span>
        ) : overdue ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">⚠ مرّ {daysSinceLast} يوم</span>
        ) : remainingKm !== null ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">متبقي {remainingKm.toLocaleString("ar-LY")} كم</span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        <div className="min-w-0"><div className="text-muted-foreground">قراءة العدّاد الحالية</div><div className="font-bold">{car.odometer_value?.toLocaleString("ar-LY") ?? "—"}</div></div>
        <div className="min-w-0"><div className="text-muted-foreground">عدّاد آخر خدمة</div><div className="font-bold">{car.last_service_odometer?.toLocaleString("ar-LY") ?? "—"}</div></div>
        <div className="min-w-0"><div className="text-muted-foreground">العدّاد القادم</div><div className="font-bold text-primary">{car.next_service_odometer?.toLocaleString("ar-LY") ?? "—"}</div></div>
      </div>
      {editing ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] p-2 leading-relaxed">
            هذه القراءة للمتابعة فقط ولا تعني تسجيل تغيير زيت. تسجيل تغيير الزيت يتم من الموظف عند الزيارة.
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="number" min={car.last_service_odometer ?? car.odometer_value ?? 0} value={value} onChange={(e) => setValue(e.target.value)} className={`${inputCls} h-10 w-full`} placeholder="القراءة الحالية" />
            <button disabled={saving} onClick={save} className="h-10 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50">{saving ? "..." : "حفظ"}</button>
            <button onClick={() => setEditing(false)} className="h-10 rounded-lg border border-border px-3 text-xs">إلغاء</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="mt-3 text-xs font-bold text-primary hover:underline">↻ تحديث القراءة الحالية فقط</button>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
        تحديث القراءة لا يُسجّل خدمة جديدة، بل يساعدك على متابعة المسافة المتبقية. تسجيل تغيير الزيت يتم من الموظف عند الزيارة.
      </p>
    </div>
  );
}
