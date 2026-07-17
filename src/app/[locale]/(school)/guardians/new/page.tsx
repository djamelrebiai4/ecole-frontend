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

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

const relationshipOptions = [
  { value: "", label: "-- اختر --" },
  { value: "father", label: "أب" },
  { value: "mother", label: "أم" },
  { value: "guardian", label: "ولي" },
];

export default function NewGuardianPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    relationship: "",
    phone: "",
    email: "",
    student_id: "",
  });
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("إضافة ولي أمر");
  }, [setTitle]);

  useEffect(() => {
    api.get<Student[]>("school/students?limit=200", undefined, { silent: true })
      .then((res) => setStudents(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const newGuardian: any = await api.post("school/guardians", {
        first_name: form.first_name,
        last_name: form.last_name,
        relationship: form.relationship,
        phone: form.phone || undefined,
        email: form.email || undefined,
      }, { silent: true });

      const guardianId = newGuardian?.id ?? newGuardian?.data?.id ?? newGuardian?._id;

      if (form.student_id && guardianId) {
        await api.post(`school/guardians/${guardianId}/link-student`, {
          student_id: form.student_id,
          is_primary: true,
        }, { silent: true });
      }

      router.push("/guardians");
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
          { label: "أولياء الأمور", href: "/guardians" },
          { label: "إضافة ولي أمر" },
        ]}
      />

      <PageHeader
        title="إضافة ولي أمر"
        actions={
          <Link
            href="/guardians"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-danger/30 bg-[var(--icon-bg-danger)] px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <FormSection title="معلومات ولي الأمر">
          <Field label="الاسم" value={form.first_name} onChange={(v) => set("first_name", v)} required />
          <Field label="اللقب" value={form.last_name} onChange={(v) => set("last_name", v)} required />
          <SelectField label="صلة القرابة" value={form.relationship} onChange={(v) => set("relationship", v)} options={relationshipOptions} required />
          <Field label="رقم الهاتف" value={form.phone} onChange={(v) => set("phone", v)} />
          <Field label="البريد الإلكتروني" type="email" value={form.email} onChange={(v) => set("email", v)} />
        </FormSection>

        <FormSection title="ربط بتلميذ (اختياري)">
          <SelectField label="التلميذ" value={form.student_id} onChange={(v) => set("student_id", v)} options={[
            { value: "", label: "-- اختر تلميذ (اختياري) --" },
            ...students.map((s) => ({ value: s.id, label: `${s.first_name} ${s.last_name}` })),
          ]} />
        </FormSection>

        <div className="flex gap-2 border-t border-border pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            {saving ? "جارٍ الحفظ..." : "حفظ ولي الأمر"}
          </button>
          <Link
            href="/guardians"
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

function Field({ label, type = "text", value, onChange, required }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-fg">
        {label}{required && <span className="me-1 text-danger">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-fg">
        {label}{required && <span className="me-1 text-danger">*</span>}
      </label>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
