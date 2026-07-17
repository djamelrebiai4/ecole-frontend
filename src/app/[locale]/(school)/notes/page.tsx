"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, StickyNote, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
}

interface Note {
  id: string;
  note_type: string;
  content: string;
  created_at: string;
  student?: Student;
}

const noteTypeLabels: Record<string, string> = {
  academic: "ملاحظة دراسية",
  behavioral: "ملاحظة سلوكية",
  health: "ملاحظة صحية",
  general: "ملاحظة عامة",
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStudentId, setFilterStudentId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("الملاحظات");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/notes", undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setNotes(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<any>("school/students?limit=200", undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setStudents(list);
      })
      .catch(() => {});
  }, []);

  const filteredNotes = useMemo(() => {
    if (!filterStudentId) return notes;
    return notes.filter((n) => n.student?.id === filterStudentId);
  }, [notes, filterStudentId]);

  if (loading) return <LoadingPage />;

  return (
    <div>
      <Breadcrumbs items={[{ label: "الملاحظات" }]} />

      <PageHeader
        title="الملاحظات"
        actions={
          <Link href="/notes/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            إضافة ملاحظة
          </Link>
        }
      />

      {students.length > 0 && (
        <div className="mb-5">
          <select
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            className="w-full max-w-xs rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
          >
            <option value="">جميع التلاميذ</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} - {s.student_code}
              </option>
            ))}
          </select>
        </div>
      )}

      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={filterStudentId ? "لا توجد ملاحظات لهذا التلميذ" : "لا توجد ملاحظات بعد"}
          description="يمكنك إضافة ملاحظة جديدة من الزر أعلاه"
          action={
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
            >
              <Plus className="h-4 w-4" />
              إضافة ملاحظة
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
              <div className="mb-2 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-accent" />
                <span className="font-semibold">{noteTypeLabels[n.note_type] || "ملاحظة"}</span>
              </div>
              {n.student && (
                <Link
                  href={`/students/${n.student.id}`}
                  className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <User className="h-3 w-3" />
                  {n.student.first_name} {n.student.last_name} - {n.student.student_code}
                </Link>
              )}
              <p className="text-sm text-muted">{n.content}</p>
              <div className="mt-2 text-xs text-muted">{new Date(n.created_at).toLocaleDateString("ar-DZ")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
