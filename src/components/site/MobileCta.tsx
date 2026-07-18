import { Phone, MapPin, Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function MobileCta() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.15)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid w-full max-w-screen-sm grid-cols-3 gap-1 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <a
          href="tel:0927527000"
          className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-gold-gradient text-primary-foreground font-bold text-xs shadow-elegant"
        >
          <Phone className="h-5 w-5" />
          اتصل
        </a>
        <a
          href="https://maps.app.goo.gl/huKzaRsULr8ARJ92A"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-card border border-border font-bold text-xs text-foreground"
        >
          <MapPin className="h-5 w-5 text-primary" />
          الخريطة
        </a>
        <Link
          to="/join"
          className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-card border border-primary/40 font-bold text-xs text-primary"
        >
          <Bell className="h-5 w-5" />
          تذكير
        </Link>
      </div>
    </div>
  );
}
