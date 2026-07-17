"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useTranslations } from "next-intl";

export function MessageInput() {
  const { sendMessage } = useChat();
  const t = useTranslations("chat");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    await sendMessage(trimmed);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("typeMessage")}
          rows={1}
          className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none transition focus:border-accent"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent text-white transition hover:bg-accent-dark disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}