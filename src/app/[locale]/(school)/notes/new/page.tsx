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

const noteTypeLabels: Record<string, string> = {
  academic: "ملاحظة دراسية",
  behavioral: "ملاحظة سلوكية",
  health: "ملاحظة صحية",
  general: "ملاحظة عامة",
};

export default function NewNotePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({
    student_id: "",
    note_type: "general",
    content: "",
    is_private: false,
  });
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("إضافة ملاحظة");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/students?limit=200", undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setStudents(list);
      })
      .catch(() => {});
  }, []);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("school/notes", form);
      router.push("/notes");
    } catch (err: any) {
      const msg = err?.message || "حدث خطأ أثناء الحفظ";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "الملاحظات", href: "/notes" },
          { label: "إضافة ملاحظة" },
        ]}
      />

      <PageHeader
        title="إضافة ملاحظة"
        actions={
          <Link
            href="/notes"
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

        <FormSection title="معلومات الملاحظة">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">التلميذ *</label>
            <select
              value={form.student_id}
              onChange={(e) => setField("student_id", e.target.value)}
              required
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
            >
              <option value="">-- اختر تلميذاً --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} - {s.student_code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">نوع الملاحظة</label>
            <select
              value={form.note_type}
              onChange={(e) => setField("note_type", e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
            >
              {Object.entries(noteTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-fg">المحتوى *</label>
            <textarea
              value={form.content}
              onChange={(e) => setField("content", e.target.value)}
              required
              rows={5}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              placeholder="اكتب محتوى الملاحظة..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-fg">
              <input
                type="checkbox"
                checked={form.is_private}
                onChange={(e) => setField("is_private", e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              ملاحظة خاصة (لن تظهر للتلميذ)
            </label>
          </div>
        </FormSection>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            {saving ? "جارٍ الحفظ..." : "حفظ الملاحظة"}
          </button>
          <Link
            href="/notes"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
      <h3 className="mb-4 text-base font-semibold text-fg">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}
