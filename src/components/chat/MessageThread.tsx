"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import { MessageBubble } from "./MessageBubble";

export function MessageThread() {
  const { messages, loadMessages, activeConversation } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      bottomRef.current?.scrollIntoView();
    }
  }, [activeConversation?.id]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop === 0 && messages.length > 0) {
      const oldest = messages[0];
      if (oldest) {
        loadMessages(activeConversation!.id, oldest.id);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4"
    >
      {messages.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">لا توجد رسائل بعد</p>
      ) : (
        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
      )}
      <div ref={bottomRef} />
    </div>
  );
}