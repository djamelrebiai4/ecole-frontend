"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Briefcase, Users, CheckCircle2, XCircle, BookOpen, Pencil } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

const typeMap: Record<string, string> = {
  teacher: "أستاذ", supervisor: "مشرف", admin_staff: "إداري",
};

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`school/staff/${params.id}`, undefined, { silent: true })
      .then((s) => {
        setStaff(s);
        setTitle(s.full_name || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id, setTitle]);

  if (loading) return <LoadingPage />;
  if (!staff) return <EmptyState icon={Briefcase} title="الموظف غير موجود" description="لم نتمكن من العثور على هذا الموظف" />;

  const st = staff;
  const typeLabel = typeMap[st.staff_type] || st.staff_type;
  const classesCount = st.class_staff?.length || 0;
  const hireDate = st.hire_date ? new Date(st.hire_date).toLocaleDateString("ar-DZ") : "-";

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "الموظفون", href: "/staff" },
          { label: st.full_name },
        ]}
      />

      <PageHeader
        title={st.full_name}
        subtitle={typeLabel}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/staff/${params.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
              تعديل
            </Link>
            <Link
              href="/staff"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              رجوع
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--icon-bg-primary)]">
              <Briefcase className="h-5 w-5" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div className="text-xs text-muted">نوع الموظف</div>
              <div className="text-sm font-bold">{typeLabel}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--icon-bg-primary)]">
              <Users className="h-5 w-5" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div className="text-xs text-muted">الأقسام</div>
              <div className="text-sm font-bold">{classesCount}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: st.is_active !== false ? "var(--icon-bg-success)" : "var(--icon-bg-danger)" }}>
              {st.is_active !== false ? (
                <CheckCircle2 className="h-5 w-5" style={{ color: "var(--success)" }} />
              ) : (
                <XCircle className="h-5 w-5" style={{ color: "var(--danger)" }} />
              )}
            </div>
            <div>
              <div className="text-xs text-muted">الحالة</div>
              <div className="text-sm font-bold">{st.is_active !== false ? "نشط" : "غير نشط"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="المعلومات الشخصية">
          <Info label="التخصص" value={st.specialization || "-"} />
          <Info label="الهاتف" value={st.phone || "-"} />
          <Info label="البريد الإلكتروني" value={st.email || "-"} />
          <Info label="تاريخ التوظيف" value={hireDate} />
        </Section>

        {st.staff_type === "teacher" && (
          <Section title="المواد">
            {(!st.staff_subjects || st.staff_subjects.length === 0) ? (
              <p className="text-sm text-muted">لم يتم تحديد مواد</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {st.staff_subjects.map((ss: any) => (
                  <span key={ss.subject_id} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium">
                    <BookOpen className="h-3.5 w-3.5 text-muted" />
                    {ss.subjects?.name || "مادة"}
                  </span>
                ))}
              </div>
            )}
          </Section>
        )}

        <Section title="الأقسام">
          {classesCount === 0 ? (
            <p className="text-sm text-muted">لا يوجد أقسام مرتبطة بهذا الموظف</p>
          ) : (
            <div className="space-y-2">
              {st.class_staff?.map((cs: any) => (
                <div key={cs.id} className="rounded-lg border border-border bg-bg px-3.5 py-2.5">
                  <div className="text-sm font-semibold text-fg">
                    {cs.classes?.name || "قسم"}
                  </div>
                  {cs.subject && (
                    <div className="text-xs text-muted">{cs.subject}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      <div className="space-y-3 p-5 text-sm">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-muted">{label}</div>
      <div className="font-semibold text-fg">{value}</div>
    </div>
  );
}
