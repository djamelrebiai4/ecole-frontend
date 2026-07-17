"use client";

import { useChat } from "@/contexts/ChatContext";
import { X, ArrowRight } from "lucide-react";

const typeLabels: Record<string, string> = {
  direct: "محادثة",
  group: "مجموعة",
  support: "دعم فني",
  announcement: "إعلان",
};

export function ChatHeader() {
  const { activeConversation, setActiveConversation } = useChat();

  if (!activeConversation) return null;

  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3">
      <button
        onClick={() => setActiveConversation(null)}
        className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg"
      >
        <ArrowRight className="h-5 w-5 rtl:rotate-180" />
      </button>

      <div className="flex-1">
        <h3 className="text-sm font-bold text-fg">
          {activeConversation.title || typeLabels[activeConversation.type] || "محادثة"}
        </h3>
        <p className="text-[11px] text-muted">
          {typeLabels[activeConversation.type] || "محادثة"}
        </p>
      </div>
    </div>
  );
}