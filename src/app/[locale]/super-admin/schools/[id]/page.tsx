"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api/client";

export default function SchoolDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("superAdmin.schools");
  const [school, setSchool] = useState<any>(null);
  const [revenueLog, setRevenueLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = () => {
    if (!params?.id) return;
    setLoading(true);
    Promise.all([
      api.get<any>(`admin/schools/${params.id}`),
      api.get<any>(`admin/schools/${params.id}/revenue`),
    ])
      .then(([sch, rev]) => {
        setSchool(sch);
        setRevenueLog(Array.isArray(rev) ? rev : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [params?.id]);

  const toggleActive = async () => {
    if (!params?.id) return;
    setToggling(true);
    try {
      await api.patch(`admin/schools/${params.id}/toggle-active`, {});
      fetchData();
    } catch {
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <p className="py-8 text-center text-sm text-muted">جاري التحميل...</p>;
  if (!school) return <p className="py-8 text-center text-sm text-muted">المدرسة غير موجودة</p>;

  const sub = school.platform_subscriptions?.[0];
  const plan = sub?.platform_subscription_plans;

  return (
    <div>
      <PageHeader
        title={school.name}
        actions={
          <Link
            href="/super-admin/schools"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-base font-bold tracking-tight">معلومات المدرسة</h3>
          </div>
          <div className="space-y-3 p-5 text-sm">
            <Info label="البريد" value={school.email || "-"} />
            <Info label="الهاتف" value={school.phone || "-"} />
            <Info label="العنوان" value={school.address || "-"} />
            <Info label="السعة القصوى" value={String(school.max_students || 0)} />
            <div>
              <div className="mb-1 text-muted">الحالة</div>
              <StatusBadge status={school.is_active ? "active" : "inactive"} label={school.is_active ? "نشط" : "معطل"} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-base font-bold tracking-tight">الاشتراك الحالي</h3>
          </div>
          <div className="space-y-3 p-5 text-sm">
            <Info label="الباقة" value={plan?.name || "-"} />
            <Info label="المبلغ" value={sub?.price_at_subscription ? `${Number(sub.price_at_subscription).toLocaleString()} د.ج` : "-"} />
            <Info label="الدورية" value={sub?.billing_cycle === "monthly" ? "شهري" : "سنوي"} />
            <Info label="الحالة" value={sub?.status || "-"} />
            <Info label="تاريخ البدء" value={sub?.start_date ? new Date(sub.start_date).toLocaleDateString("ar-DZ") : "-"} />
            <Info label="تاريخ الانتهاء" value={sub?.end_date ? new Date(sub.end_date).toLocaleDateString("ar-DZ") : "-"} />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-base font-bold tracking-tight">إجراءات</h3>
          </div>
          <div className="space-y-2 p-5">
            <button
              onClick={() => router.push(`/super-admin/schools/${params.id}/renew`)}
              className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              تجديد الاشتراك
            </button>
            <button
              onClick={() => router.push(`/super-admin/schools/${params.id}/edit`)}
              className="w-full rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg hover:border-primary hover:text-primary"
            >
              تعديل المعلومات
            </button>
            <button
              onClick={toggleActive}
              disabled={toggling}
              className="w-full rounded-lg border border-danger/30 bg-[var(--icon-bg-danger)] px-5 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              {toggling ? "..." : school.is_active ? "تعطيل المدرسة" : "تفعيل المدرسة"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold tracking-tight">سجل المدفوعات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">التاريخ</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">المبلغ (د.ج)</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">طريقة الدفع</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الدورية</th>
              </tr>
            </thead>
            <tbody>
              {revenueLog.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted">لا توجد مدفوعات بعد</td></tr>
              ) : (
                revenueLog.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-3">
                      {new Date(p.paid_at || p.created_at).toLocaleDateString("ar-DZ")}
                    </td>
                    <td className="border-b border-border px-3 py-3 font-semibold tabular-nums">
                      {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {p.payment_method === "manual" ? "يدوي" : p.payment_method || "-"}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {p.platform_subscriptions?.billing_cycle === "monthly" ? "شهري" : "سنوي"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-muted">{label}</div>
      <div className="font-semibold text-fg">{value}</div>
    </div>
  );
}
