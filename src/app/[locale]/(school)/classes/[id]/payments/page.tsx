"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, DollarSign, CheckCircle, AlertTriangle, XCircle, Clock, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface PaymentStatusItem {
  student_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  enrollment_date: string;
  total_fees: number;
  paid_amount: number;
  remaining: number;
  payment_status: "paid" | "warning" | "overdue" | "no_fees";
  teaching_start_date: string | null;
}

const statusConfig = {
  paid: { label: "مدفوع", color: "var(--success)", bg: "var(--icon-bg-success)", icon: "CheckCircle" },
  warning: { label: "لم يدفع بعد - إنذار", color: "#d97706", bg: "#fef3c7" },
  overdue: { label: "متأخر - لم يدفع", color: "var(--danger)", bg: "var(--icon-bg-danger)" },
  no_fees: { label: "لا توجد رسوم", color: "var(--muted)", bg: "var(--border)" },
};

export default function ClassPaymentsPage() {
  const params = useParams<{ id: string }>();
  const { setTitle } = usePageTitle();
  const [data, setData] = useState<PaymentStatusItem[]>([]);
  const [className, setClassName] = useState("");
  const [teachingStart, setTeachingStart] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    setTitle("مراقبة المدفوعات");
    Promise.all([
      api.get<any>(`school/classes/${params.id}`, undefined, { silent: true }),
      api.get<any[]>(`school/classes/${params.id}/payment-status`, undefined, { silent: true }),
    ])
      .then(([cls, payments]) => {
        setClassName(cls.name);
        setTeachingStart(cls.teaching_start_date);
        setData(payments);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id, setTitle]);

  if (loading) return <LoadingPage />;

  const paidCount = data.filter((s) => s.payment_status === "paid").length;
  const warningCount = data.filter((s) => s.payment_status === "warning").length;
  const overdueCount = data.filter((s) => s.payment_status === "overdue").length;
  const noFeesCount = data.filter((s) => s.payment_status === "no_fees").length;

  function formatDate(d: string) {
    if (!d) return "-";
    const date = new Date(d);
    const months = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function formatCurrency(n: number) {
    return n.toLocaleString() + " د.ج";
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "الأفواج", href: "/classes" },
          { label: className, href: `/classes/${params.id}` },
          { label: "مراقبة المدفوعات" },
        ]}
      />

      <PageHeader
        title="مراقبة مدفوعات التلاميذ"
        subtitle={`${className}${teachingStart ? ` | بدء التدريس: ${formatDate(teachingStart)}` : ""}`}
        actions={
          <Link
            href={`/classes/${params.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع للفوج
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
          <div className="flex items-center gap-2 text-sm text-muted">
            <CheckCircle className="h-4 w-4" style={{ color: "var(--success)" }} />
            مدفوع
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--success)" }}>{paidCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertTriangle className="h-4 w-4" style={{ color: "#d97706" }} />
            إنذار (قبل بدء التدريس بيومين)
          </div>
          <div className="text-xl font-bold" style={{ color: "#d97706" }}>{warningCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
          <div className="flex items-center gap-2 text-sm text-muted">
            <XCircle className="h-4 w-4" style={{ color: "var(--danger)" }} />
            متأخر (لم يدفع)
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--danger)" }}>{overdueCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="h-4 w-4" style={{ color: "var(--muted)" }} />
            بدون رسوم
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--muted)" }}>{noFeesCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">رمز التلميذ</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">الاسم</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">تاريخ التسجيل</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">إجمالي الرسوم</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">المدفوع</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">المتبقي</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted">لا يوجد تلاميذ في هذا الفوج</td>
                </tr>
              ) : (
                data.map((s) => {
                  const cfg = statusConfig[s.payment_status];
                  return (
                    <tr key={s.student_id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold tabular-nums">{s.student_code}</td>
                      <td className="border-b border-border px-3 py-2.5">
                        <Link href={`/students/${s.student_id}`} className="font-semibold hover:text-accent">
                          {s.first_name} {s.last_name}
                        </Link>
                      </td>
                      <td className="border-b border-border px-3 py-2.5 text-sm text-muted">{formatDate(s.enrollment_date)}</td>
                      <td className="border-b border-border px-3 py-2.5 tabular-nums">{formatCurrency(s.total_fees)}</td>
                      <td className="border-b border-border px-3 py-2.5 tabular-nums">{formatCurrency(s.paid_amount)}</td>
                      <td className="border-b border-border px-3 py-2.5 tabular-nums font-semibold" style={{ color: s.remaining > 0 ? "var(--danger)" : "var(--success)" }}>
                        {formatCurrency(s.remaining)}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                          }}
                        >
                          {s.payment_status === "paid" && <CheckCircle className="h-3 w-3" />}
                          {s.payment_status === "warning" && <AlertTriangle className="h-3 w-3" />}
                          {s.payment_status === "overdue" && <XCircle className="h-3 w-3" />}
                          {s.payment_status === "no_fees" && <Clock className="h-3 w-3" />}
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
