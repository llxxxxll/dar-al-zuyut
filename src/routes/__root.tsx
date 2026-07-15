import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/registerSW";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gold-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-gold-gradient px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:scale-105 shadow-elegant"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "دار الزيوت | زيوت السيارات والفلاتر والمواد المضافة" },
      { name: "description", content: "دار الزيوت - متخصصون في زيوت السيارات والشاحنات والدراجات، الفلاتر، المواد المضافة، وخدمة تغيير الزيوت في الزاوية، ليبيا." },
      { name: "author", content: "دار الزيوت" },
      { property: "og:title", content: "دار الزيوت | جودة تثق بها سيارتك" },
      { property: "og:description", content: "زيوت أصلية، فلاتر، مواد مضافة، وخدمة تذكير ذكية بموعد تغيير الزيت." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_LY" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0A0A0C" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "دار الزيوت" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => { registerServiceWorker(); }, []);
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
