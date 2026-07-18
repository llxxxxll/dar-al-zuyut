import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileCta } from "./MobileCta";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-hidden bg-background">
      <Header />
      <main className="flex-1 max-w-full overflow-x-hidden pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
      <Footer />
      <MobileCta />
    </div>
  );
}
