"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import type { Message } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function MessageBubble({ message }: { message: Message }) {
  const { user } = useAuth();
  const t = useTranslations("chat");
  const isMine = message.sender_id === user?.id;

  return (
    <div className={cn("flex gap-2 mb-1", isMine ? "justify-end" : "justify-start")}>
      {!isMine && (
        <div className="mt-1 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
          {(message.sender?.email || "?")[0].toUpperCase()}
        </div>
      )}

      <div className={cn("max-w-[75%] space-y-0.5", isMine && "items-end")}>
        {!isMine && (
          <span className="block text-[11px] text-muted">
            {message.sender?.email?.split("@")[0] || t("you")}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isMine
              ? "rounded-br-md bg-accent text-white"
              : "rounded-bl-md bg-bg text-fg"
          )}
        >
          {message.content}
        </div>

        <div className={cn("flex items-center gap-1", isMine ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-muted/60">
            {new Date(message.created_at).toLocaleTimeString("ar-DZ", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}