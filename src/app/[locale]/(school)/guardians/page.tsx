"use client";

import { useEffect, useState } from "react";
import { Plus, Phone, Mail, User, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CardSkeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface Guardian {
  id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  phone: string;
  email: string;
}

const relMap: Record<string, string> = {
  father: "أب", mother: "أم", guardian: "ولي",
};
const relColor: Record<string, string> = {
  father: "var(--primary)", mother: "var(--accent)", guardian: "var(--info)",
};

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("أولياء الأمور");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/guardians?limit=100", undefined, { silent: true })
      .then((res) => setGuardians(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Breadcrumbs items={[{ label: "أولياء الأمور" }]} />

      <PageHeader
        title="أولياء الأمور"
        subtitle={!loading ? `${guardians.length} ولي أمر` : undefined}
        actions={
          <Link href="/guardians/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            إضافة ولي
          </Link>
        }
      />

      {loading ? (
        <CardSkeleton count={6} />
      ) : guardians.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد أولياء أمور بعد"
          description="قم بإضافة أول ولي أمر في المنصة"
          action={
            <Link
              href="/guardians/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
            >
              <Plus className="h-4 w-4" />
              إضافة ولي أمر
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guardians.map((g) => (
            <Link key={g.id} href={`/guardians/${g.id}`}>
              <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)] transition hover:border-primary">
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--bg-hover)]">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{g.first_name} {g.last_name}</div>
                    <span className="text-xs font-semibold" style={{ color: relColor[g.relationship] || "var(--muted)" }}>
                      {relMap[g.relationship] || g.relationship}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    {g.phone || "-"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    {g.email || "-"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
