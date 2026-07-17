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

export default function NewGrantPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "",
    received_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    setTitle("إضافة إعانة");
  }, [setTitle]);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("school/grants", {
        description: form.description,
        amount: Number(form.amount),
        category: form.category || undefined,
        received_date: form.received_date || undefined,
      }, { silent: true });
      router.push("/finance/grants");
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
          { label: "المالية", href: "/finance" },
          { label: "الإعانات", href: "/finance/grants" },
          { label: "إضافة إعانة" },
        ]}
      />

      <PageHeader
        title="إضافة إعانة"
        actions={
          <Link
            href="/finance/grants"
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
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-fg">الوصف *</label>
              <input
                type="text"
                value={form.description}
                required
                onChange={(e) => setField("description", e.target.value)}
                placeholder="وصف الإعانة"
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
              <label className="mb-1.5 block text-sm font-semibold text-fg">الفئة</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="مثلاً: إعانة حكومية"
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">تاريخ الاستلام</label>
              <input
                type="date"
                value={form.received_date}
                onChange={(e) => setField("received_date", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              />
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
            {saving ? "جارٍ الحفظ..." : "حفظ الإعانة"}
          </button>
          <Link
            href="/finance/grants"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
