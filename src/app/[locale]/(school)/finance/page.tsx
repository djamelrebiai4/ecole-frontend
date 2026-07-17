"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Link } from "@/i18n/routing";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

export default function FinancePage() {
  const t = useTranslations("school.nav");
  const [stats, setStats] = useState<{ monthly_income: number; monthly_expenses: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("school/dashboard")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const income = stats?.monthly_income ?? 0;
  const expenses = stats?.monthly_expenses ?? 0;
  const net = income - expenses;

  return (
    <div>
      <PageHeader
        title={t("finance")}
        actions={
          <Link
            href="/finance/payments/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            تسجيل دفعة
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<TrendingUp className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-success)"
          iconColor="var(--success)"
          value={loading ? "..." : income.toLocaleString()}
          label="إجمالي المداخيل (الشهر)"
          change="د.ج"
          trend="up"
        />
        <StatCard
          icon={<TrendingDown className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-danger)"
          iconColor="var(--danger)"
          value={loading ? "..." : expenses.toLocaleString()}
          label="إجمالي المصاريف (الشهر)"
          change="د.ج"
          trend="down"
        />
        <StatCard
          icon={<DollarSign className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-primary)"
          iconColor="var(--primary)"
          value={loading ? "..." : net.toLocaleString()}
          label="صافي الربح"
          change="د.ج"
          trend={net >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <QuickLink href="/finance/payments" title="دفعات التلاميذ" subtitle="كل المدفوعات المستلمة" />
        <QuickLink href="/fee-categories" title="فئات الرسوم" subtitle="تعريف وإدارة أنواع الرسوم" />
        <QuickLink href="/finance/fee-templates" title="قوالب الرسوم" subtitle="تحديد رسوم كل فوج دراسي" />
        <QuickLink href="/finance/grants" title="الإعانات" subtitle="إعانات غير مرتبطة بالتلاميذ" />
        <QuickLink href="/finance/expenses" title="المصاريف" subtitle="مصاريف المدرسة" />
        <QuickLink href="/finance/reports" title="التقارير المالية" subtitle="تقارير شهرية وسنوية" />
      </div>
    </div>
  );
}

function QuickLink({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)] transition-all hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--icon-bg-primary)]" style={{ color: "var(--primary)" }}>
        <DollarSign className="h-[22px] w-[22px]" />
      </div>
      <div>
        <div className="text-base font-bold">{title}</div>
        <div className="text-sm text-muted">{subtitle}</div>
      </div>
    </Link>
  );
}
