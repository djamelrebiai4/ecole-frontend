"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, BookOpen } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

const typeOptions = [
  { value: "teacher", label: "أستاذ" },
  { value: "supervisor", label: "مشرف" },
  { value: "admin_staff", label: "إداري" },
];

export default function NewStaffPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    full_name: "",
    staff_type: "teacher",
    specialization: "",
    phone: "",
    email: "",
    hire_date: "",
  });

  useEffect(() => {
    setTitle("إضافة موظف");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/subjects", undefined, { silent: true })
      .then((res) => setSubjects(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, []);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleSubject(id: string) {
    const next = new Set(selectedSubjects);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSubjects(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("school/staff", {
        ...form,
        subject_ids: form.staff_type === "teacher" ? Array.from(selectedSubjects) : undefined,
      }, { silent: true });
      router.push("/staff");
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
          { label: "الموظفون", href: "/staff" },
          { label: "إضافة موظف" },
        ]}
      />

      <PageHeader
        title="إضافة موظف"
        actions={
          <Link
            href="/staff"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-danger/30 bg-[var(--icon-bg-danger)] px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-fg">
                الاسم الكامل <span className="text-danger">*</span>
              </label>
              <input type="text" value={form.full_name} required onChange={(e) => setField("full_name", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">
                نوع الموظف <span className="text-danger">*</span>
              </label>
              <select value={form.staff_type} required onChange={(e) => setField("staff_type", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]">
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">التخصص</label>
              <input type="text" value={form.specialization} onChange={(e) => setField("specialization", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">الهاتف</label>
              <input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">البريد الإلكتروني <span className="text-danger">*</span></label>
              <input type="email" value={form.email} required onChange={(e) => setField("email", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">تاريخ التوظيف</label>
              <input type="date" value={form.hire_date} onChange={(e) => setField("hire_date", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]" />
            </div>
          </div>
        </div>

        {form.staff_type === "teacher" && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-fg">المواد التي يدرسها</h3>
              <Link
                href="/subjects/new"
                target="_blank"
                className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark"
              >
                <Plus className="h-3 w-3" />
                إضافة مادة
              </Link>
            </div>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted">
                لا توجد مواد بعد. 
                <Link href="/subjects/new" target="_blank" className="mx-1 font-semibold text-accent hover:underline">
                  أضف المواد أولاً
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {subjects.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-bg has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.has(s.id)}
                      onChange={() => toggleSubject(s.id)}
                      className="h-4 w-4 rounded border-border text-accent accent-accent"
                    />
                    <BookOpen className="h-3.5 w-3.5 text-muted" />
                    {s.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
            {saving && <LoadingSpinner size="sm" />}
            {saving ? "جارٍ الحفظ..." : "إضافة موظف"}
          </button>
          <Link href="/staff"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
