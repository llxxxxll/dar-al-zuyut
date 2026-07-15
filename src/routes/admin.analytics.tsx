import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, Car as CarIcon, Wrench, Calendar, Download, Loader2, TrendingUp, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/analytics")({
  component: Analytics,
});

interface SR {
  id: string;
  user_id: string;
  service_date: string;
  oil_type: string | null;
  oil_brand: string | null;
  total_amount: number | null;
}
interface P { id: string; full_name: string | null; phone: string | null; created_at: string; }

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<P[]>([]);
  const [services, setServices] = useState<SR[]>([]);
  const [carsCount, setCarsCount] = useState(0);
  const [apptCounts, setApptCounts] = useState<Record<string, number>>({});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: customerRoles }, { data: p }, { data: s }, { count: cc }, { data: a }] = await Promise.all([
        supabase.from("user_roles").select("user_id").eq("role", "customer"),
        supabase.from("profiles").select("id,full_name,phone,created_at"),
        supabase.from("service_records").select("id,user_id,service_date,oil_type,oil_brand,total_amount"),
        supabase.from("cars").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("status"),
      ]);
      const customerIds = new Set((customerRoles ?? []).map((row) => row.user_id));
      setProfiles(((p as P[]) ?? []).filter((row) => customerIds.has(row.id)));
      setServices(((s as SR[]) ?? []).filter((row) => customerIds.has(row.user_id)));
      setCarsCount(cc ?? 0);
      const counts: Record<string, number> = {};
      ((a as { status: string }[]) ?? []).forEach((row) => { counts[row.status] = (counts[row.status] ?? 0) + 1; });
      setApptCounts(counts);
      setLoading(false);
    })();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (from && s.service_date < from) return false;
      if (to && s.service_date > to) return false;
      return true;
    });
  }, [services, from, to]);

  const last30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return {
      services: filteredServices.filter((s) => new Date(s.service_date).getTime() >= cutoff).length,
      customers: profiles.filter((p) => new Date(p.created_at).getTime() >= cutoff).length,
    };
  }, [filteredServices, profiles]);

  const profileMap = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);

  const topByVisits = useMemo(() => {
    const m: Record<string, { count: number; total: number }> = {};
    filteredServices.forEach((s) => {
      const cur = m[s.user_id] || { count: 0, total: 0 };
      cur.count++; cur.total += Number(s.total_amount || 0);
      m[s.user_id] = cur;
    });
    return Object.entries(m)
      .map(([uid, v]) => ({ uid, ...v, p: profileMap[uid] }))
      .filter((r) => r.p)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [filteredServices, profileMap]);

  const topByAmount = useMemo(() => [...topByVisits].sort((a, b) => b.total - a.total).slice(0, 20), [topByVisits]);

  const topOils = useMemo(() => {
    const m: Record<string, number> = {};
    filteredServices.forEach((s) => {
      const k = [s.oil_brand, s.oil_type].filter(Boolean).join(" ") || "غير محدد";
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filteredServices]);

  const exportCsv = (filename: string, rows: (string | number)[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="grid place-items-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold inline-flex items-center gap-2"><BarChart3 className="size-6 text-primary" /> التحليلات</h1>
        <p className="text-sm text-muted-foreground mt-1">نظرة شاملة على نشاط المحل، أفضل العملاء والزيوت.</p>
      </div>

      <div className="flex gap-2 items-end flex-wrap">
        <label className="block">
          <div className="text-xs font-semibold text-muted-foreground mb-1">من تاريخ</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-card text-sm" />
        </label>
        <label className="block">
          <div className="text-xs font-semibold text-muted-foreground mb-1">إلى تاريخ</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-card text-sm" />
        </label>
        {(from || to) && <button onClick={() => { setFrom(""); setTo(""); }} className="h-10 px-4 rounded-lg border border-border text-sm">إزالة الفلتر</button>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Users} label="عدد العملاء" value={profiles.length} />
        <KPI icon={CarIcon} label="عدد السيارات" value={carsCount} />
        <KPI icon={Wrench} label="عدد الخدمات" value={filteredServices.length} />
        <KPI icon={Calendar} label="إجمالي المواعيد" value={Object.values(apptCounts).reduce((a, b) => a + b, 0)} />
        <KPI icon={TrendingUp} label="خدمات آخر 30 يوم" value={last30.services} />
        <KPI icon={Users} label="عملاء جدد آخر 30 يوم" value={last30.customers} />
        <KPI icon={Droplet} label="مواعيد مؤكدة" value={apptCounts["confirmed"] ?? 0} />
        <KPI icon={Calendar} label="مواعيد منتظرة" value={apptCounts["pending"] ?? 0} />
      </div>

      <Section
        title="أفضل 20 عميل (عدد الزيارات)"
        onExport={() => exportCsv("top-by-visits.csv", [
          ["الاسم", "الهاتف", "عدد الزيارات", "إجمالي د.ل"],
          ...topByVisits.map((r) => [r.p?.full_name ?? "", r.p?.phone ?? "", r.count, r.total.toFixed(2)]),
        ])}
      >
        <Table headers={["العميل", "الهاتف", "زيارات", "إجمالي"]}>
          {topByVisits.map((r) => (
            <tr key={r.uid} className="border-t border-border">
              <td className="p-3">{r.p?.full_name ?? "—"}</td>
              <td className="p-3 text-xs" dir="ltr">{r.p?.phone ?? "—"}</td>
              <td className="p-3 font-bold">{r.count}</td>
              <td className="p-3">{r.total.toFixed(2)} د.ل</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section
        title="أفضل 20 عميل (إجمالي المبلغ)"
        onExport={() => exportCsv("top-by-amount.csv", [
          ["الاسم", "الهاتف", "إجمالي د.ل", "زيارات"],
          ...topByAmount.map((r) => [r.p?.full_name ?? "", r.p?.phone ?? "", r.total.toFixed(2), r.count]),
        ])}
      >
        <Table headers={["العميل", "الهاتف", "إجمالي", "زيارات"]}>
          {topByAmount.map((r) => (
            <tr key={r.uid} className="border-t border-border">
              <td className="p-3">{r.p?.full_name ?? "—"}</td>
              <td className="p-3 text-xs" dir="ltr">{r.p?.phone ?? "—"}</td>
              <td className="p-3 font-bold">{r.total.toFixed(2)} د.ل</td>
              <td className="p-3">{r.count}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="أكثر الزيوت استخدامًا">
        <Table headers={["الزيت", "عدد المرات"]}>
          {topOils.map(([k, v]) => (
            <tr key={k} className="border-t border-border">
              <td className="p-3">{k}</td>
              <td className="p-3 font-bold">{v}</td>
            </tr>
          ))}
        </Table>
      </Section>
    </div>
  );
}

function KPI({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5"><Icon className="size-4 text-primary" /> {label}</div>
      <div className="text-2xl font-extrabold">{value.toLocaleString()}</div>
    </div>
  );
}

function Section({ title, children, onExport }: { title: string; children: React.ReactNode; onExport?: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-extrabold">{title}</h3>
        {onExport && (
          <button onClick={onExport} className="inline-flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg border border-border hover:bg-muted">
            <Download className="size-3.5" /> CSV
          </button>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-muted-foreground">{headers.map((h) => <th key={h} className="p-3 text-right font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
