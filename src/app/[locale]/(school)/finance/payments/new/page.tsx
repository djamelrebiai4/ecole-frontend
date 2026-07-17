"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

interface FeeItem {
  key: string;
  type: "student_fee" | "template";
  student_fee_id?: string;
  fee_category_id?: string;
  label: string;
  amount: number;
  paid_amount: number;
  remaining: number;
  checked: boolean;
}

export default function NewPaymentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [tuitionAmount, setTuitionAmount] = useState("");
  const [form, setForm] = useState({
    student_id: "", payment_method: "cash", notes: "",
  });

  useEffect(() => {
    api.get<any>("school/students?limit=200")
      .then((res) => setStudents(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.student_id) { setFees([]); return; }
    setLoadingFees(true);
    api.get<any>(`school/students/${form.student_id}/statement`)
      .then((res) => {
        const existing = (res?.fees ?? []) as any[];
        const templates = (res?.available_templates ?? []) as any[];

        const items: FeeItem[] = [
          ...existing.map((f: any) => ({
            key: `fee_${f.id}`,
            type: "student_fee" as const,
            student_fee_id: f.id,
            fee_category_id: f.fee_category_id,
            label: f.fee_categories?.name || "رسم",
            amount: Number(f.amount || 0),
            paid_amount: Number(f.paid_amount || 0),
            remaining: Number(f.amount || 0) - Number(f.paid_amount || 0),
            checked: false,
          })),
          ...templates.map((t: any) => ({
            key: `tmpl_${t.id}`,
            type: "template" as const,
            fee_category_id: t.fee_category_id,
            label: `${t.fee_categories?.name || "رسم"} (من قالب: ${t.classes?.name || ""})`,
            amount: Number(t.amount || 0),
            paid_amount: 0,
            remaining: Number(t.amount || 0),
            checked: false,
          })),
        ];

        setFees(items);
        setFeeAmount("");
        setTuitionAmount("");
      })
      .catch(() => setFees([]))
      .finally(() => setLoadingFees(false));
  }, [form.student_id]);

  const toggleFee = useCallback((key: string) => {
    setFees((prev) => {
      const next = prev.map((f) => f.key === key ? { ...f, checked: !f.checked } : f);
      const total = next.filter((f) => f.checked).reduce((s, f) => s + f.remaining, 0);
      setFeeAmount(total > 0 ? String(total) : "");
      return next;
    });
  }, []);

  const checkedFees = useMemo(() => fees.filter((f) => f.checked), [fees]);
  const totalRemaining = useMemo(() => checkedFees.reduce((s, f) => s + f.remaining, 0), [checkedFees]);
  const numericFeeAmount = Number(feeAmount) || 0;
  const numericTuition = Number(tuitionAmount) || 0;
  const grandTotal = numericFeeAmount + numericTuition;

  const allocations = useMemo(() => {
    const result: { key: string; pay_amount: number }[] = [];
    let leftover = numericFeeAmount;
    const sorted = [...checkedFees].sort((a, b) => a.remaining - b.remaining);
    for (const f of sorted) {
      const pay = Math.min(leftover, f.remaining);
      result.push({ key: f.key, pay_amount: pay });
      leftover -= pay;
      if (leftover <= 0) break;
    }
    return result;
  }, [checkedFees, numericFeeAmount]);

  const allocMap = useMemo(() => Object.fromEntries(allocations.map((a) => [a.key, a.pay_amount])), [allocations]);
  const totalAllocated = allocations.reduce((s, a) => s + a.pay_amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkedFees.length && numericTuition <= 0) {
      setError("الرجاء اختيار رسم أو إدخال ثمن التدريس");
      return;
    }
    setSaving(true);
    setError("");

    const results: { ok: boolean; msg?: string }[] = [];

    for (const item of checkedFees) {
      const pay_amount = allocMap[item.key] || 0;
      if (pay_amount <= 0) continue;

      try {
        const payload: any = {
          student_id: form.student_id,
          amount: pay_amount,
          payment_method: form.payment_method,
          notes: form.notes || undefined,
        };

        if (item.type === "student_fee" && item.student_fee_id) {
          payload.student_fee_id = item.student_fee_id;
        } else if (item.fee_category_id) {
          payload.fee_category_id = item.fee_category_id;
          payload.fee_amount = item.amount;
        }

        await api.post("school/payments", payload);
        results.push({ ok: true });
      } catch (err: any) {
        results.push({ ok: false, msg: `${item.label}: ${err?.message || "فشل"}` });
      }
    }

    if (numericTuition > 0) {
      try {
        await api.post("school/payments", {
          student_id: form.student_id,
          amount: numericTuition,
          payment_method: form.payment_method,
          notes: (form.notes ? form.notes + " | " : "") + "ثمن التدريس",
        });
        results.push({ ok: true });
      } catch (err: any) {
        results.push({ ok: false, msg: `ثمن التدريس: ${err?.message || "فشل"}` });
      }
    }

    const failures = results.filter((r) => !r.ok);
    if (failures.length === 0) {
      router.push("/finance/payments");
    } else {
      setError(failures.map((f) => f.msg).join(" | "));
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="تسجيل دفعة جديدة"
        actions={
          <Link
            href="/finance/payments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
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
              <label className="mb-1.5 block text-sm font-semibold text-fg">التلميذ <span className="text-red-500">*</span></label>
              <select
                value={form.student_id}
                required
                onChange={(e) => { setForm((f) => ({ ...f, student_id: e.target.value })); setError(""); }}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">-- اختر تلميذاً --</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.student_code || ""})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">طريقة الدفع <span className="text-red-500">*</span></label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="cash">نقداً</option>
                <option value="transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
              </select>
            </div>
          </div>
        </div>

        {form.student_id && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
            <h3 className="mb-3 text-sm font-bold text-fg">الرسوم</h3>
            {loadingFees ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل الرسوم...
              </div>
            ) : fees.length === 0 ? (
              <p className="py-4 text-sm text-muted">لا توجد رسوم متاحة لهذا التلميذ</p>
            ) : (
              <div className="space-y-2">
                {fees.map((item) => {
                  const pay_amount = allocMap[item.key];
                  return (
                    <div
                      key={item.key}
                      className={`rounded-lg border p-3 transition ${item.checked ? "border-accent bg-accent/5" : "border-border"}`}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleFee(item.key)}
                          className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-fg">{item.label}</span>
                            {pay_amount > 0 && (
                              <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-bold text-accent">
                                {pay_amount.toLocaleString()} د.ج
                              </span>
                            )}
                          </div>
                          {item.type === "student_fee" ? (
                            <div className="mt-0.5 text-xs text-muted">
                              {Number(item.amount).toLocaleString()} د.ج
                              {item.paid_amount > 0 && (
                                <> | مدفوع: <span className="text-green-600">{Number(item.paid_amount).toLocaleString()} د.ج</span></>
                              )}
                              {item.remaining > 0 && (
                                <> | المتبقي: <span className="text-red-500">{Number(item.remaining).toLocaleString()} د.ج</span></>
                              )}
                            </div>
                          ) : (
                            <div className="mt-0.5 text-xs text-muted">
                              {Number(item.amount).toLocaleString()} د.ج — سيتم إنشاء رسم جديد
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {form.student_id && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
            <h3 className="mb-3 text-sm font-bold text-fg">المبالغ</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="shrink-0 text-sm text-fg" style={{ minWidth: 120 }}>مبلغ الرسوم</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="0"
                  className="w-32 rounded-md border border-border bg-bg px-3 py-2 text-left text-sm outline-none focus:border-accent"
                  min={0}
                />
                <span className="text-sm text-muted">د.ج</span>
                {checkedFees.length > 0 && numericFeeAmount > 0 && (
                  <span className={`mr-auto text-xs ${numericFeeAmount < totalRemaining ? "text-amber-600" : "text-green-600"}`}>
                    {numericFeeAmount >= totalRemaining
                      ? "يغطي جميع الرسوم المختارة ✓"
                      : `المتبقي بعد الدفع: ${(totalRemaining - numericFeeAmount).toLocaleString()} د.ج`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="shrink-0 text-sm text-fg" style={{ minWidth: 120 }}>ثمن التدريس</label>
                <input
                  type="number"
                  value={tuitionAmount}
                  onChange={(e) => setTuitionAmount(e.target.value)}
                  placeholder="0"
                  className="w-32 rounded-md border border-border bg-bg px-3 py-2 text-left text-sm outline-none focus:border-accent"
                  min={0}
                />
                <span className="text-sm text-muted">د.ج</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-accent/10 px-4 py-2.5 text-sm font-bold">
                <span>المجموع الكلي</span>
                <span className="tabular-nums">{grandTotal.toLocaleString()} د.ج</span>
              </div>
              {checkedFees.length > 0 && totalAllocated > 0 && (
                <div className="text-xs text-muted">
                  سيتم توزيع {totalAllocated.toLocaleString()} د.ج على الرسوم المختارة
                  {numericTuition > 0 && `، وتسجيل ${numericTuition.toLocaleString()} د.ج كثمن تدريس`}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">ملاحظات</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || (!checkedFees.length && numericTuition <= 0)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "جارٍ الحفظ..." : "تسجيل الدفعة"}
          </button>
          <Link
            href="/finance/payments"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
