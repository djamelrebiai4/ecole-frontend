"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import type { TeachingRoom, ScheduleSlot, ScheduleBreak } from "@/types/timetable";

const DAY_NAMES = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

interface StaffMember {
  id: string;
  full_name: string;
  specialization: string | null;
  staff_type: string;
  staff_subjects?: { subject_id: string; subjects?: { name: string } }[];
}

export default function RoomTimetablePage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const t = useTranslations();

  const [room, setRoom] = useState<TeachingRoom | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [breaks, setBreaks] = useState<ScheduleBreak[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; level: string | null }[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [pendingRange, setPendingRange] = useState<{ dayOfWeek: number; startTime: string; endTime: string } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState("");

  const teachers = staff.filter((s) => s.staff_type === "teacher");

  const fetchData = useCallback(async () => {
    try {
      const [roomData, scheduleData, classesData, yearsData, staffData, subjectsData] = await Promise.all([
        api.get<TeachingRoom>(`school/teaching-rooms/${roomId}`),
        api.get<{ slots: ScheduleSlot[]; breaks: ScheduleBreak[] }>(`school/teaching-rooms/${roomId}/schedule`),
        api.get<any>("school/classes"),
        api.get<any>("school/academic-years"),
        api.get<any>("school/staff", { limit: "200" }, { silent: true }),
        api.get<any>("school/subjects", undefined, { silent: true }),
      ]);
      setRoom(roomData);
      setSlots(scheduleData.slots);
      setBreaks(scheduleData.breaks);
      setClasses(Array.isArray(classesData) ? classesData : classesData?.data ?? []);
      const staffList = Array.isArray(staffData) ? staffData : staffData?.data ?? [];
      setStaff(staffList);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : subjectsData?.data ?? []);
      const years = Array.isArray(yearsData) ? yearsData : yearsData?.data ?? [];
      const currentYear = years.find((y: any) => y.is_current === true);
      if (currentYear) setCurrentAcademicYearId(currentYear.id);
    } catch {
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectRange = useCallback((dayOfWeek: number, startTime: string, endTime: string) => {
    setPendingRange({ dayOfWeek, startTime, endTime });
    setSelectedClassId("");
    setSelectedStaffId("");
    setSubjectInput("");
    setShowBookingModal(true);
  }, []);

  const selectedTeacherSubjects = subjects.filter((s) => {
    if (!selectedStaffId) return true;
    const teacher = staff.find((st: any) => st.id === selectedStaffId);
    const ids = teacher?.staff_subjects?.map((ss: any) => ss.subject_id) || [];
    return ids.includes(s.id);
  });

  const handleSlotClick = useCallback((slot: ScheduleSlot) => {
    setSelectedSlot(slot);
    setShowEditModal(true);
  }, []);

  async function handleCreateBooking() {
    if (!pendingRange || !selectedClassId || !currentAcademicYearId) return;
    setSaving(true);
    try {
      const selectedSubject = subjects.find((s) => s.id === subjectInput);
      const newSlot = await api.post<ScheduleSlot>("school/schedule-slots", {
        teaching_room_id: roomId,
        class_id: selectedClassId,
        academic_year_id: currentAcademicYearId,
        staff_id: selectedStaffId || null,
        subject_id: subjectInput || null,
        subject: selectedSubject?.name || null,
        day_of_week: pendingRange.dayOfWeek,
        start_time: pendingRange.startTime,
        end_time: pendingRange.endTime,
      });
      setSlots((prev) => [...prev, newSlot]);
      setShowBookingModal(false);
      setPendingRange(null);
      toast.success("تم الحجز بنجاح");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحجز");
    } finally {
      setSaving(false);
    }
  }

  async function handleResizeSlot(id: string, startTime: string, endTime: string) {
    setSaving(true);
    const prev = [...slots];
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, start_time: startTime, end_time: endTime } : s));
    try {
      const updated = await api.put<ScheduleSlot>(`school/schedule-slots/${id}`, {
        start_time: startTime,
        end_time: endTime,
      });
      setSlots((prev) => prev.map((s) => s.id === id ? updated : s));
    } catch (err: any) {
      setSlots(prev);
      toast.error(err.message || "تعارض في الوقت الجديد");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSlot() {
    if (!selectedSlot) return;
    setSaving(true);
    try {
      await api.delete(`school/schedule-slots/${selectedSlot.id}`);
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
      setShowEditModal(false);
      setSelectedSlot(null);
      toast.success("تم حذف الحجز");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!room) {
    return <p className="py-8 text-center text-sm text-muted">القاعة غير موجودة</p>;
  }

  return (
    <div>
      <PageHeader
        title={`جدول القاعة: ${room.name}`}
        subtitle={
          [room.building, room.floor ? `الطابق ${room.floor}` : ""].filter(Boolean).join(" · ") || undefined
        }
        actions={
          <Link
            href="/timetable"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted transition-all hover:bg-bg hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            عودة
          </Link>
        }
      />

      <div className="mb-4 flex items-center gap-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[var(--accent)]" />
          <span>محجوز</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[var(--icon-bg-warning)]" />
          <span>استراحة</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-border bg-bg" />
          <span>متاح</span>
        </div>
        <span className="me-auto text-xs text-muted">اسحب على الخلايا الفارغة لحجز وقت جديد</span>
      </div>

      <TimetableGrid
        slots={slots}
        breaks={breaks}
        roomName={room?.name}
        onSelectRange={handleSelectRange}
        onSlotClick={handleSlotClick}
        onResizeSlot={handleResizeSlot}
      />

      {showBookingModal && pendingRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowBookingModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-bold">حجز جديد</h3>
            <p className="mb-4 text-sm text-muted">
              {DAY_NAMES[pendingRange.dayOfWeek]} · {pendingRange.startTime} - {pendingRange.endTime}
            </p>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">الفوج *</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">اختر فوجاً...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.level ? ` (${c.level})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">الأستاذ</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">اختر أستاذاً...</option>
                {teachers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                    {s.staff_subjects?.length
                      ? ` - ${s.staff_subjects.map((ss: any) => ss.subjects?.name).join("، ")}`
                      : s.specialization ? ` - ${s.specialization}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">المادة</label>
              <select
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">اختر مادة...</option>
                {selectedTeacherSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowBookingModal(false); setPendingRange(null); }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted transition-all hover:bg-bg"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateBooking}
                disabled={saving || !selectedClassId}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "جارٍ الحجز..." : "تأكيد الحجز"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-bold">تفاصيل الحجز</h3>
            <div className="mb-5 space-y-2 text-sm">
              <p><span className="font-semibold text-muted">الفوج:</span> {selectedSlot.class?.name || "-"}</p>
              <p><span className="font-semibold text-muted">الأستاذ:</span> {selectedSlot.staff?.full_name || "-"}</p>
              {(selectedSlot as any).subjects?.name && (
                <p><span className="font-semibold text-muted">المادة:</span> {(selectedSlot as any).subjects.name}</p>
              )}
              {!((selectedSlot as any).subjects?.name) && selectedSlot.subject && (
                <p><span className="font-semibold text-muted">المادة:</span> {selectedSlot.subject}</p>
              )}
              <p>
                <span className="font-semibold text-muted">الوقت:</span>{" "}
                {DAY_NAMES[selectedSlot.day_of_week]} · {selectedSlot.start_time} - {selectedSlot.end_time}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowEditModal(false); setSelectedSlot(null); }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted transition-all hover:bg-bg"
              >
                إغلاق
              </button>
              <button
                onClick={handleDeleteSlot}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "..." : <><Trash2 className="h-4 w-4" /> حذف</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
