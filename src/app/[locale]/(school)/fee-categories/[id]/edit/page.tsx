"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

export default function EditFeeCategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", amount: "", frequency: "once", is_required: false });

  useEffect(() => {
    api.get<any>(`school/fee-categories`, undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        const cat = list.find((c: any) => c.id === params.id);
        if (cat) {
          setForm({ name: cat.name, amount: String(cat.amount), frequency: cat.frequency, is_required: cat.is_required });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`school/fee-categories/${params.id}`, {
        name: form.name,
        amount: Number(form.amount),
        frequency: form.frequency,
        is_required: form.is_required,
      });
      router.push("/fee-categories");
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
      <PageHeader
        title="تعديل فئة الرسم"
        actions={
          <Link href="/fee-categories" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="max-w-lg space-y-6" onSubmit={handleSubmit}>
        {error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">الاسم <span className="text-red-500">*</span></label>
              <input value={form.name} required onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">المبلغ (د.ج) <span className="text-red-500">*</span></label>
              <input type="number" value={form.amount} required min={1} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">التكرار</label>
              <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent">
                <option value="once">مرة واحدة</option>
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_required} onChange={(e) => setForm((f) => ({ ...f, is_required: e.target.checked }))}
                className="h-4 w-4" />
              رسم إجباري
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
          <Link href="/fee-categories"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
