"use client";

import { useEffect, useState } from "react";
import { Plus, DollarSign, Pencil, Trash2, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CardSkeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface FeeCategory {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  is_required: boolean;
}

const freqMap: Record<string, string> = {
  once: "مرة واحدة", monthly: "شهري", yearly: "سنوي",
};

export default function FeeCategoriesPage() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("فئات الرسوم");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/fee-categories", undefined, { silent: true })
      .then((res) => setCategories(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف فئة الرسم؟")) return;
    setDeleting(id);
    try {
      await api.delete(`school/fee-categories/${id}`, { silent: true });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "فئات الرسوم" },
        ]}
      />

      <PageHeader
        title="فئات الرسوم"
        actions={
          <Link
            href="/fee-categories/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            إضافة فئة
          </Link>
        }
      />

      {loading ? (
        <CardSkeleton count={3} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="لا توجد فئات رسوم بعد"
          description="أضف فئة رسوم جديدة للبدء"
          action={
            <Link
              href="/fee-categories/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
            >
              <Plus className="h-4 w-4" />
              إضافة فئة
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--icon-bg-warning)]">
                  <DollarSign className="h-5 w-5" style={{ color: "var(--warning)" }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{c.name}</div>
                  <span className="text-xs text-muted">{freqMap[c.frequency] || c.frequency}</span>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/fee-categories/${c.id}/edit`}
                    className="rounded p-1.5 text-muted transition hover:bg-[var(--icon-bg-primary)] hover:text-primary"
                    title="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="rounded p-1.5 text-muted transition hover:bg-[var(--icon-bg-danger)] hover:text-danger disabled:opacity-30"
                    title="حذف"
                  >
                    {deleting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{c.is_required ? "إجباري" : "اختياري"}</span>
                <span className="font-bold text-lg">{c.amount.toLocaleString()} د.ج</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
