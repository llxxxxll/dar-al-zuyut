import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal-9f3k-secure")({
  head: () => ({
    meta: [
      { title: "بوابة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isStaff, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && isStaff) {
      navigate({ to: "/admin" });
    }
  }, [user, isStaff, authLoading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    if (error) {
      setLoading(false);
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }

    // Verify staff/admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id);

    const isAuthorized = roles?.some((r) => r.role === "admin" || r.role === "staff");
    if (!isAuthorized) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("غير مصرح لك بالدخول إلى هذه البوابة");
      return;
    }

    toast.success("مرحبًا بك في لوحة الإدارة");
    navigate({ to: "/admin" });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at top, hsl(var(--primary) / 0.08), hsl(var(--background)))" }}
      dir="rtl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="absolute -top-12 right-0 text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← العودة للموقع
        </Link>

        <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient text-primary-foreground shadow-elegant mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">بوابة الإدارة</h1>
            <p className="text-sm text-muted-foreground">للموظفين والإدارة فقط</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  dir="ltr"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-right"
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => setPassword(e.target.value.trim())}
                  required
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-6 py-3.5 text-base font-bold text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  دخول آمن
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            هذه البوابة محمية ومخصصة للموظفين المعتمدين فقط.
          </p>
        </div>
      </div>
    </div>
  );
}