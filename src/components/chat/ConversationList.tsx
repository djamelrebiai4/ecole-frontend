"use client";

import { useChat } from "@/contexts/ChatContext";
import { ConversationItem } from "./ConversationItem";

export function ConversationList() {
  const { conversations, setActiveConversation, startSupportChat } = useChat();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="p-3">
        <button
          onClick={() => startSupportChat()}
          className="mb-3 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
        >
          تواصل مع الدعم
        </button>

        <div className="space-y-1">
          {conversations.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">لا توجد محادثات بعد</p>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                onClick={() => setActiveConversation(conv)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}