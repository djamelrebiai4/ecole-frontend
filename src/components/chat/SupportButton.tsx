"use client";

import { useChat } from "@/contexts/ChatContext";
import { MessageCircle, LifeBuoy } from "lucide-react";

export function SupportButton() {
  const { openChat, startSupportChat, totalUnread } = useChat();

  return (
    <div className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-2">
      <button
        onClick={() => startSupportChat("طلب دعم").then(() => openChat())}
        className="flex items-center gap-2 rounded-xl bg-warning px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-warning/90 hover:scale-105"
      >
        <LifeBuoy className="h-5 w-5" />
        الدعم الفني
      </button>

      <button
        onClick={openChat}
        className="grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-lg transition-all hover:bg-accent-dark hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}