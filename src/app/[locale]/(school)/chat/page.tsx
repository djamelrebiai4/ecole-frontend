"use client";

import { useTranslations } from "next-intl";
import { PageTitleProvider } from "@/lib/page-title";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageThread } from "@/components/chat/MessageThread";
import { MessageInput } from "@/components/chat/MessageInput";
import { useChat } from "@/contexts/ChatContext";

function ChatPageInner() {
  const t = useTranslations("chat");
  const { activeConversation } = useChat();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]" style={{ height: "calc(100vh - 180px)" }}>
      {activeConversation ? (
        <div className="flex h-full flex-col">
          <ChatHeader />
          <MessageThread />
          <MessageInput />
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-bold tracking-tight">{t("title")}</h2>
          </div>
          <ConversationList />
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <PageTitleProvider>
      <ChatPageInner />
    </PageTitleProvider>
  );
}