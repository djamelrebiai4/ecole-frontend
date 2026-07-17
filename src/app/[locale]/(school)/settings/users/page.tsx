"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

const roleMap: Record<string, string> = {
  director: "مدير", accountant: "محاسب", supervisor: "مشرف", teacher: "أستاذ",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("school/users")
      .then((res) => setUsers(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(id: string) {
    try {
      await api.patch(`school/users/${id}/toggle-active`);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch { /* silent */ }
  }

  return (
    <div>
      <PageHeader
        title="إدارة المستخدمين"
        actions={
          <Link href="/settings/users" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            إضافة مستخدم
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الاسم</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">البريد</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الدور</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الحالة</th>
                <th className="border-b border-border px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">لا يوجد مستخدمون بعد</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-3 font-semibold">{u.full_name}</td>
                    <td className="border-b border-border px-3 py-3 text-muted">{u.email}</td>
                    <td className="border-b border-border px-3 py-3">
                      <span className="rounded-full bg-[var(--icon-bg-primary)] px-2.5 py-0.5 text-xs font-semibold text-primary">{roleMap[u.role] || u.role}</span>
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {u.is_active ? (
                        <span className="rounded-full bg-[var(--icon-bg-success)] px-2.5 py-0.5 text-xs font-semibold text-success">نشط</span>
                      ) : (
                        <span className="rounded-full bg-[var(--icon-bg-danger)] px-2.5 py-0.5 text-xs font-semibold text-danger">معطل</span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      <div className="flex gap-1">
                        <button className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">تعديل</button>
                        <button
                          onClick={() => toggleActive(u.id)}
                          className="inline-flex items-center gap-1.5 rounded border border-danger/30 px-2.5 py-1 text-xs text-danger transition hover:bg-[var(--icon-bg-danger)]"
                        >
                          {u.is_active ? "تعطيل" : "تفعيل"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
