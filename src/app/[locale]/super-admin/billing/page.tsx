"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Check, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

interface Plan {
  id: string;
  name: string;
  slug: string;
  max_students: number | null;
  monthly_price: number;
  yearly_price: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function BillingPage() {
  const t = useTranslations("superAdmin.billing");
  const tCommon = useTranslations("common");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ monthly: number; yearly: number; name: string; max_students: number | null }>({
    monthly: 0,
    yearly: 0,
    name: "",
    max_students: null,
  });

  useEffect(() => {
    api.get<any>("subscriptions/plans")
      .then((res) => setPlans(Array.isArray(res) ? res : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (plan: Plan) => {
    setEditing(plan.id);
    setDraft({
      monthly: plan.monthly_price,
      yearly: plan.yearly_price,
      name: plan.name,
      max_students: plan.max_students,
    });
  };

  const saveEdit = async (plan: Plan) => {
    setSaving(plan.id);
    try {
      const updated = await api.put<any>(`subscriptions/plans/${plan.id}`, {
        monthly_price: draft.monthly,
        yearly_price: draft.yearly,
        name: draft.name,
        max_students: draft.max_students,
      });
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, ...updated } : p))
      );
      setEditing(null);
    } catch {
    } finally {
      setSaving(null);
    }
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title={t("title")} />
        <p className="py-8 text-center text-sm text-muted">جاري التحميل...</p>
      </div>
    );
  }

  const planColors: Record<string, { color: string; bg: string }> = {
    small: { color: "var(--primary)", bg: "var(--icon-bg-primary)" },
    medium: { color: "var(--accent)", bg: "var(--icon-bg-success)" },
    large: { color: "var(--warning)", bg: "var(--icon-bg-warning)" },
  };

  return (
    <div>
      <PageHeader title={t("title")} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const style = planColors[plan.slug] || { color: "var(--fg)", bg: "var(--bg)" };
          return (
            <div
              key={plan.id}
              className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]"
            >
              <div className="border-b border-border px-6 py-4" style={{ background: style.bg }}>
                <h3 className="text-lg font-bold" style={{ color: style.color }}>
                  {plan.name}
                </h3>
                <p className="mt-0.5 text-sm text-muted">
                  {plan.max_students === null
                    ? t("unlimited")
                    : `${t("maxStudents")}: ${plan.max_students}`}
                </p>
              </div>

              <div className="p-6">
                {editing === plan.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-fg">
                        {t("monthly")} (د.ج)
                      </label>
                      <input
                        type="number"
                        value={draft.monthly}
                        onChange={(e) => setDraft({ ...draft, monthly: Number(e.target.value) })}
                        className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-fg">
                        {t("yearly")} (د.ج)
                      </label>
                      <input
                        type="number"
                        value={draft.yearly}
                        onChange={(e) => setDraft({ ...draft, yearly: Number(e.target.value) })}
                        className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(plan)}
                        disabled={saving === plan.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        {saving === plan.id ? "..." : tCommon("save")}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg hover:border-primary hover:text-primary"
                      >
                        <X className="h-4 w-4" />
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="text-sm text-muted">{t("monthly")}</div>
                      <div className="text-2xl font-bold text-fg">
                        {plan.monthly_price.toLocaleString()} <span className="text-base font-medium text-muted">د.ج</span>
                      </div>
                    </div>
                    <div className="mb-5">
                      <div className="text-sm text-muted">{t("yearly")}</div>
                      <div className="text-2xl font-bold text-fg">
                        {plan.yearly_price.toLocaleString()} <span className="text-base font-medium text-muted">د.ج</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(plan)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t("editPrice")}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
