"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Users, GraduationCap, CreditCard, DollarSign, CalendarCheck, BarChart3, TrendingUp, PieChart, Target } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, RadialBarChart, RadialBar, Legend } from "recharts";

interface YearStats {
  year: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    status: string;
  };
  counts: {
    students: number;
    classes: number;
    guardians: number;
    fees: number;
    payments: number;
    attendance: number;
  };
  distribution: {
    statuses: { label: string; value: number; color: string }[];
    genders: { label: string; value: number; color: string }[];
  };
  fees: {
    total: number;
    collected: number;
    pending: number;
    overdue_count: number;
  };
  monthly: { month: string; amount: number }[];
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
}

function formatCurrency(n: number) {
  return n.toLocaleString() + " د.ج";
}

const statCards = [
  { key: "students", label: "التلاميذ", icon: Users, color: "var(--primary)", bg: "var(--icon-bg-primary)" },
  { key: "classes", label: "الأفواج", icon: GraduationCap, color: "var(--success)", bg: "var(--icon-bg-success)" },
  { key: "fees", label: "الرسوم", icon: CreditCard, color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "payments", label: "المدفوعات", icon: DollarSign, color: "#06b6d4", bg: "#ecfeff" },
  { key: "attendance", label: "سجل الحضور", icon: CalendarCheck, color: "#f43f5e", bg: "#fff1f2" },
];

export default function AcademicYearStatsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<YearStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<any>(`school/academic-years/${params.id}/stats`)
      .then((res) => setData(res))
      .catch(() => setError("فشل تحميل الإحصائيات"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted">جاري التحميل...</div>;
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="إحصائيات السنة الدراسية" />
        <div className="py-16 text-center text-sm text-red-500">{error || "السنة غير موجودة"}</div>
      </div>
    );
  }

  const feeCollectedPct = data.fees.total > 0 ? Math.round((data.fees.collected / data.fees.total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`إحصائيات: ${data.year.name}`}
        subtitle={`${data.year.start_date} → ${data.year.end_date}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/academic-years/${params.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
            >
              <BarChart3 className="h-4 w-4" />
              تعديل
            </Link>
            <Link
              href="/academic-years"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              رجوع
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--icon-bg-primary)]">
            <BarChart3 className="h-5 w-5" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <div className="text-sm text-muted">حالة السنة</div>
            <div className="font-semibold">{data.year.is_current ? "الحالية" : data.year.status === "completed" ? "مكتملة" : "نشطة"}</div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const count = (data.counts as any)[card.key] ?? 0;
          return (
            <div key={card.key} className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: card.bg }}>
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-3xl font-bold" style={{ color: card.color }}>{count}</div>
              <div className="mt-1 text-sm text-muted">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Monthly payments chart */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: "var(--primary)" }} />
            <h3 className="text-base font-bold">المدفوعات الشهرية</h3>
          </div>
          {data.monthly.every((m) => m.amount === 0) ? (
            <p className="py-8 text-center text-sm text-muted">لا توجد مدفوعات بعد</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(val: any) => formatCurrency(Number(val) || 0)}
                />
                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Student distribution pie */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" style={{ color: "var(--success)" }} />
            <h3 className="text-base font-bold">توزيع التلاميذ</h3>
          </div>
          {data.distribution.statuses.every((s) => s.value === 0) ? (
            <p className="py-8 text-center text-sm text-muted">لا يوجد تلاميذ</p>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <RPieChart width={180} height={180}>
                <Pie data={data.distribution.statuses} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {data.distribution.statuses.map((entry, i) => (
                    <Cell key={i} fill={entry.color.replace("var(", "").replace(")", "")} style={{ color: entry.color }} />
                  ))}
                </Pie>
                <Tooltip />
              </RPieChart>
              <div className="space-y-2">
                {data.distribution.statuses.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                    <span>{s.label}</span>
                    <span className="ms-auto font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Fee collection */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" style={{ color: "#8b5cf6" }} />
            <h3 className="text-base font-bold">تحصيل الرسوم</h3>
          </div>
          <div className="mb-4">
            <div className="flex items-end justify-between mb-1">
              <span className="text-sm text-muted">نسبة التحصيل</span>
              <span className="text-lg font-bold">{feeCollectedPct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-gradient-to-l from-[#8b5cf6] to-[#a78bfa] transition-all" style={{ width: `${feeCollectedPct}%` }} />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">إجمالي الرسوم</span>
              <span className="font-semibold">{formatCurrency(data.fees.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">المحصل</span>
              <span className="font-semibold" style={{ color: "var(--success)" }}>{formatCurrency(data.fees.collected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">المتبقي</span>
              <span className="font-semibold" style={{ color: data.fees.pending > 0 ? "var(--danger)" : "var(--success)" }}>{formatCurrency(data.fees.pending)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">رسوم متأخرة</span>
              <span className="font-semibold" style={{ color: data.fees.overdue_count > 0 ? "var(--danger)" : "var(--muted)" }}>{data.fees.overdue_count}</span>
            </div>
          </div>
        </div>

        {/* Attendance radial */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" style={{ color: "var(--warning)" }} />
            <h3 className="text-base font-bold">نسبة الحضور</h3>
          </div>
          {data.attendance.total === 0 ? (
            <p className="py-8 text-center text-sm text-muted">لا توجد سجلات حضور</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={20} data={[{ name: "الحضور", value: data.attendance.rate, fill: "var(--accent)" }]} startAngle={180} endAngle={0}>
                  <RadialBar background dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center -mt-8">
                <div className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{data.attendance.rate}%</div>
                <div className="text-sm text-muted">نسبة الحضور</div>
              </div>
              <div className="mt-4 flex w-full justify-around text-center text-sm">
                <div>
                  <div className="font-semibold" style={{ color: "var(--success)" }}>{data.attendance.present}</div>
                  <div className="text-xs text-muted">حاضر</div>
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--danger)" }}>{data.attendance.absent}</div>
                  <div className="text-xs text-muted">غائب</div>
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--warning)" }}>{data.attendance.late}</div>
                  <div className="text-xs text-muted">متأخر</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gender distribution */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: "var(--info)" }} />
            <h3 className="text-base font-bold">توزيع الجنس</h3>
          </div>
          {data.distribution.genders.every((g) => g.value === 0) ? (
            <p className="py-8 text-center text-sm text-muted">لا يوجد تلاميذ</p>
          ) : (
            <div className="flex flex-col items-center">
              <RPieChart width={180} height={180}>
                <Pie data={data.distribution.genders} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={5}>
                  {data.distribution.genders.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RPieChart>
              <div className="mt-2 flex gap-6 text-sm">
                {data.distribution.genders.map((g) => {
                  const total = data.distribution.genders.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((g.value / total) * 100) : 0;
                  return (
                    <div key={g.label} className="text-center">
                      <span className="h-3 w-3 rounded-full inline-block" style={{ background: g.color }} />
                      <span className="ms-1">{g.label}</span>
                      <div className="font-bold">{g.value} ({pct}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
