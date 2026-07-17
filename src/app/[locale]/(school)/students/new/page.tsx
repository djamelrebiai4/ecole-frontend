"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface SchoolClass {
  id: string;
  name: string;
  level: string;
  capacity: number;
}

export default function NewStudentPage() {
  const router = useRouter();
  const t = useTranslations("school.students.form");
  const tPage = useTranslations("school.students");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [form, setForm] = useState({
    first_name: "", last_name: "", birth_date: "", birth_place: "",
    gender: "", nationality: "", address: "",
    enrollment_date: "", status: "", blood_type: "", medical_notes: "",
    class_id: "",
    guardian_first_name: "", guardian_last_name: "", guardian_phone: "",
  });
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle(tPage("addNew"));
    if (!form.enrollment_date) {
      setForm(prev => ({ ...prev, enrollment_date: new Date().toISOString().split('T')[0] }));
    }
  }, [setTitle, tPage, form.enrollment_date]);

  useEffect(() => {
    api.get<SchoolClass[]>("school/classes", undefined, { silent: true })
      .then((res) => setClasses(Array.isArray(res) ? res : (res as any).data ?? []))
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
      const newStudent: any = await api.post("school/students", {
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date,
        birth_place: form.birth_place,
        gender: form.gender,
        nationality: form.nationality,
        address: form.address,
        enrollment_date: form.enrollment_date,
        status: form.status,
        blood_type: form.blood_type,
        medical_notes: form.medical_notes,
        class_id: form.class_id || undefined,
      }, { silent: true });

      if (form.guardian_first_name || form.guardian_last_name || form.guardian_phone) {
        const guardian: any = await api.post("school/guardians", {
          first_name: form.guardian_first_name,
          last_name: form.guardian_last_name,
          phone: form.guardian_phone,
          relationship: "father",
        }, { silent: true });

        const guardianId = guardian?.id ?? guardian?.data?.id ?? guardian?._id;
        const studentId = newStudent?.id ?? newStudent?.data?.id ?? newStudent?._id;

        if (guardianId && studentId) {
          await api.post(`school/guardians/${guardianId}/link-student`, {
            student_id: studentId,
            is_primary: true,
          }, { silent: true });
        }
      }

      router.push("/students");
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
          { label: tPage("title"), href: "/students" },
          { label: tPage("addNew") },
        ]}
      />

      <PageHeader
        title={tPage("addNew")}
        actions={
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            {t("back")}
          </Link>
        }
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-danger/30 bg-[var(--icon-bg-danger)] px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <FormSection title={t("personal")}>
          <Field label={t("firstName")} value={form.first_name} onChange={(v) => set("first_name", v)} required />
          <Field label={t("lastName")} value={form.last_name} onChange={(v) => set("last_name", v)} required />
          <Field label={t("birthDate")} type="date" value={form.birth_date} onChange={(v) => set("birth_date", v)} />
          <Field label={t("birthPlace")} value={form.birth_place} onChange={(v) => set("birth_place", v)} />
          <SelectField label={t("gender")} value={form.gender} onChange={(v) => set("gender", v)} options={[
            { value: "", label: t("select") },
            { value: "male", label: t("male") },
            { value: "female", label: t("female") },
          ]} />
          <Field label={t("nationality")} value={form.nationality} onChange={(v) => set("nationality", v)} />
          <Field label={t("address")} value={form.address} onChange={(v) => set("address", v)} full />
        </FormSection>

        <FormSection title={t("enrollment")}>
          <Field label={t("enrollmentDate")} type="date" value={form.enrollment_date} onChange={(v) => set("enrollment_date", v)} />
          <SelectField label={t("class")} value={form.class_id} onChange={(v) => set("class_id", v)} options={[
            { value: "", label: t("selectClass") },
            ...classes.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` })),
          ]} />
          <SelectField label={t("status")} value={form.status} onChange={(v) => set("status", v)} options={[
            { value: "", label: t("select") },
            { value: "boarding", label: t("boarding") },
            { value: "half_boarding", label: t("halfBoarding") },
            { value: "external", label: t("external") },
          ]} />
          <Field label={t("guardianFirstName")} value={form.guardian_first_name} onChange={(v) => set("guardian_first_name", v)} />
          <Field label={t("guardianLastName")} value={form.guardian_last_name} onChange={(v) => set("guardian_last_name", v)} />
          <Field label={t("guardianPhone")} value={form.guardian_phone} onChange={(v) => set("guardian_phone", v)} />
        </FormSection>

        <FormSection title={t("medical")}>
          <SelectField label={t("bloodType")} value={form.blood_type} onChange={(v) => set("blood_type", v)} options={[
            { value: "", label: t("select") },
            ...["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => ({ value: v, label: v })),
          ]} />
          <Field label={t("medicalNotes")} value={form.medical_notes} onChange={(v) => set("medical_notes", v)} full />
        </FormSection>

        <div className="flex gap-2 border-t border-border pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            {saving ? t("saving") : t("save")}
          </button>
          <Link
            href="/students"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            {t("cancel")}
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

function Field({ label, type = "text", value, onChange, full, required }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; full?: boolean; required?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
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

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-fg">{label}</label>
      <select
        value={value}
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
