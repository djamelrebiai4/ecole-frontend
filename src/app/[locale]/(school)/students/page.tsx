"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { useAcademicYears } from "@/contexts/AcademicYearContext";

interface StudentRow {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  status: string;
  student_guardians: { guardians: { first_name: string; last_name: string; phone: string } }[];
  student_enrollments: { classes: { name: string } }[];
}

const distLabels: Record<string, string> = {
  boarding: "داخلي",
  half_boarding: "نصف داخلي",
  external: "خارجي",
};

export default function StudentsPage() {
  const t = useTranslations("school.students");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const { setTitle } = usePageTitle();
  const { yearVersion } = useAcademicYears();

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  useEffect(() => {
    setLoading(true);
    api.get<any>(`school/students?page=${page}&limit=${limit}`, undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
        setStudents(list);
        setTotal((res as any)?.count ?? list.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, yearVersion]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? students.filter((s) => {
        const name = `${s.first_name} ${s.last_name}`.toLowerCase();
        const code = s.student_code?.toLowerCase() || "";
        return name.includes(q) || code.includes(q);
      })
    : students;

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <Breadcrumbs items={[{ label: "التلاميذ" }]} />

      <PageHeader
        title={t("title")}
        subtitle={!loading ? `${total} تلميذ` : undefined}
        actions={
          <Link
            href="/students/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Link>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={t("search")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface py-2.5 pe-3 ps-10 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "لا توجد نتائج للبحث" : "لا يوجد تلاميذ بعد"}
          description={q ? "حاول بكلمة بحث مختلفة" : "قم بإضافة أول تلميذ في المنصة"}
          action={
            !q ? (
              <Link
                href="/students/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
              >
                <Plus className="h-4 w-4" />
                إضافة تلميذ
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">رقم القيد</th>
                  <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الاسم الكامل</th>
                  <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الحالة</th>
                  <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الفوج</th>
                  <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">ولي الأمر</th>
                  <th className="border-b border-border px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const g = s.student_guardians?.[0]?.guardians;
                  const guardianName = g ? `${g.first_name} ${g.last_name}` : "";
                  const className = s.student_enrollments?.[0]?.classes?.name || "";
                  return (
                    <tr key={s.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-3 font-semibold tabular-nums">{s.student_code}</td>
                      <td className="border-b border-border px-3 py-3">{s.first_name} {s.last_name}</td>
                      <td className="border-b border-border px-3 py-3">
                        <StatusBadge status={s.status} label={distLabels[s.status] || s.status} />
                      </td>
                      <td className="border-b border-border px-3 py-3">{className}</td>
                      <td className="border-b border-border px-3 py-3">{guardianName}</td>
                      <td className="border-b border-border px-3 py-3">
                        <div className="flex gap-1">
                          <Link href={`/students/${s.id}`} className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">عرض</Link>
                          <Link href={`/students/${s.id}/edit`} className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">تعديل</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <div className="text-sm text-muted">
                الصفحة {page} من {totalPages} ({total} تلميذ)
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
