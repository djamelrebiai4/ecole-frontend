"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

const frequencyLabels: Record<string, string> = {
  once: "مرة واحدة",
  monthly: "شهري",
  yearly: "سنوي",
};

export default function NewFeeCategoryPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    is_required: false,
  });

  useEffect(() => {
    setTitle("إضافة فئة رسوم");
  }, [setTitle]);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("school/fee-categories", {
        name: form.name,
        amount: Number(form.amount),
        frequency: form.frequency,
        is_required: form.is_required,
      }, { silent: true });
      router.push("/fee-categories");
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "فئات الرسوم", href: "/fee-categories" },
          { label: "إضافة فئة" },
        ]}
      />

      <PageHeader
        title="إضافة فئة رسوم"
        actions={
          <Link
            href="/fee-categories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="mx-auto max-w-2xl space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-danger/30 bg-[var(--icon-bg-danger)] px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">الاسم *</label>
              <input
                type="text"
                value={form.name}
                required
                onChange={(e) => setField("name", e.target.value)}
                placeholder="مثلاً: رسوم التسجيل"
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">المبلغ *</label>
              <input
                type="number"
                value={form.amount}
                required
                onChange={(e) => setField("amount", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">التكرار *</label>
              <select
                value={form.frequency}
                required
                onChange={(e) => setField("frequency", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              >
                {Object.entries(frequencyLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-fg">
                <input
                  type="checkbox"
                  checked={form.is_required}
                  onChange={(e) => setField("is_required", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                إجباري
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            {saving ? "جارٍ الحفظ..." : "حفظ الفئة"}
          </button>
          <Link
            href="/fee-categories"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
