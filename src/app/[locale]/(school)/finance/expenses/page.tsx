"use client";

import { useEffect, useState } from "react";
import { Plus, Download } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface Expense {
  id: string;
  expense_categories: { name: string } | null;
  description: string;
  amount: number;
  expense_date: string;
  invoice_url: string | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("المصاريف");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/expenses?limit=100", undefined, { silent: true })
      .then((res) => setExpenses(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "المالية", href: "/finance" },
          { label: "المصروفات" },
        ]}
      />

      <PageHeader
        title="المصاريف"
        actions={
          <Link href="/finance/expenses/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            إضافة مصروف
          </Link>
        }
      />

      <div className="mb-4 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
        <div className="text-sm text-muted">إجمالي مصاريف الشهر</div>
        <div className="text-2xl font-bold" style={{ color: "var(--danger)" }}>{total.toLocaleString()} د.ج</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">التاريخ</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الفئة</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الوصف</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">المبلغ (د.ج)</th>
                <th className="border-b border-border px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">لا توجد مصاريف بعد</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-3 text-muted">{new Date(e.expense_date).toLocaleDateString("ar-DZ")}</td>
                    <td className="border-b border-border px-3 py-3 font-semibold">{e.expense_categories?.name || "-"}</td>
                    <td className="border-b border-border px-3 py-3">{e.description}</td>
                    <td className="border-b border-border px-3 py-3 font-semibold tabular-nums">{Number(e.amount).toLocaleString()}</td>
                    <td className="border-b border-border px-3 py-3">
                      {e.invoice_url && (
                        <a href={e.invoice_url} target="_blank" className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">
                          <Download className="h-3.5 w-3.5" />
                          فاتورة
                        </a>
                      )}
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
