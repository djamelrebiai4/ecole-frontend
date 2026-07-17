"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Phone, Mail, UserX, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

const relMap: Record<string, string> = {
  father: "أب", mother: "أم", guardian: "ولي",
};
const relColor: Record<string, string> = {
  father: "var(--primary)", mother: "var(--accent)", guardian: "var(--info)",
};

export default function GuardianDetailPage() {
  const params = useParams<{ id: string }>();
  const [guardian, setGuardian] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`school/guardians/${params.id}`, undefined, { silent: true })
      .then((res) => {
        setGuardian(res);
        setTitle(`${res.first_name} ${res.last_name}`);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id, setTitle]);

  if (loading) return <LoadingPage />;
  if (!guardian) return <EmptyState icon={UserX} title="ولي الأمر غير موجود" description="لم نتمكن من العثور على ولي الأمر هذا" />;

  const g = guardian;
  const fullName = `${g.first_name || ""} ${g.last_name || ""}`.trim();
  const studentGuardians: any[] = g.student_guardians || [];
  const relationship = relMap[g.relationship] || g.relationship;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "أولياء الأمور", href: "/guardians" },
          { label: fullName },
        ]}
      />

      <PageHeader
        title={fullName}
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

      <div className="mb-5 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full text-xl font-bold" style={{ backgroundColor: "var(--bg-hover)", color: relColor[g.relationship] || "var(--muted)" }}>
            {(g.first_name?.[0] || "").toUpperCase()}{(g.last_name?.[0] || "").toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{fullName}</h2>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: "var(--icon-bg-primary)", color: relColor[g.relationship] || "var(--muted)" }}>
                {relationship}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="معلومات الاتصال">
          <div>
            <div className="mb-0.5 flex items-center gap-1.5 text-muted">
              <Phone className="h-3.5 w-3.5" />
              الهاتف
            </div>
            <div className="font-semibold text-fg">{g.phone || "-"}</div>
          </div>
          <div>
            <div className="mb-0.5 flex items-center gap-1.5 text-muted">
              <Mail className="h-3.5 w-3.5" />
              البريد الإلكتروني
            </div>
            <div className="font-semibold text-fg">{g.email || "-"}</div>
          </div>
        </Section>

        <Section title="التلاميذ المرتبطون">
          {studentGuardians.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">لا يوجد تلاميذ مرتبطون</p>
          ) : (
            <div className="space-y-3">
              {studentGuardians.map((sg: any) => {
                const s = sg.students;
                if (!s) return null;
                return (
                  <Link
                    key={sg.id}
                    href={`/students/${s.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-[var(--bg-subtle)] p-3 transition hover:border-primary"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--icon-bg-primary)]">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-fg">{s.first_name} {s.last_name}</div>
                      <div className="text-xs text-muted">
                        {sg.is_primary ? "ولي أمر رئيسي" : "ولي أمر ثانوي"}
                      </div>
                    </div>
                  </Link>
                );
              })}
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
