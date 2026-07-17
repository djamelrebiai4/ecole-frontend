"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, UserPlus, X, Loader2, Pencil } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

const genderMap: Record<string, string> = { male: "مبنى الأولاد", female: "مبنى البنات", mixed: "مختلط" };

export default function RoomDetailPage() {
  const params = useParams<{ number: string }>();
  const { setTitle } = usePageTitle();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.number) return;
    (async () => {
      try {
        const [roomsRes, studentsRes, yearsRes] = await Promise.all([
          api.get<any>("school/rooms", undefined, { silent: true }),
          api.get<any>("school/students", { limit: "200" }, { silent: true }),
          api.get<any>("school/academic-years", undefined, { silent: true }),
        ]);
        const roomsList = Array.isArray(roomsRes) ? roomsRes : (roomsRes as any)?.data ?? [];
        const studentsList = Array.isArray(studentsRes) ? studentsRes : (studentsRes as any)?.data ?? [];
        const yearsList = Array.isArray(yearsRes) ? yearsRes : (yearsRes as any)?.data ?? [];

        setStudents(studentsList);
        setAcademicYears(yearsList);

        const found = roomsList.find((r: any) => r.room_number === params.number);
        if (found) {
          const detail = await api.get<any>(`school/rooms/${found.id}`, undefined, { silent: true });
          setRoom(detail);
          setTitle(`غرفة ${detail.room_number}`);
        }
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [params?.number, setTitle]);

  async function handleRemove(assignmentId: string) {
    setRemoving(assignmentId);
    try {
      await api.delete(`school/room-assignments/${assignmentId}`, { silent: true });
      setRoom((prev: any) => ({
        ...prev,
        room_assignments: prev.room_assignments.filter((a: any) => a.id !== assignmentId),
      }));
    } catch { /* silent */ }
    setRemoving(null);
    setConfirmRemove(null);
  }

  async function handleAssign() {
    if (!selectedStudentId || !room) return;
    setAssigning(true);
    try {
      const currentYear = academicYears.find((y: any) => y.is_current) || academicYears[0];
      if (!currentYear) return;
      await api.post("school/room-assignments", {
        student_id: selectedStudentId,
        room_id: room.id,
        academic_year_id: currentYear.id,
      }, { silent: true });
      const updated = await api.get<any>(`school/rooms/${room.id}`, undefined, { silent: true });
      setRoom(updated);
      setShowAssignModal(false);
      setSelectedStudentId("");
      setSearchQuery("");
    } catch { /* silent */ }
    setAssigning(false);
  }

  if (loading) return <LoadingPage />;
  if (!room) return <p className="py-8 text-center text-sm text-muted">الغرفة غير موجودة</p>;

  const assignments = room.room_assignments || [];
  const occupied = assignments.length;
  const assignedStudentIds = new Set(assignments.map((a: any) => a.student_id));
  const availableStudents = students.filter((s: any) => !assignedStudentIds.has(s.id));
  const filteredStudents = searchQuery
    ? availableStudents.filter((s: any) =>
        `${s.first_name || ""} ${s.last_name || ""} ${s.student_code || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : availableStudents;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "الإقامة", href: "/boarding" },
          { label: `غرفة ${room.room_number}` },
        ]}
      />

      <PageHeader
        title={`غرفة ${room.room_number}`}
        subtitle={`${genderMap[room.gender] || room.gender || ""} · الطابق ${room.floor || "-"} · السعة: ${room.capacity} أسرة`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/boarding/rooms/${room.room_number}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </Link>
            <Link
              href="/boarding"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              رجوع
            </Link>
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold">التلاميذ في الغرفة ({occupied}/{room.capacity})</h3>
          <button
            onClick={() => setShowAssignModal(true)}
            disabled={occupied >= room.capacity}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            إضافة تلميذ
          </button>
        </div>
        <div className="space-y-2 p-4">
          {assignments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">لا يوجد تلاميذ في هذه الغرفة</p>
          ) : (
            assignments.map((a: any, i: number) => {
              const s = a.students;
              const name = s ? `${s.first_name || ""} ${s.last_name || ""}`.trim() : "-";
              return (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--icon-bg-primary)] font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{name}</div>
                      <div className="text-xs text-muted">{s?.student_code || ""}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmRemove(a.id)}
                    className="text-xs text-danger hover:underline"
                  >
                    {removing === a.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "إزالة"
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAssignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => !assigning && setShowAssignModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-fg">إضافة تلميذ إلى الغرفة</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
                className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن تلميذ..."
              className="mb-3 w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              autoFocus
            />

            {filteredStudents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                {searchQuery ? "لا توجد نتائج" : "جميع التلاميذ مسجلون في غرف"}
              </p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {filteredStudents.map((s: any) => {
                  const name = `${s.first_name || ""} ${s.last_name || ""}`.trim();
                  const isSelected = selectedStudentId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm transition hover:bg-bg ${
                        isSelected ? "bg-accent/10 ring-1 ring-accent" : ""
                      }`}
                    >
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[var(--icon-bg-success)] grid place-items-center text-xs font-bold text-success">
                        {(s.first_name?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{name || "-"}</div>
                        <div className="text-xs text-muted">{s.student_code || ""}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg hover:bg-bg disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedStudentId || assigning}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {assigning ? "جارٍ..." : "تسجيل"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={() => setConfirmRemove(null)}
        onConfirm={() => confirmRemove && handleRemove(confirmRemove)}
        title="إزالة تلميذ"
        description="هل أنت متأكد من إزالة هذا التلميذ من الغرفة؟"
        confirmLabel="إزالة"
        cancelLabel="إلغاء"
        variant="danger"
        loading={!!removing}
      />
    </div>
  );
}
