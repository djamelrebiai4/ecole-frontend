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

interface ExpenseCategory {
  id: string;
  name: string;
}

export default function NewExpensePage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category_id: "",
    expense_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    setTitle("إضافة مصروف");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/expense-categories", undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setCategories(list);
      })
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const categoryName = showNewCategory ? newCategoryName.trim() : form.category_id;
      if (!categoryName) { setError("يرجى اختيار أو كتابة الفئة"); setSaving(false); return; }
      await api.post("school/expenses", {
        description: form.description,
        amount: Number(form.amount),
        expense_category_id: categoryName,
        expense_date: form.expense_date || undefined,
      }, { silent: true });
      router.push("/finance/expenses");
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
          { label: "المصروفات", href: "/finance/expenses" },
          { label: "إضافة مصروف" },
        ]}
      />

      <PageHeader
        title="إضافة مصروف"
        actions={
          <Link
            href="/finance/expenses"
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
                placeholder="وصف المصروف"
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
              <label className="mb-1.5 block text-sm font-semibold text-fg">الفئة *</label>
              {!showNewCategory ? (
                <select
                  value={form.category_id}
                  required
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setShowNewCategory(true);
                      setField("category_id", "");
                    } else {
                      setField("category_id", e.target.value);
                    }
                  }}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? "جارٍ التحميل..." : "-- اختر الفئة --"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  <option value="__new__">أخرى (إضافة فئة جديدة)...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    required
                    autoFocus
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="اكتب اسم الفئة الجديدة"
                    className="flex-1 rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}
                    className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-muted hover:border-primary"
                  >
                    رجوع
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">تاريخ المصروف</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setField("expense_date", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || loadingCategories}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            {saving ? "جارٍ الحفظ..." : "حفظ المصروف"}
          </button>
          <Link
            href="/finance/expenses"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
