"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

export default function EditSubjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", coefficient: "1" });

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`school/subjects/${params.id}`, undefined, { silent: true })
      .then((s) => {
        setTitle(`تعديل: ${s.name}`);
        setForm({ name: s.name || "", coefficient: String(s.coefficient ?? 1) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id, setTitle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`school/subjects/${params.id}`, {
        name: form.name,
        coefficient: Number(form.coefficient) || 1,
      });
      router.push("/subjects");
    } catch {
      setError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>;
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "المواد الدراسية", href: "/subjects" },
          { label: "تعديل مادة" },
        ]}
      />

      <PageHeader
        title="تعديل المادة"
        actions={
          <Link href="/subjects" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="mx-auto max-w-2xl space-y-6" onSubmit={handleSubmit}>
        {error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">اسم المادة <span className="text-red-500">*</span></label>
              <input value={form.name} required onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">المعامل</label>
              <input type="number" value={form.coefficient} min={1} step={0.5} onChange={(e) => setForm((f) => ({ ...f, coefficient: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
          <Link href="/subjects"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
