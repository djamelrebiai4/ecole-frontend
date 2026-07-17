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

export default function NewSubjectPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", coefficient: "1" });

  useEffect(() => {
    setTitle("إضافة مادة");
  }, [setTitle]);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("school/subjects", {
        name: form.name,
        coefficient: Number(form.coefficient) || 1,
      }, { silent: true });
      router.push("/subjects");
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
          { label: "المواد الدراسية", href: "/subjects" },
          { label: "إضافة مادة" },
        ]}
      />

      <PageHeader
        title="إضافة مادة"
        actions={
          <Link
            href="/subjects"
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
              <label className="mb-1.5 block text-sm font-semibold text-fg">اسم المادة *</label>
              <input
                type="text"
                value={form.name}
                required
                onChange={(e) => setField("name", e.target.value)}
                placeholder="مثلاً: اللغة العربية"
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">المعامل</label>
              <input
                type="number"
                value={form.coefficient}
                min={1}
                step={0.5}
                onChange={(e) => setField("coefficient", e.target.value)}
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
            {saving ? "جارٍ الحفظ..." : "حفظ المادة"}
          </button>
          <Link
            href="/subjects"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
