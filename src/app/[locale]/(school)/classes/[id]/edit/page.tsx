"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, ArrowRight, X, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface StaffAssignment {
  staff_id: string;
  subject_id: string;
  is_primary: boolean;
}

interface FeeAssignment {
  fee_category_id: string;
  amount: number;
  is_required: boolean;
}

export default function EditClassPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cls, setCls] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [existingLevels, setExistingLevels] = useState<string[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", level: "", capacity: "", room_number: "", teaching_start_date: "",
  });
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [feeAssignments, setFeeAssignments] = useState<FeeAssignment[]>([]);

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>(`school/classes/${params.id}`, undefined, { silent: true })
      .then((data) => {
        setCls(data);
        setTitle(`تعديل: ${data.name}`);
        setForm({
          name: data.name || "",
          level: data.level || "",
          capacity: String(data.capacity ?? ""),
          room_number: data.room_number || "",
          teaching_start_date: data.teaching_start_date || "",
        });
        setStaffAssignments(
          (data.class_staff || []).map((cs: any) => ({
            staff_id: cs.staff_id,
            subject_id: cs.subject_id || "",
            is_primary: !!cs.is_primary,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id, setTitle]);

  useEffect(() => {
    api.get<any>("school/staff", { limit: "200" }, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setStaffList(list.filter((s: any) => s.staff_type === "teacher"));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get<any>("school/subjects", undefined, { silent: true })
      .then((res) => setSubjects(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get<any>("school/classes", undefined, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        const levels = Array.from(new Set(
          list.map((c: any) => c.level).filter(Boolean)
        )) as string[];
        setExistingLevels(levels);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get<any>("school/fee-categories", undefined, { silent: true })
      .then((res) => {
        const cats = Array.isArray(res) ? res : res.data ?? [];
        setFeeCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!params?.id) return;
    api.get<any>("school/fee-templates", { class_id: params.id }, { silent: true })
      .then((res) => {
        const templates = Array.isArray(res) ? res : res.data ?? [];
        setFeeAssignments(
          templates.map((t: any) => ({
            fee_category_id: t.fee_category_id,
            amount: Number(t.amount || 0),
            is_required: t.is_required ?? true,
          }))
        );
      })
      .catch(() => {});
  }, [params?.id]);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addStaff(staff: any) {
    if (staffAssignments.some((a) => a.staff_id === staff.id)) return;
    const firstSubject = staff.staff_subjects?.[0]?.subject_id || "";
    setStaffAssignments((prev) => [
      ...prev,
      { staff_id: staff.id, subject_id: firstSubject, is_primary: false },
    ]);
    setShowStaffModal(false);
  }

  function removeStaff(staffId: string) {
    setStaffAssignments((prev) => prev.filter((a) => a.staff_id !== staffId));
  }

  function updateStaff(staffId: string, field: keyof StaffAssignment, value: string | boolean) {
    setStaffAssignments((prev) =>
      prev.map((a) => (a.staff_id === staffId ? { ...a, [field]: value } : a))
    );
  }

  function getStaffSubjects(staffId: string) {
    const staff = staffList.find((s) => s.id === staffId);
    if (!staff?.staff_subjects) return [];
    const ids = staff.staff_subjects.map((ss: any) => ss.subject_id);
    return subjects.filter((s) => ids.includes(s.id));
  }

  function toggleFee(catId: string) {
    const exists = feeAssignments.find((f) => f.fee_category_id === catId);
    if (exists) {
      setFeeAssignments((prev) => prev.filter((f) => f.fee_category_id !== catId));
    } else {
      const cat = feeCategories.find((c) => c.id === catId);
      setFeeAssignments((prev) => [
        ...prev,
        { fee_category_id: catId, amount: Number(cat?.amount || 0), is_required: true },
      ]);
    }
  }

  function updateFeeAmount(catId: string, amount: number) {
    setFeeAssignments((prev) =>
      prev.map((f) => (f.fee_category_id === catId ? { ...f, amount } : f))
    );
  }

  function updateFeeRequired(catId: string, is_required: boolean) {
    setFeeAssignments((prev) =>
      prev.map((f) => (f.fee_category_id === catId ? { ...f, is_required } : f))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`school/classes/${params.id}`, {
        name: form.name,
        level: form.level,
        capacity: Number(form.capacity) || 0,
        room_number: form.room_number,
        teaching_start_date: form.teaching_start_date || null,
        academic_year_id: cls.academic_year_id,
        staff_assignments: staffAssignments.map((a) => ({
          staff_id: a.staff_id,
          subject_id: a.subject_id || undefined,
          is_primary: a.is_primary,
        })),
        fee_assignments: feeAssignments.map((f) => ({
          fee_category_id: f.fee_category_id,
          amount: f.amount,
          is_required: f.is_required,
        })),
      });
      router.push(`/classes/${params.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!cls) {
    return <p className="py-8 text-center text-sm text-muted">الفوج غير موجود</p>;
  }

  const availableStaff = staffList.filter(
    (s) => !staffAssignments.some((a) => a.staff_id === s.id)
  );

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "الأفواج", href: "/classes" },
          { label: cls.name, href: `/classes/${params.id}` },
          { label: "تعديل" },
        ]}
      />

      <PageHeader
        title={`تعديل: ${cls.name}`}
        actions={
          <Link href={`/classes/${params.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">اسم الفوج <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} required onChange={(e) => setField("name", e.target.value)}
                placeholder="مثلاً: السنة الأولى متوسط - أ"
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">المستوى <span className="text-red-500">*</span></label>
              <input
                type="text"
                list="level-list"
                value={form.level}
                required
                onChange={(e) => setField("level", e.target.value)}
                placeholder="اكتب أو اختر مستوى"
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
              <datalist id="level-list">
                {existingLevels.map((l) => (
                  <option key={l} value={l} />
                ))}
                <option value="1 متوسط" />
                <option value="2 متوسط" />
                <option value="3 متوسط" />
                <option value="4 متوسط" />
                <option value="1 ثانوي" />
                <option value="2 ثانوي" />
                <option value="3 ثانوي" />
              </datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">السعة</label>
              <input type="number" value={form.capacity} onChange={(e) => setField("capacity", e.target.value)}
                placeholder="35"
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">رقم الغرفة</label>
              <input type="text" value={form.room_number} onChange={(e) => setField("room_number", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">تاريخ بدء التدريس</label>
              <input type="date" value={form.teaching_start_date} onChange={(e) => setField("teaching_start_date", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-fg">تعيين الأساتذة</h3>
            <button type="button" onClick={() => setShowStaffModal(true)}
              disabled={availableStaff.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" />
              إضافة أستاذ
            </button>
          </div>

          {staffAssignments.length === 0 ? (
            <p className="py-3 text-sm text-muted">لم يتم تعيين أي أستاذ بعد</p>
          ) : (
            <div className="divide-y divide-border">
              {staffAssignments.map((a) => {
                const staff = staffList.find((s) => s.id === a.staff_id);
                const staffSubjects = getStaffSubjects(a.staff_id);
                return (
                  <div key={a.staff_id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[var(--icon-bg-primary)] grid place-items-center text-xs font-bold" style={{ color: "var(--primary)" }}>
                        {(staff?.full_name?.[0] || "?").toUpperCase()}
                      </div>
                      <span className="truncate text-sm font-semibold">{staff?.full_name || "غير معروف"}</span>
                    </div>
                    <select value={a.subject_id}
                      onChange={(e) => updateStaff(a.staff_id, "subject_id", e.target.value)}
                      className="w-36 rounded-lg border-[1.5px] border-border bg-bg px-2.5 py-1.5 text-xs outline-none focus:border-accent">
                      <option value="">-- اختر المادة --</option>
                      {staffSubjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={a.is_primary}
                        onChange={(e) => updateStaff(a.staff_id, "is_primary", e.target.checked)}
                        className="rounded border-border" />
                      رئيسي
                    </label>
                    <button type="button" onClick={() => removeStaff(a.staff_id)}
                      className="rounded-md p-1 text-muted hover:text-danger">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-fg">رسوم الفوج</h3>
            <Link
              href="/fee-categories"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-bg hover:text-fg"
            >
              <Plus className="h-3 w-3" />
              إضافة فئة رسوم
            </Link>
          </div>

          {feeCategories.length === 0 ? (
            <p className="py-3 text-sm text-muted">
              لا توجد فئات رسوم. 
              <Link href="/fee-categories/new" className="mx-1 font-semibold text-accent hover:underline">
                أضف فئة رسوم أولاً
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-border">
              {feeCategories.map((cat) => {
                const assigned = feeAssignments.find((f) => f.fee_category_id === cat.id);
                return (
                  <div key={cat.id} className="flex flex-wrap items-center gap-3 py-3">
                    <label className="flex items-center gap-2 text-sm font-semibold min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={!!assigned}
                        onChange={() => toggleFee(cat.id)}
                        className="rounded border-border accent-accent"
                      />
                      {cat.name}
                    </label>
                    {assigned && (
                      <>
                        <input
                          type="number"
                          value={assigned.amount}
                          onChange={(e) => updateFeeAmount(cat.fee_category_id, Number(e.target.value))}
                          className="w-28 rounded-lg border-[1.5px] border-border bg-bg px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                          placeholder="المبلغ"
                        />
                        <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={assigned.is_required}
                            onChange={(e) => updateFeeRequired(cat.fee_category_id, e.target.checked)}
                            className="rounded border-border"
                          />
                          إجباري
                        </label>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
          <Link href={`/classes/${params.id}`}
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary">
            إلغاء
          </Link>
        </div>
      </form>

      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setShowStaffModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-fg">اختيار أستاذ</h3>
              <button onClick={() => setShowStaffModal(false)}
                className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </div>

            {availableStaff.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">جميع الأساتذة تم تعيينهم</p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {availableStaff.map((s: any) => (
                  <button key={s.id} type="button" onClick={() => addStaff(s)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm transition hover:bg-bg">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[var(--icon-bg-primary)] grid place-items-center text-xs font-bold" style={{ color: "var(--primary)" }}>
                      {(s.full_name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{s.full_name}</div>
                      <div className="text-xs text-muted">
                        {s.staff_subjects?.length
                          ? s.staff_subjects.map((ss: any) => ss.subjects?.name).join("، ")
                          : "لا توجد مواد"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
