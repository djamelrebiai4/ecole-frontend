"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

export default function EditSchoolPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    max_students: 0,
  });

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`admin/schools/${params.id}`)
      .then((sch) => {
        setForm({
          name: sch.name || "",
          email: sch.email || "",
          phone: sch.phone || "",
          address: sch.address || "",
          max_students: sch.max_students || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.id) return;
    setSubmitting(true);
    try {
      await api.put(`admin/schools/${params.id}`, {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        max_students: form.max_students || null,
      });
      router.push(`/super-admin/schools/${params.id}`);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-8 text-center text-sm text-muted">جاري التحميل...</p>;

  return (
    <div>
      <PageHeader
        title={`تعديل: ${form.name}`}
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

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
        <div>
          <h3 className="mb-4 text-base font-semibold text-fg">معلومات المدرسة</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">اسم المدرسة</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">البريد الإلكتروني</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">الهاتف</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">السعة القصوى</label>
              <input
                type="number"
                value={form.max_students}
                onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-fg">العنوان</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border pt-5">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ التعديلات
          </button>
          <Link
            href={`/super-admin/schools/${params.id}`}
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
