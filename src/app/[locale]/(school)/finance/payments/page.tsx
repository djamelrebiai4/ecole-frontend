"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

interface Payment {
  id: string;
  receipt_number: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  students: { first_name: string; last_name: string; student_code: string } | null;
  student_fees: { fee_categories: { name: string } | null } | null;
}

const methodMap: Record<string, string> = {
  cash: "نقداً", check: "شيك", transfer: "تحويل بنكي",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("school/payments?limit=100")
      .then((res) => setPayments(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="دفعات التلاميذ"
        actions={
          <Link
            href="/finance/payments/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            إضافة دفعة
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الإيصال</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">التلميذ</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الرسم</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">المبلغ (د.ج)</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">طريقة الدفع</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">لا توجد دفعات بعد</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-3 font-semibold">{p.receipt_number}</td>
                    <td className="border-b border-border px-3 py-3">{p.students?.student_code || "-"}</td>
                    <td className="border-b border-border px-3 py-3">{p.student_fees?.fee_categories?.name || "-"}</td>
                    <td className="border-b border-border px-3 py-3 font-semibold tabular-nums">{Number(p.amount).toLocaleString()}</td>
                    <td className="border-b border-border px-3 py-3">{methodMap[p.payment_method] || p.payment_method}</td>
                    <td className="border-b border-border px-3 py-3 text-muted">{new Date(p.payment_date).toLocaleDateString("ar-DZ")}</td>
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
