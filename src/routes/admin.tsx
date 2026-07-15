import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NotificationBell } from "@/components/site/NotificationBell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "لوحة الإدارة | دار الزيوت" }, { name: "robots", content: "noindex" }] }),
  // Server- and client-side guard: runs BEFORE the component renders or any
  // child loader/data-fetch executes. Prevents flash of admin shell and stops
  // any nested data fetches from firing for non-admins.
  beforeLoad: async ({ location }) => {
    // Only run the check in the browser — SSR has no auth session here.
    if (typeof window === "undefined") return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw redirect({ to: "/join", search: { redirect: location.href } as never });
    }

    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (error || !roles?.some((r) => r.role === "admin" || r.role === "staff")) {
      throw redirect({ to: "/account" });
    }
  },
});

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "نظرة عامة", subtitle: "ملخّص نشاط دار الزيوت اليوم" },
  "/admin/appointments": { title: "إدارة المواعيد", subtitle: "كل طلبات الحجز ومتابعة الحالة" },
  "/admin/customers": { title: "العملاء", subtitle: "بيانات وملفات العملاء" },
  "/admin/services": { title: "سجل الخدمات", subtitle: "كل عمليات تغيير الزيت والصيانة" },
  "/admin/reminders": { title: "التذكيرات", subtitle: "إدارة وإرسال التذكيرات" },
  "/admin/promotions": { title: "العروض والإعلانات", subtitle: "إدارة العروض الترويجية" },
  "/admin/reviews": { title: "التقييمات", subtitle: "تقييمات العملاء وآراؤهم" },
  "/admin/templates": { title: "قوالب الرسائل", subtitle: "إدارة نصوص الرسائل التلقائية" },
  "/admin/settings": { title: "الإعدادات", subtitle: "إعدادات النظام العامة" },
};

function AdminLayout() {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  // Client-side fallback guard: if SSR slipped past beforeLoad without a
  // session, redirect once auth has resolved.
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/join", search: { mode: "login" } as never }); return; }
    if (!isStaff) { navigate({ to: "/account" }); }
  }, [loading, user, isStaff, navigate]);

  if (loading || !user || !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find best matching page title
  const currentPath = location.pathname;
  let pageMeta = PAGE_TITLES[currentPath];
  if (!pageMeta) {
    const match = Object.keys(PAGE_TITLES)
      .filter((k) => k !== "/admin" && currentPath.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    pageMeta = match ? PAGE_TITLES[match] : { title: "لوحة التحكم", subtitle: "" };
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-[oklch(0.965_0.012_78)]" dir="rtl">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 md:px-8 h-16">
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger className="rounded-lg hover:bg-muted" />
                <div className="hidden md:block min-w-0">
                  <div className="text-xs text-muted-foreground leading-none">{pageMeta.subtitle}</div>
                  <h1 className="font-extrabold text-lg leading-tight truncate">{pageMeta.title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <form
                  onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate({ to: "/admin/customers", search: { q: q.trim() } as never }); }}
                  className="hidden lg:flex items-center gap-2 px-3 h-10 rounded-xl bg-muted/60 border border-border w-72 focus-within:border-primary transition"
                >
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="بحث عن عميل، هاتف، لوحة..."
                    className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
                  />
                  <kbd className="text-[10px] text-muted-foreground bg-card border border-border rounded px-1.5 py-0.5">↵</kbd>
                </form>
                <NotificationBell />
                <div className="size-10 rounded-full bg-gradient-to-br from-onyx to-onyx-soft ring-2 ring-primary/40 grid place-items-center text-primary font-extrabold text-sm">
                  {user.email?.[0]?.toUpperCase() ?? "A"}
                </div>
              </div>
            </div>
            <div className="md:hidden px-4 pb-3">
              <div className="text-xs text-muted-foreground">{pageMeta.subtitle}</div>
              <h1 className="font-extrabold text-lg">{pageMeta.title}</h1>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
