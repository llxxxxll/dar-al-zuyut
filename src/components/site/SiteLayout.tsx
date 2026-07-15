import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileCta } from "./MobileCta";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <MobileCta />
    </div>
  );
}