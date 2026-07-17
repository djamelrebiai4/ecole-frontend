"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Users, Home, DollarSign, TrendingDown } from "lucide-react";
import { Link } from "@/i18n/routing";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StatsSkeleton, CardSkeleton, TableSkeleton } from "@/components/shared/Skeleton";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { useAcademicYears } from "@/contexts/AcademicYearContext";

interface SchoolStats {
  total_students: number;
  total_classes: number;
  total_staff: number;
  total_rooms: number;
  monthly_income: number;
  monthly_expenses: number;
  overdue_fees: number;
  active_subscription: { plan_name: string | null; status: string; end_date: string; billing_cycle: string } | null;
}

interface DistItem {
  status: string;
  count: number;
}

interface MonthlySummary {
  labels: string[];
  income: number[];
  expenses: number[];
}

interface RecentStudent {
  id: string;
  student_code: string;
  full_name: string;
  status: string;
  class_name: string;
  guardian_name: string;
  created_at: string;
}

interface PendingFee {
  id: string;
  student_name: string;
  student_code: string;
  fee_name: string;
  amount: number;
  paid_amount: number;
  overdue_amount: number;
  due_date: string;
  status: string;
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  const months = [
    "يناير","فبراير","مارس","أبريل","ماي","جوان",
    "جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatCurrency(n: number) {
  return n.toLocaleString() + " د.ج";
}

export default function SchoolDashboardPage() {
  const t = useTranslations("school.dashboard");
  const tg = useTranslations("school.dashboard.table");
  const tCommon = useTranslations("common");

  const { setTitle } = usePageTitle();
  const { yearVersion } = useAcademicYears();
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [distribution, setDistribution] = useState<DistItem[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [pendingFees, setPendingFees] = useState<PendingFee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<SchoolStats>("school/dashboard", undefined, { silent: true }),
      api.get<DistItem[]>("school/dashboard/student-distribution", undefined, { silent: true }),
      api.get<MonthlySummary>("school/dashboard/monthly-summary", undefined, { silent: true }),
      api.get<RecentStudent[]>("school/dashboard/recent-students", undefined, { silent: true }),
      api.get<PendingFee[]>("school/dashboard/pending-fees", undefined, { silent: true }),
    ])
      .then(([s, d, m, r, p]) => {
        setStats(s);
        setDistribution(d);
        setMonthly(m);
        setRecentStudents(r);
        setPendingFees(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [yearVersion]);

  const distColors: Record<string, string> = {
    boarding: "var(--accent)",
    half_boarding: "var(--warning)",
    external: "var(--info)",
    unknown: "var(--border)",
  };

  const distLabels: Record<string, string> = {
    boarding: t("studentDist.boarding"),
    half_boarding: t("studentDist.halfBoarding"),
    external: t("studentDist.external"),
    unknown: t("studentDist.unknown"),
  };

  const totalDist = distribution.reduce((s, d) => s + d.count, 0);
  let cumulative = 0;
  const gradientParts = distribution.map((d) => {
    const pct = totalDist > 0 ? (d.count / totalDist) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    const color = distColors[d.status] || "var(--border)";
    return `${color} ${start}% ${cumulative}%`;
  });

  const chartData = monthly;
  const maxVal = Math.max(...(chartData?.income || [0]), ...(chartData?.expenses || [0])) || 1;
  const svgW = 300;
  const svgH = 160;
  const padL = 5;
  const padR = 5;
  const padB = 30;
  const padT = 5;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const n = chartData?.labels?.length || 0;
  const stepX = n > 1 ? chartW / (n - 1) : 0;

  function yPos(val: number) {
    return padT + chartH - (val / maxVal) * chartH;
  }

  function buildPoints(arr: number[]) {
    return arr.map((v, i) => `${padL + i * stepX},${yPos(v)}`).join(" ");
  }

  function buildPolygon(arr: number[]) {
    if (!arr.length) return "";
    const pts = arr.map((v, i) => `${padL + i * stepX},${yPos(v)}`).join(" ");
    return `${pts} ${padL + (arr.length - 1) * stepX},${svgH} ${padL},${svgH}`;
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: t("title") }]} />

      <PageHeader
        title={t("title")}
        subtitle={t("lastUpdate")}
        actions={
          <Link href="/finance/payments/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            {t("newPayment")}
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <StatsSkeleton />
        ) : (
          <>
            <StatCard
              icon={<Users className="h-[22px] w-[22px]" />}
              iconBg="var(--icon-bg-primary)"
              iconColor="var(--primary)"
              value={stats?.total_students ?? 0}
              label={t("stats.students")}
            />
            <StatCard
              icon={<Home className="h-[22px] w-[22px]" />}
              iconBg="var(--icon-bg-success)"
              iconColor="var(--success)"
              value={stats?.total_classes ?? 0}
              label={t("stats.classes")}
            />
            <StatCard
              icon={<DollarSign className="h-[22px] w-[22px]" />}
              iconBg="var(--icon-bg-warning)"
              iconColor="var(--warning)"
              value={(stats?.monthly_income ?? 0).toLocaleString()}
              label={t("stats.income")}
              change="د.ج"
              trend="up"
            />
            <StatCard
              icon={<TrendingDown className="h-[22px] w-[22px]" />}
              iconBg="var(--icon-bg-danger)"
              iconColor="var(--danger)"
              value={(stats?.monthly_expenses ?? 0).toLocaleString()}
              label={t("stats.expenses")}
              change="د.ج"
              trend="down"
            />
          </>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Student distribution pie chart */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-bold tracking-tight">{t("studentDistTitle")}</h3>
            <Link href="/students" className="text-[13px] font-semibold text-accent hover:underline">التفاصيل</Link>
          </div>
          <div className="px-5 py-3">
            {totalDist === 0 ? (
              <p className="py-4 text-center text-sm text-muted">لا يوجد تلاميذ بعد</p>
            ) : (
              <div className="flex items-center gap-6 py-2">
                <div
                  className="h-[120px] w-[120px] flex-shrink-0 rounded-full"
                  style={{
                    background: `conic-gradient(${gradientParts.join(", ")})`,
                  }}
                />
                <div className="flex-1">
                  {distribution.map((d) => (
                    <LegendRow
                      key={d.status}
                      color={distColors[d.status] || "var(--border)"}
                      label={distLabels[d.status] || d.status}
                      value={d.count}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Income vs Expenses chart */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-bold tracking-tight">{t("incomeVsExpenses")}</h3>
            <span className="text-[13px] font-semibold text-accent">{t("last6months")}</span>
          </div>
          <div className="px-5 py-3">
            {!chartData || chartData.income.every((v) => v === 0) && chartData.expenses.every((v) => v === 0) ? (
              <p className="py-4 text-center text-sm text-muted">لا توجد معاملات مالية بعد</p>
            ) : (
              <div className="relative" style={{ height: 180 }}>
                <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="h-full w-full">
                  {[0.25, 0.5, 0.75].map((ratio) => (
                    <line
                      key={ratio}
                      x1="0" y1={yPos(maxVal * ratio)}
                      x2={svgW} y2={yPos(maxVal * ratio)}
                      stroke="var(--border)" strokeWidth="0.5"
                    />
                  ))}
                  <polyline
                    points={buildPoints(chartData?.income || [])}
                    fill="none" stroke="var(--accent)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  <polygon
                    points={buildPolygon(chartData?.income || [])}
                    fill="url(#incomeGrad)" opacity="0.15"
                  />
                  <polyline
                    points={buildPoints(chartData?.expenses || [])}
                    fill="none" stroke="var(--danger)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="6 3"
                  />
                  {chartData?.labels.map((label, i) => (
                    <text key={i} x={padL + i * stepX} y={svgH - 4} fill="var(--muted)" fontSize="8" textAnchor="middle">
                      {label}
                    </text>
                  ))}
                  <circle cx={svgW - 80} cy="10" r="3" fill="var(--accent)" />
                  <text x={svgW - 74} y="13" fill="var(--muted)" fontSize="8">مداخيل</text>
                  <circle cx={svgW - 30} cy="10" r="3" fill="var(--danger)" />
                  <text x={svgW - 24} y="13" fill="var(--muted)" fontSize="8">مصاريف</text>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent students */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold tracking-tight">{t("recentStudents")}</h3>
          <Link href="/students" className="text-[13px] font-semibold text-accent hover:underline">عرض الكل</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("studentCode")}</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("fullName")}</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("status")}</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("class")}</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("guardian")}</th>
                <th className="border-b border-border px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted">لا يوجد تلاميذ مسجلين بعد</td>
                </tr>
              ) : (
                recentStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-2.5 font-semibold tabular-nums">{s.student_code}</td>
                    <td className="border-b border-border px-3 py-2.5">{s.full_name}</td>
                    <td className="border-b border-border px-3 py-2.5">
                      <StatusBadge status={s.status} label={distLabels[s.status] || s.status} />
                    </td>
                    <td className="border-b border-border px-3 py-2.5">{s.class_name}</td>
                    <td className="border-b border-border px-3 py-2.5">{s.guardian_name}</td>
                    <td className="border-b border-border px-3 py-2.5">
                      <div className="flex gap-1">
                        <Link href={`/students/${s.id}`} className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">عرض</Link>
                        <Link href={`/students/${s.id}`} className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">تعديل</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue payments */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold tracking-tight">{t("overduePayments")}</h3>
          <Link href="/finance/payments" className="text-[13px] font-semibold text-accent hover:underline">{t("sendReminder")}</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">التلميذ</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">الرسم</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">المبلغ</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">المتأخر</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">تاريخ الاستحقاق</th>
                <th className="border-b border-border px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {pendingFees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted">لا توجد رسوم متأخرة</td>
                </tr>
              ) : (
                pendingFees.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-2.5 font-semibold">{o.student_name}</td>
                    <td className="border-b border-border px-3 py-2.5">{o.fee_name}</td>
                    <td className="border-b border-border px-3 py-2.5">{formatCurrency(o.amount)}</td>
                    <td className="border-b border-border px-3 py-2.5 font-semibold" style={{ color: o.status === "overdue" ? "var(--danger)" : "var(--warning)" }}>
                      {formatCurrency(o.overdue_amount)}
                    </td>
                    <td className="border-b border-border px-3 py-2.5">{formatDate(o.due_date)}</td>
                    <td className="border-b border-border px-3 py-2.5">
                      <div className="flex gap-1">
                        <Link href="/finance/payments/new" className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">{t("pay")}</Link>
                        <Link href="/finance/payments" className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">عرض</Link>
                      </div>
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

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span>{label}</span>
      <span className="ms-auto font-semibold">{value}</span>
    </div>
  );
}
