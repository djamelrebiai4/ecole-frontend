"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { api } from "@/lib/api/client";

export interface Conversation {
  id: string;
  school_id: string;
  type: "direct" | "group" | "announcement" | "support";
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message: { content: string; sender_id: string; created_at: string; sender?: { email: string } } | null;
  last_read_at: string | null;
  muted_until: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file" | "system";
  metadata: Record<string, unknown>;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sender?: { email: string };
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  totalUnread: number;
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  setActiveConversation: (conv: Conversation | null) => void;
  sendMessage: (content: string, type?: string) => Promise<void>;
  loadMessages: (conversationId: string, beforeId?: string) => Promise<Message[]>;
  loadConversations: () => Promise<void>;
  startDirectChat: (otherUserId: string) => Promise<Conversation>;
  startSupportChat: (subject?: string) => Promise<Conversation>;
  startGroupChat: (title: string, participantIds: string[]) => Promise<Conversation>;
  markAsRead: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<Conversation[]>("chat/conversations");
      setConversations(data);
    } catch {}
  }, [user]);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await api.post(`chat/conversations/${conversationId}/read`);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      );
    } catch {}
  }, []);

  const setActiveConversation = useCallback(
    (conv: Conversation | null) => {
      setActive(conv);
      if (conv) markAsRead(conv.id);
    },
    [markAsRead]
  );

  const loadMessages = useCallback(
    async (conversationId: string, beforeId?: string) => {
      if (!user) return [];
      try {
        const params: Record<string, string> = beforeId ? { before_id: beforeId } : {};
        const data = await api.get<Message[]>(`chat/conversations/${conversationId}/messages`, params);
        setMessages(data);
        return data;
      } catch {
        return [];
      }
    },
    [user]
  );

  const sendMessage = useCallback(
    async (content: string, messageType = "text") => {
      if (!activeConversation) return;
      try {
        const msg = await api.post<Message>(
          `chat/conversations/${activeConversation.id}/messages`,
          { content, message_type: messageType }
        );
        setMessages((prev) => [...prev, msg]);
      } catch {}
    },
    [activeConversation]
  );

  const startDirectChat = useCallback(
    async (otherUserId: string) => {
      const conv = await api.post<Conversation>("chat/conversations/direct", { other_user_id: otherUserId });
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setIsOpen(true);
      setActiveConversation(conv);
      await loadMessages(conv.id);
      return conv;
    },
    [loadMessages, setActiveConversation]
  );

  const startSupportChat = useCallback(
    async (subject?: string) => {
      const conv = await api.post<Conversation>("chat/conversations/support", { subject: subject || "دعم فني" });
      setConversations((prev) => [conv, ...prev]);
      setIsOpen(true);
      setActiveConversation(conv);
      await loadMessages(conv.id);
      return conv;
    },
    [loadMessages, setActiveConversation]
  );

  const startGroupChat = useCallback(
    async (title: string, participantIds: string[]) => {
      const conv = await api.post<Conversation>("chat/conversations/group", { title, participant_ids: participantIds });
      setConversations((prev) => [conv, ...prev]);
      setIsOpen(true);
      setActiveConversation(conv);
      await loadMessages(conv.id);
      return conv;
    },
    [loadMessages, setActiveConversation]
  );

  useEffect(() => {
    if (!user) return;
    loadConversations();

    pollTimer.current = setInterval(loadConversations, 15000);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [user, loadConversations]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation?.id]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        totalUnread,
        isOpen,
        openChat,
        closeChat,
        setActiveConversation,
        sendMessage,
        loadMessages,
        loadConversations,
        startDirectChat,
        startSupportChat,
        startGroupChat,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}