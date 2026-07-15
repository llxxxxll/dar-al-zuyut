import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { media } from "@/lib/media";
import { useAppSettings } from "@/hooks/useAppSettings";

const logo = media.logo;

export function Footer() {
  const s = useAppSettings();
  return (
    <footer className="relative bg-dark-gradient text-white/90 mt-24 overflow-hidden">
      <div className="absolute inset-0 opacity-30 [background:var(--gradient-radial-gold)]" />
      <div className="container mx-auto px-4 md:px-8 py-16 relative">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="دار الزيوت" className="h-14 w-14 rounded-full ring-2 ring-primary/40" />
              <div>
                <div className="text-lg font-extrabold text-gold-gradient">دار الزيوت</div>
                <div className="text-xs text-white/60">جودة تثق بها سيارتك</div>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              متخصصون في زيوت السيارات والشاحنات والدراجات، الفلاتر والمواد المضافة، وخدمة تذكير ذكية بموعد التغيير.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-white/70 hover:text-primary transition-colors">من نحن</Link></li>
              <li><Link to="/services" className="text-white/70 hover:text-primary transition-colors">الخدمات</Link></li>
              <li><Link to="/join" className="text-white/70 hover:text-primary transition-colors">انضم إلينا</Link></li>
              <li><Link to="/faq" className="text-white/70 hover:text-primary transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link to="/contact" className="text-white/70 hover:text-primary transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary mb-4">معلومات التواصل</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <a href={`tel:${s.business_phone}`} dir="ltr" className="text-white/80 hover:text-primary">{s.business_phone}</a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <a href={`mailto:${s.business_email}`} className="text-white/80 hover:text-primary text-xs break-all">{s.business_email}</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <a
                  href={s.business_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-primary leading-relaxed"
                >
                  {s.business_address}
                </a>
              </li>
              {(s.socials_facebook || s.socials_instagram || s.socials_tiktok) && (
                <li className="flex items-center gap-3 pt-2 text-xs font-bold">
                  {s.socials_facebook && <a href={s.socials_facebook} target="_blank" rel="noreferrer" className="text-white/70 hover:text-primary">Facebook</a>}
                  {s.socials_instagram && <a href={s.socials_instagram} target="_blank" rel="noreferrer" className="text-white/70 hover:text-primary">Instagram</a>}
                  {s.socials_tiktok && <a href={s.socials_tiktok} target="_blank" rel="noreferrer" className="text-white/70 hover:text-primary">TikTok</a>}
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary mb-4">ساعات العمل</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white/80">
                <Clock className="h-4 w-4 text-primary" />
                <span>السبت - الخميس</span>
              </li>
              <li className="text-white/70 pr-6" dir="ltr">8:00 ص - 8:00 م</li>
              <li className="flex items-center gap-2 text-white/80 pt-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>الجمعة</span>
              </li>
              <li className="text-white/70 pr-6">مغلق</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div>© {new Date().getFullYear()} دار الزيوت — جميع الحقوق محفوظة.</div>
          <div>الزاوية، ليبيا 🇱🇾</div>
        </div>
      </div>
    </footer>
  );
}