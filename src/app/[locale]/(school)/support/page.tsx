"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

export default function SupportPage() {
  const t = useTranslations("chat");
  const { startSupportChat, openChat } = useChat();
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setLoading(true);
    try {
      await startSupportChat(subject.trim());
      openChat();
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)] p-6">
        <h2 className="text-lg font-bold tracking-tight mb-2">الدعم الفني</h2>
        <p className="text-sm text-muted mb-5">
          تواصل مع فريق الدعم الفني للمنصة. سيتم الرد عليك في أقرب وقت ممكن.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">موضوع الطلب</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثلاً: مشكلة في عرض التقارير"
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">تفاصيل إضافية (اختياري)</label>
            <textarea
              rows={4}
              placeholder="اشرح المشكلة أو الاستفسار..."
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !subject.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
      </div>
    </div>
  );
}