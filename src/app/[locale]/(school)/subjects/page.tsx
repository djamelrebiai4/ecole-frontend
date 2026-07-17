"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen, Pencil, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CardSkeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface Subject {
  id: string;
  name: string;
  coefficient: number;
  is_active: boolean;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("المواد الدراسية");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/subjects", undefined, { silent: true })
      .then((res) => setSubjects(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Breadcrumbs items={[{ label: "المواد الدراسية" }]} />

      <PageHeader
        title="المواد الدراسية"
        actions={
          <Link
            href="/subjects/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            إضافة مادة
          </Link>
        }
      />

      {loading ? (
        <CardSkeleton count={6} />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="لا توجد مواد بعد"
          description="أضف المواد الدراسية التي تقدمها المدرسة"
          action={
            <Link
              href="/subjects/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
            >
              <Plus className="h-4 w-4" />
              إضافة مادة
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--icon-bg-primary)]">
                  <BookOpen className="h-5 w-5" style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{s.name}</div>
                  <span className="text-xs text-muted">
                    {s.is_active ? "نشط" : "غير نشط"} | المعامل: {s.coefficient || 1}
                  </span>
                </div>
                <Link
                  href={`/subjects/${s.id}/edit`}
                  className="rounded p-1.5 text-muted transition hover:bg-[var(--icon-bg-primary)] hover:text-primary"
                  title="تعديل"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
