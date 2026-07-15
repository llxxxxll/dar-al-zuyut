import { Phone, MapPin, Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function MobileCta() {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.15)]">
      <div className="grid grid-cols-3 gap-1 p-2">
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
