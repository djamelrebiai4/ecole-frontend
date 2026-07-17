"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import type { Conversation } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  direct: "مباشر",
  group: "مجموعة",
  support: "دعم",
  announcement: "إعلان",
};

export function ConversationItem({
  conversation,
  onClick,
}: {
  conversation: Conversation;
  onClick: () => void;
}) {
  const { user } = useAuth();
  const isMine = conversation.last_message?.sender_id === user?.id;
  const hasUnread = (conversation.unread_count || 0) > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-start transition-all hover:bg-bg",
        hasUnread && "bg-accent/5"
      )}
    >
      <div
        className={cn(
          "mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-xs font-bold",
          conversation.type === "support"
            ? "bg-warning/10 text-warning"
            : conversation.type === "group"
              ? "bg-primary/10 text-primary"
              : "bg-accent/10 text-accent"
        )}
      >
        {typeLabels[conversation.type]?.charAt(0) || "?"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-fg">
            {conversation.title || typeLabels[conversation.type] || "محادثة"}
          </span>
          <span className="flex-shrink-0 text-[11px] text-muted">
            {conversation.last_message?.created_at
              ? new Date(conversation.last_message.created_at).toLocaleTimeString("ar-DZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] text-muted">
            {conversation.last_message ? (
              <>
                {isMine && <span className="text-[11px] opacity-60">أنت: </span>}
                {conversation.last_message.content}
              </>
            ) : (
              "ابدأ المحادثة..."
            )}
          </span>
          {hasUnread && (
            <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-white">
              {conversation.unread_count! > 9 ? "9+" : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}