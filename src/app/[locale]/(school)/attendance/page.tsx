"use client";

import { useEffect, useState } from "react";
import { Check, X, Clock, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

const buttons = [
  { key: "present", label: "حاضر", icon: Check, bg: "var(--icon-bg-success)", fg: "var(--success)" },
  { key: "absent", label: "غائب", icon: X, bg: "var(--icon-bg-danger)", fg: "var(--danger)" },
  { key: "excused", label: "بعذر", icon: AlertCircle, bg: "var(--icon-bg-primary)", fg: "var(--info)" },
];

export default function AttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<any>("school/classes")
      .then((res) => setClasses(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const classParam = classFilter !== "all" ? `&class_id=${classFilter}` : "";
    Promise.all([
      api.get<any>(`school/students?limit=200${classParam}`),
      api.get<any>(`school/attendance?date=${date}`),
    ])
      .then(([sRes, att]) => {
        setStudents(Array.isArray(sRes) ? sRes : sRes.data ?? []);
        const attMap: Record<string, string> = {};
        (Array.isArray(att) ? att : att.data ?? []).forEach((a: any) => {
          attMap[a.student_id] = a.status;
        });
        setAttendance(attMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classFilter, date]);

  const setStatus = (id: string, status: string) =>
    setAttendance((a) => ({ ...a, [id]: a[id] === status ? "" : status }));

  const studentList = students.filter((s) => {
    const enrollments = s.student_enrollments || [];
    if (classFilter !== "all") {
      const enrollment = enrollments.find((e: any) => e.class_id === classFilter);
      if (!enrollment) return false;
      return !enrollment.enrollment_date || enrollment.enrollment_date <= date;
    }
    return enrollments.some((e: any) => !e.enrollment_date || e.enrollment_date <= date);
  });

  async function handleSave() {
    setSaving(true);
    try {
      const records = Object.entries(attendance)
        .filter(([, status]) => status)
        .map(([student_id, status]) => ({ student_id, status }));
      await api.post("school/attendance", { date, records });
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="تسجيل الحضور"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "جارٍ الحفظ..." : "حفظ الكل"}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">الفوج</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option value="all">كل الأفواج</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">التاريخ</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        {loading ? (
          <p className="p-5 text-center text-sm text-muted">جاري التحميل...</p>
        ) : studentList.length === 0 ? (
          <p className="p-5 text-center text-sm text-muted">لا يوجد تلاميض في هذا الفوج</p>
        ) : (
          <div className="divide-y divide-border">
            {studentList.map((s) => {
              const enrollments = s.student_enrollments || [];
              const enrollment = classFilter !== "all"
                ? enrollments.find((e: any) => e.class_id === classFilter)
                : enrollments[0];
              const className = enrollment?.classes?.name || "";
              return (
                <div key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold tabular-nums text-muted">{s.student_code}</div>
                    <div>
                      <div className="font-semibold">{s.first_name} {s.last_name}</div>
                      <div className="text-xs text-muted">{className}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {buttons.map((b) => {
                      const Icon = b.icon;
                      const isActive = attendance[s.id] === b.key;
                      return (
                        <button
                          key={b.key}
                          onClick={() => setStatus(s.id, b.key)}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                          style={{
                            background: isActive ? b.bg : "transparent",
                            color: isActive ? b.fg : "var(--muted)",
                            borderColor: isActive ? b.fg : "var(--border)",
                          }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
