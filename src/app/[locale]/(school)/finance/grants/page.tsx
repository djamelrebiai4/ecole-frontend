"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface Grant {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("الإعانات");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/grants?limit=100", undefined, { silent: true })
      .then((res) => setGrants(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "المالية", href: "/finance" },
          { label: "الإعانات" },
        ]}
      />

      <PageHeader
        title="الإعانات"
        actions={
          <Link href="/finance/grants/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            إضافة إعانة
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">التاريخ</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الفئة</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الوصف</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">المبلغ (د.ج)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : grants.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-muted">لا توجد إعانات بعد</td></tr>
              ) : (
                grants.map((g) => (
                  <tr key={g.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-3 text-muted">{g.date ? new Date(g.date).toLocaleDateString("ar-DZ") : "-"}</td>
                    <td className="border-b border-border px-3 py-3 font-semibold">{g.category}</td>
                    <td className="border-b border-border px-3 py-3">{g.description}</td>
                    <td className="border-b border-border px-3 py-3 font-semibold tabular-nums">{g.amount.toLocaleString()}</td>
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
