"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Clock, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api/client";

interface SupportTicket {
  id: string;
  school_id: string;
  type: string;
  title: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: { content: string; created_at: string; sender?: { email: string } } | null;
}

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("chat/conversations")
      .then((data) => {
        const support = (Array.isArray(data) ? data : []).filter((c: any) => c.type === "support");
        setTickets(support);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalTickets = tickets.length;
  const unreadTickets = tickets.filter((t) => (t.unread_count || 0) > 0).length;
  const recentTickets = tickets.filter((t) => {
    const updated = new Date(t.updated_at);
    return Date.now() - updated.getTime() < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div>
      <PageHeader title="الدعم الفني — تذاكر المدارس" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<MessageCircle className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-primary)"
          iconColor="var(--primary)"
          value={loading ? "..." : totalTickets}
          label="إجمالي التذاكر"
        />
        <StatCard
          icon={<AlertCircle className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-danger)"
          iconColor="var(--danger)"
          value={loading ? "..." : unreadTickets}
          label="تذاكر غير مقروءة"
          trend="up"
        />
        <StatCard
          icon={<Clock className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-warning)"
          iconColor="var(--warning)"
          value={loading ? "..." : recentTickets}
          label="آخر 24 ساعة"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الموضوع</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">آخر رسالة</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">غير مقروء</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-muted">لا توجد تذاكر دعم حالياً</td></tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-3 font-semibold">
                      {t.title || "دعم فني"}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-muted truncate max-w-[200px]">
                      {t.last_message?.content || "-"}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {(t.unread_count || 0) > 0 && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          {(t.unread_count || 0)} جديد
                        </span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-muted">
                      {new Date(t.updated_at).toLocaleString("ar-DZ")}
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