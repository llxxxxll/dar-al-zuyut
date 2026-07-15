import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Wrench, Bell, Settings, MessageSquare,
  Calendar, Tag, Star, ShieldCheck, LogOut, ArrowLeft, ClipboardList,
  ScanLine, BarChart3, Megaphone, Zap,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const MAIN = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
  { to: "/admin/quick-service", label: "تسجيل خدمة سريع", icon: Zap },
  { to: "/admin/appointments", label: "المواعيد", icon: Calendar },
  { to: "/admin/customers", label: "العملاء", icon: Users },
  { to: "/admin/scan-card", label: "مسح بطاقة", icon: ScanLine },
  { to: "/admin/services", label: "كتالوج الخدمات", icon: Wrench },
  { to: "/admin/service-records", label: "سجل الخدمات", icon: ClipboardList },
  { to: "/admin/reminders", label: "التذكيرات", icon: Bell },
];

const CONTENT = [
  { to: "/admin/promotions", label: "العروض والإعلانات", icon: Tag },
  { to: "/admin/broadcasts", label: "النشرات والإشعارات", icon: Megaphone },
  { to: "/admin/reviews", label: "التقييمات", icon: Star },
  { to: "/admin/templates", label: "قوالب الرسائل", icon: MessageSquare },
];

const SYSTEM = [
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const Section = ({ label, items }: { label: string; items: typeof MAIN }) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-bold px-3">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  className={`group h-11 rounded-xl transition-all ${
                    active
                      ? "bg-gradient-to-l from-primary/25 to-primary/5 text-primary font-bold border border-primary/20 shadow-elegant"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Link to={item.to}>
                    <item.icon className={`size-4 ${active ? "text-primary" : ""}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className="border-l border-white/5 [&>div[data-sidebar=sidebar]]:bg-onyx [&>div[data-sidebar=sidebar]]:text-white"
    >
      <SidebarHeader className="border-b border-white/5 p-4">
        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="size-10 rounded-xl bg-gold-gradient grid place-items-center shadow-elegant shrink-0">
            <ShieldCheck className="size-5 text-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">دار الزيوت</div>
            <div className="font-extrabold text-white leading-tight">لوحة الإدارة</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <Section label="الإدارة" items={MAIN} />
        <Section label="المحتوى" items={CONTENT} />
        <Section label="النظام" items={SYSTEM} />
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-3 space-y-1.5">
        <Link
          to="/"
          className="flex items-center gap-3 h-11 px-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white text-sm transition-all"
        >
          <ArrowLeft className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">العودة للموقع</span>
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 h-11 px-3 w-full rounded-xl text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-300 text-sm transition-all"
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">خروج</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
