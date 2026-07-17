"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Plus, StickyNote, Trash2, Upload, UserX, X, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

const genderMap: Record<string, string> = { male: "ذكر", female: "أنثى" };

const statusLabels: Record<string, string> = {
  boarding: "داخلي", half_boarding: "نصف داخلي", external: "خارجي",
};

const noteTypeLabels: Record<string, string> = {
  academic: "ملاحظة دراسية",
  behavioral: "ملاحظة سلوكية",
  health: "ملاحظة صحية",
  general: "ملاحظة عامة",
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("school.students.tabs");
  const [student, setStudent] = useState<any>(null);
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTitle } = usePageTitle();

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeForm, setFeeForm] = useState({ fee_category_id: "", amount: "", due_date: "" });
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    Promise.all([
      api.get<any>(`school/students/${params.id}`, undefined, { silent: true }),
      api.get<any>(`school/students/${params.id}/statement`, undefined, { silent: true }),
    ])
      .then(([s, st]) => {
        setStudent(s);
        setStatement(st);
        setTitle(`${s.first_name} ${s.last_name}`);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id, setTitle]);

  useEffect(() => {
    api.get<any>("school/fee-categories", undefined, { silent: true })
      .then((res) => setFeeCategories(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`school/notes?student_id=${params.id}`, undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setNotes(list);
      })
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`school/students/${params.id}/documents`, undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setDocuments(list);
      })
      .catch(() => {})
      .finally(() => setDocumentsLoading(false));
  }, [params?.id]);

  const handleExit = useCallback(async () => {
    if (!student || !params?.id) return;
    setExiting(true);
    try {
      await api.put(`school/students/${params.id}`, {
        is_active: false,
      });
      setStudent((prev: any) => ({ ...prev, is_active: false }));
      setShowExitDialog(false);
    } catch {
    } finally {
      setExiting(false);
    }
  }, [student, params?.id]);

  const handleUpload = useCallback(async (file: File) => {
    if (!params?.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("ecole_token");
      await fetch(`/api/school/students/${params.id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const res = await api.get<any>(`school/students/${params.id}/documents`, undefined, { silent: true });
      setDocuments(Array.isArray(res) ? res : res.data ?? []);
    } catch {
    } finally {
      setUploading(false);
    }
  }, [params?.id]);

  const handleDeleteDoc = useCallback(async (docId: string) => {
    try {
      await api.delete(`school/documents/${docId}`, { silent: true });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
    }
  }, []);

  const handleAddFee = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.id) return;
    setFeeSaving(true);
    try {
      await api.post("school/student-fees", {
        student_id: params.id,
        fee_category_id: feeForm.fee_category_id,
        amount: Number(feeForm.amount),
        due_date: feeForm.due_date || undefined,
      });
      setShowFeeModal(false);
      setFeeForm({ fee_category_id: "", amount: "", due_date: "" });
      const st = await api.get<any>(`school/students/${params.id}/statement`, undefined, { silent: true });
      setStatement(st);
    } catch {
    } finally {
      setFeeSaving(false);
    }
  }, [params?.id, feeForm]);

  const handleDeleteFee = useCallback(async (feeId: string) => {
    setDeletingFeeId(feeId);
    try {
      await api.delete(`school/student-fees/${feeId}`, { silent: true });
      setStatement((prev: any) => prev ? { ...prev, fees: (prev.fees || []).filter((f: any) => f.id !== feeId) } : prev);
    } catch {
    } finally {
      setDeletingFeeId(null);
    }
  }, []);

  const handleApplyClassTemplate = useCallback(async () => {
    const classId = student?.student_enrollments?.[0]?.class_id;
    if (!classId || !params?.id) return;
    setApplyingTemplate(true);
    try {
      await api.post<{ created: number }>(`school/fee-templates/${classId}/apply`, {});
      const st = await api.get<any>(`school/students/${params.id}/statement`, undefined, { silent: true });
      setStatement(st);
    } catch {
    } finally {
      setApplyingTemplate(false);
    }
  }, [student, params?.id]);

  if (loading) return <LoadingPage />;
  if (!student) return <EmptyState icon={UserX} title="التلميذ غير موجود" description="لم نتمكن من العثور على هذا التلميذ" />;

  const st = student;
  const fullName = `${st.first_name || ""} ${st.last_name || ""}`.trim();
  const enrollment = st.student_enrollments?.[0];
  const className = enrollment?.classes?.name || "";
  const guardianLink = st.student_guardians?.[0];
  const guardianName = guardianLink?.guardians
    ? `${guardianLink.guardians.first_name || ""} ${guardianLink.guardians.last_name || ""}`.trim()
    : "";

  const genderLabel = genderMap[st.gender] || st.gender || "-";
  const fees = statement?.fees || [];
  const roomAssignment = st.room_assignments?.[0];

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "التلاميذ", href: "/students" },
          { label: fullName },
        ]}
      />

      <PageHeader
        title={fullName}
        subtitle={`رقم القيد: ${st.student_code}`}
        actions={
          <div className="flex gap-2">
            {st.is_active !== false && (
              <button
                onClick={() => setShowExitDialog(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-[var(--icon-bg-danger)] px-5 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10"
              >
                <UserX className="h-4 w-4" />
                إنهاء التسجيل
              </button>
            )}
            <Link
              href="/students"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              رجوع
            </Link>
          </div>
        }
      />

      <div className="mb-5 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--icon-bg-primary)] text-xl font-bold" style={{ color: "var(--primary)" }}>
            {(st.first_name?.[0] || "").toUpperCase()}{(st.last_name?.[0] || "").toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{fullName}</h2>
              {st.is_active === false && (
                <span className="rounded-full bg-[var(--icon-bg-danger)] px-2.5 py-0.5 text-xs font-semibold text-danger">
                  منتهي التسجيل
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted">
              <span>رمز: {st.student_code}</span>
              <span>
                فوج:{" "}
                {enrollment ? (
                  <Link href={`/classes/${enrollment.class_id}`} className="text-accent hover:underline">
                    {className}
                  </Link>
                ) : (
                  className || "-"
                )}
              </span>
              <StatusBadge status={st.status} label={statusLabels[st.status] || st.status} />
              {(st.status === "boarding" || st.status === "half_boarding") && roomAssignment && (
                <span>
                  <Link href={`/rooms/${roomAssignment.rooms?.id}`} className="text-accent hover:underline">
                    الغرفة: {roomAssignment.rooms?.room_number || "-"}
                  </Link>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="المعلومات الشخصية">
          <Info label="تاريخ الميلاد" value={st.birth_date ? new Date(st.birth_date).toLocaleDateString("ar-DZ") : "-"} />
          <Info label="مكان الميلاد" value={st.birth_place || "-"} />
          <Info label="الجنس" value={genderLabel} />
          <Info label="الجنسية" value={st.nationality || "-"} />
          <Info label="العنوان" value={st.address || "-"} />
          <Info label="تاريخ التسجيل" value={st.enrollment_date ? new Date(st.enrollment_date).toLocaleDateString("ar-DZ") : "-"} />
        </Section>

        <Section title="ولي الأمر">
          <Info label="الاسم" value={guardianName || "-"} />
          <Info label="الهاتف" value={guardianLink?.guardians?.phone || "-"} />
        </Section>

        <Section title="معلومات طبية">
          <Info label="فصيلة الدم" value={st.blood_type || "-"} />
          <Info label="ملاحظات طبية" value={st.medical_notes || "-"} />
        </Section>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-bold">كشف الحساب</h3>
            <div className="flex gap-2">
              {enrollment && (
                <button
                  onClick={handleApplyClassTemplate}
                  disabled={applyingTemplate}
                  className="inline-flex items-center gap-1 rounded-lg border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white disabled:opacity-50"
                >
                  {applyingTemplate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {applyingTemplate ? "جارٍ التطبيق..." : "تطبيق رسوم الفوج"}
                </button>
              )}
              <button
                onClick={() => setShowFeeModal(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-accent-dark"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة رسم
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">الرسم</th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">المبلغ</th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">المدفوع</th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">آخر أجل</th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">الحالة</th>
                  <th className="border-b border-border px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {fees.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted">لا توجد رسوم</td></tr>
                ) : (
                  fees.map((f: any) => (
                    <tr key={f.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5">{f.fee_categories?.name || "-"}</td>
                      <td className="border-b border-border px-3 py-2.5 font-semibold tabular-nums">{Number(f.amount).toLocaleString()}</td>
                      <td className="border-b border-border px-3 py-2.5 tabular-nums">{Number(f.paid_amount || 0).toLocaleString()}</td>
                      <td className="border-b border-border px-3 py-2.5 text-xs text-muted">
                        {f.due_date ? new Date(f.due_date).toLocaleDateString("ar-DZ") : "-"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <button
                          onClick={() => handleDeleteFee(f.id)}
                          disabled={deletingFeeId === f.id}
                          className="rounded p-1 text-muted transition hover:bg-[var(--icon-bg-danger)] hover:text-danger disabled:opacity-30"
                          title="حذف الرسم"
                        >
                          {deletingFeeId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Section
          title="المستندات"
          headerAction={
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-accent-dark disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              رفع مستند
            </button>
          }
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          {documentsLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : documents.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">لا توجد مستندات</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-[var(--bg-subtle)] p-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-[var(--icon-bg-primary)] px-2 py-0.5 text-xs font-medium text-primary">
                        {doc.doc_type || "ملف"}
                      </span>
                      <span className="text-xs text-muted">{new Date(doc.created_at).toLocaleDateString("ar-DZ")}</span>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-accent hover:underline"
                    >
                      {doc.file_url?.split("/").pop() || doc.file_url}
                    </a>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="shrink-0 rounded p-1.5 text-muted hover:bg-[var(--icon-bg-danger)] hover:text-danger"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="الملاحظات"
          headerAction={
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-accent-dark"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة ملاحظة
            </Link>
          }
        >
          {notesLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : notes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">لا توجد ملاحظات</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n: any) => (
                <div key={n.id} className="rounded-lg border border-border/50 bg-[var(--bg-subtle)] p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--icon-bg-primary)] px-2 py-0.5 text-xs font-medium text-primary">
                      <StickyNote className="h-3 w-3" />
                      {noteTypeLabels[n.note_type] || n.note_type}
                    </span>
                    <span className="text-xs text-muted">{new Date(n.created_at).toLocaleDateString("ar-DZ")}</span>
                  </div>
                  <p className="text-sm text-fg">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => !feeSaving && setShowFeeModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">إضافة رسم جديد</h3>
              <button onClick={() => setShowFeeModal(false)} className="rounded p-1 text-muted hover:bg-bg hover:text-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddFee} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-fg">نوع الرسم <span className="text-red-500">*</span></label>
                <select
                  value={feeForm.fee_category_id}
                  required
                   onChange={(e) => { const fc = feeCategories.find((f) => f.id === e.target.value); setFeeForm((f) => ({ ...f, fee_category_id: e.target.value, amount: fc?.amount?.toString() ?? "" })); }}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                >
                  <option value="">-- اختر --</option>
                  {feeCategories.map((fc: any) => (
                    <option key={fc.id} value={fc.id}>{fc.name}</option>
                  ))}
                </select>
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

      <ConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={handleExit}
        title="إنهاء تسجيل التلميذ"
        description={`هل أنت متأكد من إنهاء تسجيل "${fullName}"؟ لن يتم حذف بيانات التلميذ، ولكن سيتم تعطيل حسابه. يمكنك إعادة تفعيله لاحقاً.`}
        confirmLabel="نعم، إنهاء التسجيل"
        cancelLabel="إلغاء"
        variant="danger"
        loading={exiting}
      />
    </div>
  );
}

function Section({ title, children, headerAction }: { title: string; children: React.ReactNode; headerAction?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-base font-bold">{title}</h3>
        {headerAction}
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
