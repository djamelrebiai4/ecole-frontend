"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

export default function EditAcademicYearPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    api.get<any>(`school/academic-years/${params.id}`)
      .then((res) => {
        const y = res;
        setForm({
          name: y.name || "",
          start_date: y.start_date || "",
          end_date: y.end_date || "",
        });
      })
      .catch(() => {
        setError("فشل تحميل بيانات السنة الدراسية");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`school/academic-years/${params.id}`, {
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
      });
      router.push("/academic-years");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted">جاري التحميل...</div>
    );
  }

  return (
    <div>
      <PageHeader
        title="تعديل السنة الدراسية"
        actions={
          <Link
            href="/academic-years"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-fg">اسم السنة الدراسية <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                required
                onChange={(e) => set("name", e.target.value)}
                placeholder="مثلاً: 2025-2026"
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">تاريخ البداية <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.start_date}
                required
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">تاريخ النهاية <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.end_date}
                required
                onChange={(e) => set("end_date", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
          <Link
            href="/academic-years"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
