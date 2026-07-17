"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Users, GraduationCap, Plus, X, Loader2, Search, Trash2, CheckSquare, Square, DollarSign } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

const typeMap: Record<string, string> = { teacher: "أستاذ", supervisor: "مشرف", admin_staff: "إداري" };

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const { setTitle } = usePageTitle();
  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (m: string) => { setSuccessMsg(m); setTimeout(() => setSuccessMsg(""), 3000); };
  const showError = (m: string) => { setErrMsg(m); setTimeout(() => setErrMsg(""), 4000); };

  const [staffList, setStaffList] = useState<any[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);

  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const [paymentStatusData, setPaymentStatusData] = useState<any[]>([]);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeStudent, setFeeStudent] = useState<any>(null);
  const [feeForm, setFeeForm] = useState({ fee_category_id: "", amount: "", due_date: "" });
  const [feeSaving, setFeeSaving] = useState(false);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);
  const [applyingTemplates, setApplyingTemplates] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`school/classes/${params.id}`, undefined, { silent: true })
      .then((data) => {
        setCls(data);
        setTitle(data.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id, setTitle]);

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`school/classes/${params.id}/payment-status`, undefined, { silent: true })
      .then((res) => setPaymentStatusData(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, [params?.id]);

  useEffect(() => {
    api.get<any>("school/fee-categories", undefined, { silent: true })
      .then((res) => setFeeCategories(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get<any>("school/staff", { limit: "200" }, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setStaffList(list.filter((s: any) => s.staff_type === "teacher"));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showStudentModal) return;
    setStudentsLoading(true);
    api.get<any>("school/students", { limit: "500" }, { silent: true })
      .then((res) => {
        setAllStudents(Array.isArray(res) ? res : res.data ?? []);
      })
      .catch(() => showError("فشل تحميل قائمة التلاميذ"))
      .finally(() => setStudentsLoading(false));
  }, [showStudentModal]);

  const students = useMemo(() =>
    cls?.student_enrollments?.filter((e: any) => e.status === "active") || [],
    [cls?.student_enrollments]
  );

  const enrolledIds = useMemo(() => new Set(students.map((e: any) => e.students?.id)), [students]);

  const availableStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allStudents
      .filter((s: any) => !enrolledIds.has(s.id))
      .filter((s: any) => {
        if (!q) return true;
        const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
        return name.includes(q) || (s.student_code || "").toLowerCase().includes(q);
      });
  }, [allStudents, enrolledIds, searchQuery]);

  const allAvailableIds = useMemo(() => availableStudents.map((s: any) => s.id), [availableStudents]);
  const allSelected = availableStudents.length > 0 && allAvailableIds.every((id) => selectedStudents.has(id));

  const classFeeCategoryIds = useMemo(() => new Set((cls?.class_fee_templates || []).map((ft: any) => ft.fee_category_id)), [cls?.class_fee_templates]);

  const paymentStatusMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of paymentStatusData) {
      const filtered = { ...p };
      if (classFeeCategoryIds.size) {
        filtered.fees = (p.fees || []).filter((f: any) => classFeeCategoryIds.has(f.fee_category_id));
        filtered.total_fees = filtered.fees.reduce((s: number, f: any) => s + Number(f.amount), 0);
        filtered.paid_amount = filtered.fees.reduce((s: number, f: any) => s + Number(f.paid_amount), 0);
        filtered.remaining = filtered.total_fees - filtered.paid_amount;
      }
      map[p.student_id] = filtered;
    }
    return map;
  }, [paymentStatusData, classFeeCategoryIds]);
  const classFeeCategories = useMemo(() => feeCategories.filter((fc: any) => classFeeCategoryIds.has(fc.id)), [feeCategories, classFeeCategoryIds]);

  if (loading) return <LoadingPage />;
  if (!cls) return <p className="py-8 text-center text-sm text-muted">الفوج غير موجود</p>;

  const teachers = cls.class_staff || [];
  const assignedIds = new Set(teachers.map((t: any) => t.staff_id));
  const availableStaff = staffList.filter((s: any) => !assignedIds.has(s.id));

  const capacity = cls.capacity || 0;
  const occupancy = capacity > 0 ? Math.round((students.length / capacity) * 100) : 0;
  const remaining = capacity - students.length;
  const occColor = occupancy < 50 ? "var(--success)" : occupancy < 80 ? "#f59e0b" : "var(--danger)";
  const classFeeTemplates = cls.class_fee_templates || [];

  async function handleAssignStaff(staff: any) {
    setSavingStaff(true);
    try {
      const firstSubjectId = staff.staff_subjects?.[0]?.subject_id || "";
      const newAssignment = { staff_id: staff.id, subject_id: firstSubjectId, is_primary: false };
      await api.put(`school/classes/${params.id}`, {
        name: cls.name,
        level: cls.level,
        capacity: cls.capacity,
        room_number: cls.room_number,
        academic_year_id: cls.academic_year_id,
        staff_assignments: [...teachers.map((t: any) => ({ staff_id: t.staff_id, subject_id: t.subject_id || "", is_primary: t.is_primary })), newAssignment],
      }, { silent: true });
      setCls((prev: any) => ({ ...prev, class_staff: [...teachers, { staff: staff, staff_id: staff.id, subject_id: firstSubjectId, is_primary: false, id: `temp_${Date.now()}` }] }));
      setShowStaffModal(false);
      showSuccess("تم تعيين الأستاذ بنجاح");
    } catch { showError("فشل تعيين الأستاذ"); }
    setSavingStaff(false);
  }

  async function handleEnrollStudents() {
    const ids = Array.from(selectedStudents);
    if (ids.length === 0) return;
    if (remaining < ids.length) {
      showError(`لا يمكن إضافة ${ids.length} تلميذ. السعة المتبقية: ${remaining}`);
      return;
    }
    setEnrolling(true);
    try {
      await api.post(`school/classes/${params.id}/enroll`, { student_ids: ids });
      const updated = await api.get<any>(`school/classes/${params.id}`, undefined, { silent: true });
      setCls(updated);
      setShowStudentModal(false);
      setSelectedStudents(new Set());
      setSearchQuery("");
      showSuccess(`تم تسجيل ${ids.length} تلميذ في الفوج`);
    } catch { showError("فشل تسجيل التلاميذ"); }
    setEnrolling(false);
  }

  async function handleRemoveStudent(studentId: string) {
    setRemoving(true);
    try {
      await api.delete(`school/classes/${params.id}/students/${studentId}`);
      const updated = await api.get<any>(`school/classes/${params.id}`, undefined, { silent: true });
      setCls(updated);
      showSuccess("تم إزالة التلميذ من الفوج");
    } catch { showError("فشل إزالة التلميذ"); }
    setRemoving(false);
    setRemovingStudentId(null);
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(allAvailableIds));
    }
  }

  function toggleStudent(id: string) {
    const next = new Set(selectedStudents);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedStudents(next);
  }

  function openFeeModal(studentEnrollment: any) {
    setFeeStudent(studentEnrollment);
    setFeeForm({ fee_category_id: "", amount: "", due_date: "" });
    setShowFeeModal(true);
  }

  async function handleSubmitFee(e: React.FormEvent) {
    e.preventDefault();
    const sid = feeStudent?.students?.id || feeStudent?.student_id;
    if (!sid) return;
    setFeeSaving(true);
    try {
      await api.post("school/student-fees", {
        student_id: sid,
        fee_category_id: feeForm.fee_category_id,
        amount: Number(feeForm.amount),
        due_date: feeForm.due_date || undefined,
      });
      setShowFeeModal(false);
      setFeeStudent(null);
      setFeeForm({ fee_category_id: "", amount: "", due_date: "" });
      const updated = await api.get<any>(`school/classes/${params.id}/payment-status`, undefined, { silent: true });
      setPaymentStatusData(Array.isArray(updated) ? updated : updated.data ?? []);
      showSuccess("تمت إضافة الرسم بنجاح");
    } catch {
      showError("فشل إضافة الرسم");
    } finally {
      setFeeSaving(false);
    }
  }

  async function deleteFee(id: string) {
    try { await api.delete(`school/student-fees/${id}`, { silent: true }); return true; } catch { return false; }
  }

  async function handleDeleteStudentFee(feeId: string) {
    setDeletingFeeId(feeId);
    const ok = await deleteFee(feeId);
    if (!ok) await deleteFee(feeId);
    try {
      const updated = await api.get<any>(`school/classes/${params.id}/payment-status`, undefined, { silent: true });
      setPaymentStatusData(Array.isArray(updated) ? updated : updated.data ?? []);
    } catch {}
    setDeletingFeeId(null);
  }

  async function handleApplyTemplates() {
    if (!classFeeTemplates.length) {
      showError("لا توجد قوالب رسوم لهذا الفوج");
      return;
    }
    setApplyingTemplates(true);
    try {
      const res = await api.post<{ created: number; message?: string }>(`school/fee-templates/${params.id}/apply`, {});
      const updated = await api.get<any>(`school/classes/${params.id}/payment-status`, undefined, { silent: true });
      setPaymentStatusData(Array.isArray(updated) ? updated : updated.data ?? []);
      if (res.created > 0) {
        showSuccess(`تم تطبيق ${res.created} رسم على تلاميذ الفوج`);
      } else {
        showSuccess(res.message || "كل الرسوم موجودة مسبقاً");
      }
    } catch {
      showError("فشل تطبيق رسوم الفوج");
    } finally {
      setApplyingTemplates(false);
    }
  }

  async function handleRemoveStaff(staffId: string) {
    const updated = teachers.filter((t: any) => t.staff_id !== staffId);
    try {
      await api.put(`school/classes/${params.id}`, {
        name: cls.name,
        level: cls.level,
        capacity: cls.capacity,
        room_number: cls.room_number,
        academic_year_id: cls.academic_year_id,
        staff_assignments: updated.map((t: any) => ({ staff_id: t.staff_id, subject_id: t.subject_id || "", is_primary: t.is_primary })),
      }, { silent: true });
      setCls((prev: any) => ({ ...prev, class_staff: updated }));
      showSuccess("تم إزالة الأستاذ");
    } catch { showError("فشل إزالة الأستاذ"); }
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "الأفواج", href: "/classes" },
          { label: cls.name },
        ]}
      />

      <PageHeader
        title={cls.name}
        subtitle={`المستوى: ${cls.level || "-"}`}
         actions={
           <div className="flex gap-2">
             <Link
               href={`/classes/${params.id}/edit`}
               className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
             >
               تعديل
             </Link>
             <Link
               href="/classes"
               className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
             >
               <ArrowRight className="h-4 w-4 rtl:rotate-180" />
               رجوع
             </Link>
           </div>
         }
      />

      {successMsg && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {successMsg}
        </div>
      )}
      {errMsg && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errMsg}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
          <div className="text-sm text-muted">الطاقة الاستيعابية</div>
          <div className="text-xl font-bold">{capacity}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
          <div className="text-sm text-muted">التلاميذ</div>
          <div className="text-xl font-bold">{students.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
          <div className="text-sm text-muted">الأساتذة</div>
          <div className="text-xl font-bold">{teachers.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
          <div className="text-sm text-muted">المقاعد المتبقية</div>
          <div className="text-xl font-bold" style={{ color: occColor }}>{remaining}</div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--border)]">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(occupancy, 100)}%`, backgroundColor: occColor }}
            />
          </div>
        </div>
        <Link
          href={`/classes/${params.id}/payments`}
          className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)] transition hover:border-accent hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-sm text-muted">
            <DollarSign className="h-4 w-4" style={{ color: "var(--accent)" }} />
            مراقبة المدفوعات
          </div>
          <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>
            اضغط للعرض
          </div>
        </Link>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <DollarSign className="h-4 w-4" style={{ color: "var(--accent)" }} />
            رسوم الفوج
          </h3>
          <div className="flex items-center gap-2">
            {classFeeTemplates.length > 0 && (
              <button
                onClick={handleApplyTemplates}
                disabled={applyingTemplates}
                className="inline-flex items-center gap-1 rounded-lg border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white disabled:opacity-50"
              >
                {applyingTemplates ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {applyingTemplates ? "جارٍ التطبيق..." : "تطبيق الرسوم على التلاميذ"}
              </button>
            )}
            <Link
              href={`/classes/${params.id}/edit`}
              className="text-[13px] font-semibold text-accent hover:underline"
            >
              تعديل
            </Link>
          </div>
        </div>
        <div className="divide-y divide-border">
          {classFeeTemplates.length === 0 ? (
            <div className="px-5 py-4 text-sm text-muted">
              لم يتم تحديد رسوم لهذا الفوج بعد.{' '}
              <Link href={`/classes/${params.id}/edit`} className="text-accent hover:underline font-semibold">تعديل الفوج</Link>
            </div>
          ) : (
            classFeeTemplates.map((ft: any) => (
              <div key={ft.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{ft.fee_categories?.name || "رسم"}</span>
                  {ft.is_required && (
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">إجباري</span>
                  )}
                </div>
                <span className="text-sm font-bold">{Number(ft.amount).toLocaleString()} د.ج</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> الأساتذة
            </h3>
            <button
              onClick={() => setShowStaffModal(true)}
              disabled={availableStaff.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة أستاذ
            </button>
          </div>
          <div className="divide-y divide-border">
            {teachers.length === 0 ? (
              <p className="p-5 text-sm text-muted">لا يوجد أساتذة</p>
            ) : (
              teachers.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-[var(--icon-bg-primary)] grid place-items-center text-xs font-bold" style={{ color: "var(--primary)" }}>
                    {(t.staff?.full_name?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{t.staff?.full_name || "-"}</div>
                    <div className="text-xs text-muted">{t.subjects?.name || t.subject || typeMap[t.staff?.staff_type] || t.staff?.staff_type}</div>
                  </div>
                  {t.is_primary && <StatusBadge status="active" label="رئيسي" />}
                  <button
                    onClick={() => handleRemoveStaff(t.staff_id)}
                    className="rounded-md p-1 text-muted hover:text-danger"
                    title="إزالة"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4" /> التلاميذ
            </h3>
            <button
              onClick={() => setShowStudentModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة تلميذ لهذا الفوج
            </button>
          </div>
          <div className="divide-y divide-border">
            {students.length === 0 ? (
              <p className="p-5 text-sm text-muted">لا يوجد تلاميذ</p>
            ) : (
              students.map((e: any) => {
                const s = e.students;
                const ps = paymentStatusMap[s?.id];
                const isRemoving = removingStudentId === e.students?.id;
                return (
                  <div key={e.id}>
                    <div className="flex items-center gap-3 px-5 py-3 text-sm">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[var(--icon-bg-success)] grid place-items-center text-xs font-bold" style={{ color: "var(--success)" }}>
                        {s?.first_name?.[0] || "?"}
                      </div>
                       <div className="min-w-0 flex-[2]">
                         <Link href={`/students/${s?.id}`} className="font-semibold hover:text-accent">
                           {s ? `${s.first_name || ""} ${s.last_name || ""}`.trim() : "-"}
                         </Link>
                         <div className="text-xs text-muted">{s?.student_code || ""}</div>
                       </div>
                      {ps ? (
                        <div className="flex items-center gap-3 text-xs" dir="ltr">
                          <span className="tabular-nums font-semibold">{Number(ps.total_fees).toLocaleString()} د.ج</span>
                          <span className="text-muted">|</span>
                          <span className="tabular-nums" style={{ color: "var(--success)" }}>{Number(ps.paid_amount).toLocaleString()} د.ج</span>
                          <span className="text-muted">|</span>
                          <span className="tabular-nums font-semibold" style={{ color: ps.remaining > 0 ? "var(--danger)" : "var(--success)" }}>
                            {Number(ps.remaining).toLocaleString()} د.ج
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                      <StatusBadge status={s?.gender === "female" ? "info" : "neutral"} label={s?.gender === "male" ? "ذكر" : "أنثى"} />
                      {removingStudentId === s?.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveStudent(s.id)}
                            disabled={removing}
                            className="rounded-md bg-danger/10 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/20"
                          >
                            {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : "تأكيد"}
                          </button>
                          <button
                            onClick={() => setRemovingStudentId(null)}
                            className="rounded-md px-2 py-1 text-xs text-muted hover:bg-bg"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRemovingStudentId(s?.id)}
                          className="rounded-md p-1 text-muted hover:text-danger"
                          title="إزالة من الفوج"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="border-t border-border/50 mx-5 mb-2" />
                    <div className="px-5 pb-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted">الرسوم</span>
                        <button
                          onClick={() => openFeeModal(e)}
                          className="inline-flex items-center gap-1 rounded-md border border-accent/30 px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                          إضافة رسم
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ps?.fees?.length > 0 ? ps.fees.map((fee: any) => {
                          const statusColor =
                            fee.status === "paid" ? "var(--success)" :
                            fee.status === "partial" ? "#f59e0b" :
                            fee.status === "overdue" ? "var(--danger)" : "var(--muted)";
                          return (
                            <div
                              key={fee.id}
                              className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-bg/50 px-2 py-1 text-[11px]"
                            >
                              <span className="font-semibold text-fg">{fee.fee_category_name}</span>
                              <span className="text-muted">|</span>
                              <span className="tabular-nums font-semibold">{Number(fee.amount).toLocaleString()} د.ج</span>
                              {fee.paid_amount > 0 && (
                                <span className="tabular-nums" style={{ color: "var(--success)" }}>
                                  {Number(fee.paid_amount).toLocaleString()} د.ج
                                </span>
                              )}
                              {fee.remaining > 0 && (
                                <span className="tabular-nums font-semibold" style={{ color: "var(--danger)" }}>
                                  {Number(fee.remaining).toLocaleString()} د.ج
                                </span>
                              )}
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
                              {fee.status !== "paid" && (
                                <button
                                  onClick={() => handleDeleteStudentFee(fee.id)}
                                  disabled={deletingFeeId === fee.id}
                                  className="mr-0.5 rounded p-0.5 text-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
                                  title="حذف الرسم"
                                >
                                  {deletingFeeId === fee.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                </button>
                              )}
                            </div>
                          );
                        }) : (
                          <span className="text-xs text-muted">لا توجد رسوم لهذا التلميذ</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showStaffModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => !savingStaff && setShowStaffModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-fg">تعيين أستاذ</h3>
              <button
                onClick={() => setShowStaffModal(false)}
                disabled={savingStaff}
                className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {availableStaff.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">جميع الأساتذة معينون في هذا الفوج</p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {availableStaff.map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAssignStaff(s)}
                    disabled={savingStaff}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm transition hover:bg-bg disabled:opacity-50"
                  >
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[var(--icon-bg-primary)] grid place-items-center text-xs font-bold" style={{ color: "var(--primary)" }}>
                      {(s.full_name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{s.full_name}</div>
                      <div className="text-xs text-muted">
                        {s.staff_subjects?.length
                          ? s.staff_subjects.map((ss: any) => ss.subjects?.name).join("، ")
                          : s.specialization || ""}
                      </div>
                    </div>
                    {savingStaff && <Loader2 className="me-1 h-4 w-4 animate-spin text-muted" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showFeeModal && feeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => !feeSaving && setShowFeeModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                إضافة رسم لـ {feeStudent.students ? `${feeStudent.students.first_name || ""} ${feeStudent.students.last_name || ""}`.trim() : "التلميذ"}
              </h3>
              <button onClick={() => setShowFeeModal(false)} className="rounded p-1 text-muted hover:bg-bg hover:text-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitFee} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-fg">نوع الرسم <span className="text-red-500">*</span></label>
                {classFeeCategories.length === 0 ? (
                  <p className="text-sm text-muted">لا توجد رسوم متاحة لهذا الفوج. أضف رسوماً أولاً من صفحة تعديل الفوج.</p>
                ) : (
                  <select
                    value={feeForm.fee_category_id}
                    required
                    onChange={(e) => {
                      const fc = classFeeCategories.find((f) => f.id === e.target.value);
                      setFeeForm((f) => ({ ...f, fee_category_id: e.target.value, amount: fc?.amount?.toString() ?? "" }));
                    }}
                    className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                  >
                    <option value="">-- اختر --</option>
                    {classFeeCategories.map((fc: any) => (
                      <option key={fc.id} value={fc.id}>{fc.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-fg">المبلغ (د.ج) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={feeForm.amount}
                  required
                  min={1}
                  onChange={(e) => setFeeForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-fg">آخر أجل</label>
                <input
                  type="date"
                  value={feeForm.due_date}
                  onChange={(e) => setFeeForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={feeSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                >
                  {feeSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {feeSaving ? "جارٍ الحفظ..." : "إضافة"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  disabled={feeSaving}
                  className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => !enrolling && setShowStudentModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-fg">إضافة تلاميذ للفوج</h3>
              <button
                onClick={() => setShowStudentModal(false)}
                disabled={enrolling}
                className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو رمز التسجيل..."
                className="w-full rounded-lg border border-border bg-bg py-2.5 pr-10 text-sm text-fg outline-none transition focus:border-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              </div>
            ) : availableStudents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                {searchQuery ? "لا توجد نتائج للبحث" : "جميع التلاميذ مسجلون في هذا الفوج"}
              </p>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span>{availableStudents.length} تلميذ متاح</span>
                  <button
                    onClick={toggleSelectAll}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-bg hover:text-fg"
                  >
                    {allSelected ? <Square className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
                    {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                  </button>
                </div>
                <div className="mb-3 max-h-64 space-y-1 overflow-y-auto">
                  {availableStudents.map((s: any) => {
                    const name = `${s.first_name || ""} ${s.last_name || ""}`.trim();
                    const checked = selectedStudents.has(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleStudent(s.id)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-bg"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-border accent-accent pointer-events-none"
                        />
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[var(--icon-bg-success)] grid place-items-center text-xs font-bold" style={{ color: "var(--success)" }}>
                          {s.first_name?.[0] || "?"}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{name}</div>
                          <div className="text-xs text-muted">{s.student_code || ""}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleEnrollStudents}
                  disabled={selectedStudents.size === 0 || enrolling}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                >
                  {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                  إضافة المحددين ({selectedStudents.size})
                  {remaining > 0 && <span className="opacity-70">| السعة المتبقية {remaining}</span>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
