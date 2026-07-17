"use client";

import { useChat } from "@/contexts/ChatContext";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { MessageInput } from "./MessageInput";
import { ChatHeader } from "./ChatHeader";
import { X, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function ChatSidebar() {
  const { isOpen, openChat, closeChat, activeConversation, totalUnread } = useChat();
  const t = useTranslations("chat");

  return (
    <>
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-5 end-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-lg transition-all hover:bg-accent-dark hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[101] bg-black/30" onClick={closeChat} />
          <div className="fixed bottom-0 end-0 top-0 z-[102] flex w-full max-w-[400px] flex-col border-s border-border bg-surface shadow-2xl">
            {activeConversation ? (
              <>
                <ChatHeader />
                <MessageThread />
                <MessageInput />
              </>
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="text-base font-bold tracking-tight">{t("title")}</h2>
                  <button onClick={closeChat} className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <ConversationList />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}