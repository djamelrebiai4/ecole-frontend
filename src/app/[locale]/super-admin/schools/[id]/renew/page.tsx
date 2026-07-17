"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

export default function RenewSubscriptionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    Promise.all([
      api.get<any>(`admin/schools/${params.id}`),
      api.get<any>("subscriptions/plans/active"),
    ])
      .then(([sch, plns]) => {
        setSchool(sch);
        const list = Array.isArray(plns) ? plns : [];
        setPlans(list);
        if (list.length > 0) setSelectedPlanId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const amount = selectedPlan
    ? billingCycle === "monthly"
      ? selectedPlan.monthly_price
      : selectedPlan.yearly_price
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    setSubmitting(true);
    try {
      await api.post("subscriptions", {
        school_id: params.id,
        plan_id: selectedPlanId,
        billing_cycle: billingCycle,
        amount,
      });
      router.push(`/super-admin/schools/${params.id}`);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-8 text-center text-sm text-muted">جاري التحميل...</p>;
  if (!school) return <p className="py-8 text-center text-sm text-muted">المدرسة غير موجودة</p>;

  return (
    <div>
      <PageHeader
        title={`تجديد اشتراك: ${school.name}`}
        actions={
          <Link
            href={`/super-admin/schools/${params.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg">الباقة</label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            required
          >
            {plans.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.monthly_price.toLocaleString()} د.ج/شهر
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg">دورية الدفع</label>
          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input
                type="radio"
                name="cycle"
                value="monthly"
                checked={billingCycle === "monthly"}
                onChange={() => setBillingCycle("monthly")}
                className="accent-accent"
              />
              شهرياً
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input
                type="radio"
                name="cycle"
                value="yearly"
                checked={billingCycle === "yearly"}
                onChange={() => setBillingCycle("yearly")}
                className="accent-accent"
              />
              سنوياً
            </label>
          </div>
        </div>

        <div className="rounded-lg bg-bg p-4">
          <div className="text-sm text-muted">المبلغ المستحق</div>
          <div className="text-2xl font-bold text-fg">
            {amount.toLocaleString()} <span className="text-base font-medium text-muted">د.ج</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedPlanId}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "جاري التجديد..." : "تأكيد التجديد"}
        </button>
      </form>
    </div>
  );
}
