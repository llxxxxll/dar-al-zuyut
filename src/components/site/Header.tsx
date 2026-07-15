import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { Menu, X, Phone, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { media } from "@/lib/media";

const logo = media.logo;
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  { to: "/", label: "الرئيسية" },
  { to: "/about", label: "من نحن" },
  { to: "/services", label: "الخدمات" },
  { to: "/join", label: "انضم إلينا" },
  { to: "/faq", label: "الأسئلة الشائعة" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isStaff, signOut } = useAuth();
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(255,253,247,0.85)"]);
  const blur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(14px)"]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <motion.header
      style={{ backgroundColor: bg as never, backdropFilter: blur as never }}
      className="sticky top-0 z-50 w-full"
    >
      <motion.div
        style={{ opacity: borderOpacity }}
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all" />
            <img src={logo} alt="دار الزيوت" className="relative h-12 w-12 rounded-full object-cover ring-2 ring-primary/30" />
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-extrabold leading-tight">دار الزيوت</div>
            <div className="text-[11px] text-muted-foreground leading-tight">زيوت • فلاتر • مواد مضافة</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-lg hover:bg-primary/10"
              activeProps={{ className: "text-primary font-bold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="tel:0927527000"
            className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-4 w-4" />
            0927527000
          </a>
          {user ? (
            <>
              <NotificationBell />
              {isStaff && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-card px-4 py-2 text-sm font-bold text-foreground hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  لوحة التحكم
                </Link>
              )}
              <Link
                to="/account"
                className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-105 transition-all"
              >
                <UserIcon className="h-4 w-4" />
                حسابي
              </Link>
              <button
                onClick={() => signOut()}
                aria-label="تسجيل خروج"
                className="p-2.5 rounded-full hover:bg-destructive/10 text-foreground/70 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/join"
                className="rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-105 transition-all"
              >
                سجّل الآن
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
          aria-label="القائمة"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-base font-medium rounded-lg hover:bg-primary/10 transition-colors"
                activeProps={{ className: "text-primary font-bold bg-primary/10" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                {isStaff && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-xl border-2 border-foreground/10 px-5 py-3 text-center text-base font-bold"
                  >
                    لوحة التحكم
                  </Link>
                )}
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-full bg-gold-gradient px-5 py-3 text-center text-base font-bold text-primary-foreground shadow-elegant"
                >
                  حسابي
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="mt-2 rounded-xl border border-destructive/30 text-destructive px-5 py-3 text-base font-bold"
                >
                  تسجيل خروج
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/join"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-full bg-gold-gradient px-5 py-3 text-center text-base font-bold text-primary-foreground shadow-elegant"
                >
                  سجّل الآن
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}