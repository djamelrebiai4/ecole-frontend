"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

export default function EditStaffPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tPage = useTranslations("school.staff");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState<{
    full_name: string;
    staff_type: string;
    specialization: string | null;
    phone: string | null;
    email: string | null;
    hire_date: string;
    staff_subjects?: { subject_id: string }[];
    is_active?: boolean;
  } | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    staff_type: "teacher",
    specialization: "",
    phone: "",
    email: "",
    hire_date: "",
    subject_ids: [] as string[],
  });
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const { setTitle } = usePageTitle();

  useEffect(() => {
    if (!params?.id) return;
    api.get<{ id: string; name: string }[] | { data: { id: string; name: string }[] }>("school/subjects", undefined, { silent: true })
      .then((res) => setSubjects(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
    api.get<{
      full_name: string;
      staff_type: string;
      specialization: string | null;
      phone: string | null;
      email: string | null;
      hire_date: string;
      staff_subjects?: { subject_id: string }[];
      is_active?: boolean;
    }>(`school/staff/${params.id}`, undefined, { silent: true })
      .then((data) => {
        setStaff(data);
        setTitle(`تعديل: ${data.full_name || ""}`);
        setForm({
          full_name: data.full_name || "",
          staff_type: data.staff_type || "teacher",
          specialization: data.specialization || "",
          phone: data.phone || "",
          email: data.email || "",
          hire_date: data.hire_date || new Date().toISOString().split("T")[0],
          subject_ids: data.staff_subjects?.map((s) => s.subject_id) || [],
        });
        setSelectedSubjects(new Set(data.staff_subjects?.map((s) => s.subject_id) || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id, setTitle]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleSubject(id: string) {
    const next = new Set(selectedSubjects);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedSubjects(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`school/staff/${params.id}`, {
        ...form,
        subject_ids: form.staff_type === "teacher" ? Array.from(selectedSubjects) : undefined,
      });
      router.push(`/staff/${params.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!staff) {
    return <p className="py-8 text-center text-sm text-muted">الموظف غير موجود</p>;
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: tPage("title"), href: "/staff" },
          { label: staff.full_name, href: `/staff/${params.id}` },
          { label: "تعديل" },
        ]}
      />

      <PageHeader
        title={`تعديل: ${staff.full_name}`}
        actions={
          <Link
            href={`/staff/${params.id}`}
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        }
      />

      {error && (
        <div className="mb-5 rounded-lg bg-danger/10 border border-danger/20 p-4 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">الاسم الكامل <span className="text-danger">*</span></label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">النوع <span className="text-danger">*</span></label>
            <select
              value={form.staff_type}
              onChange={(e) => set("staff_type", e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="teacher">أستاذ</option>
              <option value="supervisor">مشرف</option>
              <option value="admin_staff">إداري</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">التخصص</label>
            <input
              type="text"
              value={form.specialization}
              onChange={(e) => set("specialization", e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">الهاتف</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">تاريخ التعيين</label>
            <input
              type="date"
              value={form.hire_date}
              onChange={(e) => set("hire_date", e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={staff.is_active ?? true}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="h-4 w-4 rounded border-border text-accent accent-accent"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-fg">نشط</label>
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
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
          <Link href={`/staff/${params.id}`}
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}