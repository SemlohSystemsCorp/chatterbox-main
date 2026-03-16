"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  X,
  MessageSquare,
  Search,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { SearchModal } from "@/components/modals/search-modal";
import { ChatSidebar, type SidebarCall } from "@/components/chat/chat-sidebar";
import { MessageComposer } from "@/components/chat/message-composer";
import {
  MessageContent,
  MessageReactions,
  HoverActions,
  EditBox,
  ThreadReplies,
  SystemMessage,
  parseSystemMessage,
  type MessageCallbacks,
} from "@/components/chat/message-components";
import { createClient } from "@/lib/supabase/client";
import { showPushNotification } from "@/lib/notifications";
import { MemberProfileCard } from "@/components/chat/member-profile-card";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { usePresence } from "@/hooks/use-presence";
import { useTyping } from "@/hooks/use-typing";
import {
  MediaPreviewModal,
  type MediaType,
} from "@/components/modals/media-preview-modal";
import {
  formatTime,
  formatDate,
  shouldShowDate,
  isGrouped,
  getInitials,
  type BoxData,
  type SidebarChannel,
  type MemberData,
  type MessageData,
  type ReactionData,
  type ReadCursor,
  type UserData,
} from "@/lib/chat-helpers";

// ── Types ──

interface Participant {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  username?: string;
}

interface ConversationData {
  id: string;
  short_id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  updated_at: string;
  participants: Participant[];
}

interface ActiveCallData {
  id: string;
  room_name: string;
  started_by: string;
  started_at: string;
}

interface DmPageClientProps {
  user: UserData;
  boxes: BoxData[];
  box: (BoxData & { description: string | null }) | null;
  channels: SidebarChannel[];
  members: MemberData[];
  conversation: ConversationData;
  initialMessages: MessageData[];
  initialReadCursors: ReadCursor[];
  activeCall?: ActiveCallData | null;
  activeCalls?: SidebarCall[];
}

function getConversationName(
  convo: ConversationData,
  currentUserId: string
): string {
  if (convo.name) return convo.name;
  const others = convo.participants.filter((p) => p.user_id !== currentUserId);
  if (others.length === 0) return "Saved Messages";
  return others.map((p) => p.full_name || p.email).join(", ");
}

// ── Component ──

export function DmPageClient({
  user,
  boxes,
  box,
  channels,
  members,
  conversation,
  initialMessages,
  initialReadCursors,
  activeCall,
  activeCalls,
}: DmPageClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [dmLoading, setDmLoading] = useState<string | null>(null);
  const [readCursors, setReadCursors] = useState<ReadCursor[]>(initialReadCursors);
  const markAsReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Refs to avoid stale closures in realtime handlers
  const showScrollDownRef = useRef(showScrollDown);
  const markAsReadRef = useRef<() => void>(() => {});
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length >= 50);
  const [newMsgCount, setNewMsgCount] = useState(0);

  // Modals
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // Reply
  const [replyingTo, setReplyingTo] = useState<MessageData | null>(null);

  // Media preview
  const [mediaPreview, setMediaPreview] = useState<{
    url: string;
    type: MediaType;
    fileName?: string;
  } | null>(null);

  const otherParticipants = conversation.participants.filter(
    (p) => p.user_id !== user.id
  );
  const displayName = getConversationName(conversation, user.id);

  // ── Presence & typing ──
  const presenceRoom = box ? `box-${box.id}` : `dm-${conversation.id}`;
  const { getStatus } = usePresence(presenceRoom, user.id, user.fullName);
  const { typingUsers, broadcastTyping, stopTyping } = useTyping(
    `dm-${conversation.id}`,
    user.id,
    user.fullName
  );

  // ── File upload ──
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<
    { url: string; file_name: string; file_type: string; file_size: number }[]
  >([]);

  // ── Call ──
  const [startingCall, setStartingCall] = useState(false);

  async function handleStartCall() {
    setStartingCall(true);
    try {
      const res = await fetch("/api/calls/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversation.id }),
      });
      const data = await res.json();
      if (data.call) {
        const returnTo = `/dm/${conversation.short_id}${box ? `?box=${box.short_id}` : ""}`;
        router.push(
          `/call/${data.call.id}?returnTo=${encodeURIComponent(returnTo)}&token=${encodeURIComponent(data.token)}`
        );
      }
    } finally {
      setStartingCall(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setAttachments((prev) => [
          ...prev,
          {
            url: data.url,
            file_name: data.file_name,
            file_type: data.file_type,
            file_size: data.file_size,
          },
        ]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (res.ok) {
            setAttachments((prev) => [
              ...prev,
              {
                url: data.url,
                file_name: data.file_name,
                file_type: data.file_type,
                file_size: data.file_size,
              },
            ]);
          }
        } finally {
          setUploading(false);
        }
        break;
      }
    }
  }

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Scroll to bottom on mount (instant, no animation)
  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (!didInitialScroll.current && messages.length > 0) {
      scrollToBottom("instant");
      didInitialScroll.current = true;
    }
  }, [messages.length, scrollToBottom]);

  // Auto-scroll on new messages only when user is near the bottom
  const prevMsgCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMsgCount.current && !showScrollDownRef.current) {
      scrollToBottom();
    }
    prevMsgCount.current = messages.length;
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      const len = editInputRef.current?.value.length ?? 0;
      editInputRef.current?.setSelectionRange(len, len);
    }
  }, [editingId]);

  // ── Realtime ──
  useEffect(() => {
    const supabase = createClient();

    const subscription = supabase
      .channel(`dm-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            content: string;
            created_at: string;
            edited_at: string | null;
            sender_id: string;
            parent_message_id: string | null;
          };

          // Always fetch the real profile from DB for correct sender name
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url, username")
            .eq("id", newMsg.sender_id)
            .single();

          const sender = profile ?? {
            id: newMsg.sender_id,
            full_name: "",
            email: "",
            avatar_url: null,
          };

          if (newMsg.sender_id === user.id) {
            // Replace only the FIRST temp message (fixes rapid-fire send)
            setMessages((prev) => {
              let replaced = false;
              const result = prev.map((m) => {
                if (!replaced && m.id.startsWith("temp-") && m.sender_id === user.id) {
                  replaced = true;
                  return { ...m, id: newMsg.id, created_at: newMsg.created_at, sender };
                }
                return m;
              });
              if (replaced) return result;
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, reactions: [], sender }];
            });
            return;
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, reactions: [], sender }];
          });

          // Desktop notification for DMs from others
          const senderName = sender.full_name || sender.email || "Someone";
          showPushNotification({
            title: senderName,
            body: newMsg.content.slice(0, 120),
            tag: `dm-${conversation.id}`,
            url: `/dm/${conversation.id}`,
            avatarUrl: sender.avatar_url,
          });

          // Track new messages while scrolled up
          if (showScrollDownRef.current) {
            setNewMsgCount((c) => c + 1);
          } else {
            markAsReadRef.current();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            content: string;
            edited_at: string | null;
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? {
                    ...m,
                    content: updated.content,
                    edited_at: updated.edited_at,
                  }
                : m
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversation.id, user.id]);

  // ── Mark as read (throttled) ──
  const markAsRead = useCallback(() => {
    if (markAsReadTimer.current) return;
    markAsReadTimer.current = setTimeout(() => {
      markAsReadTimer.current = null;
    }, 2000);

    const last = messages[messages.length - 1];
    if (!last || last.id.startsWith("temp-")) return;

    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversation.id,
        timestamp: last.created_at,
      }),
    });
  }, [messages, conversation.id]);

  // Keep refs in sync for realtime handlers
  showScrollDownRef.current = showScrollDown;
  markAsReadRef.current = markAsRead;

  // Mark as read on mount
  useEffect(() => {
    if (messages.length > 0) markAsRead();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Mark as read on visibility change
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && !showScrollDown) {
        markAsRead();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [markAsRead, showScrollDown]);

  // Track scroll position for "scroll to bottom" button + load older messages
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = distFromBottom <= 200;
      setShowScrollDown(!atBottom);
      if (atBottom) {
        markAsRead();
        setNewMsgCount(0);
      }
      if (el.scrollTop < 100) {
        loadOlderMessages();
      }
    }
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [markAsRead]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load older messages
  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    const oldest = messages[0];
    try {
      const res = await fetch(
        `/api/messages/history?conversation_id=${conversation.id}&before=${encodeURIComponent(oldest.created_at)}&limit=50`
      );
      const data = await res.json();
      if (data.messages?.length) {
        const el = scrollContainerRef.current;
        const prevHeight = el?.scrollHeight ?? 0;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter(
            (m: MessageData) => !existingIds.has(m.id)
          );
          return [...newMsgs.map((m: MessageData) => ({ ...m, reactions: m.reactions ?? [] })), ...prev];
        });

        requestAnimationFrame(() => {
          if (el) {
            el.scrollTop = el.scrollHeight - prevHeight;
          }
        });
      }
      setHasMore(data.hasMore ?? false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages, conversation.id]);

  // ── Realtime read cursors ──
  useEffect(() => {
    const supabase = createClient();

    const cursorSub = supabase
      .channel(`dm-cursors-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "read_cursors",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const cursor = payload.new as ReadCursor;
          if (!cursor.user_id) return;
          setReadCursors((prev) =>
            prev.some((c) => c.user_id === cursor.user_id)
              ? prev.map((c) =>
                  c.user_id === cursor.user_id ? cursor : c
                )
              : [...prev, cursor]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cursorSub);
    };
  }, [conversation.id]);

  // ── Send ──
  const sendCounterRef = useRef(0);
  async function handleSend() {
    const content = newMessage.trim();
    const hasAttachments = attachments.length > 0;
    if ((!content && !hasAttachments) || sending) return;

    const savedMessage = newMessage; // Save for rollback
    const replyMsg = replyingTo;
    stopTyping();
    setSending(true);
    setNewMessage("");
    setReplyingTo(null);

    // Build full content with attachment URLs
    const parts: string[] = [];
    if (content) parts.push(content);
    for (const a of attachments) {
      parts.push(a.url);
    }
    const fullContent = parts.join("\n");
    const sentAttachments = [...attachments];
    setAttachments([]);

    const supabase = createClient();

    const tempId = `temp-${Date.now()}-${++sendCounterRef.current}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: fullContent,
        created_at: new Date().toISOString(),
        edited_at: null,
        sender_id: user.id,
        parent_message_id: replyMsg?.id ?? null,
        reactions: [],
        sender: {
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          avatar_url: user.avatarUrl,
        },
      },
    ]);

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: fullContent,
        parent_message_id: replyMsg?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setAttachments(sentAttachments);
      setNewMessage(savedMessage); // Restore typed message
      setReplyingTo(replyMsg);
    } else if (inserted) {
      if (sentAttachments.length > 0) {
        await supabase.from("attachments").insert(
          sentAttachments.map((a) => ({
            message_id: inserted.id,
            file_url: a.url,
            file_name: a.file_name,
            file_type: a.file_type,
            file_size: a.file_size,
          }))
        );
      }

      // Send DM notification to other participants (fire-and-forget)
      const recipientIds = conversation.participants
        .map((p) => p.user_id)
        .filter((id) => id !== user.id);
      if (recipientIds.length > 0) {
        const convoName = getConversationName(conversation, user.id);
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_ids: recipientIds,
            type: "dm",
            title: `${user.fullName} sent you a message`,
            body: fullContent.slice(0, 200),
            conversation_id: conversation.id,
            message_id: inserted.id,
          }),
        }).catch(() => {});
      }
    }

    setSending(false);
    inputRef.current?.focus();
  }

  // ── Edit ──
  async function handleEditSave() {
    if (!editingId || !editContent.trim()) return;
    const supabase = createClient();

    const msgId = editingId;
    const original = messages.find((m) => m.id === msgId);
    const trimmed = editContent.trim();

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, content: trimmed, edited_at: new Date().toISOString() }
          : m
      )
    );
    setEditingId(null);

    const { error } = await supabase
      .from("messages")
      .update({ content: trimmed, edited_at: new Date().toISOString() })
      .eq("id", msgId);

    if (error && original) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? original : m))
      );
    }
  }

  // ── React to message ──
  async function handleReaction(messageId: string, emoji: string) {
    const existing = messages
      .find((m) => m.id === messageId)
      ?.reactions.find((r) => r.emoji === emoji && r.user_id === user.id);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.filter(
              (r) => !(r.emoji === emoji && r.user_id === user.id)
            ),
          };
        }
        return {
          ...m,
          reactions: [...m.reactions, { emoji, user_id: user.id }],
        };
      })
    );

    await fetch("/api/messages/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, emoji }),
    });
  }

  // ── Delete ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(msgId: string) {
    const supabase = createClient();
    const original = messages.find((m) => m.id === msgId);
    const originalIndex = messages.findIndex((m) => m.id === msgId);

    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setConfirmDeleteId(null);

    const { error } = await supabase.from("messages").delete().eq("id", msgId);

    if (error && original) {
      setMessages((prev) => {
        const copy = [...prev];
        copy.splice(originalIndex, 0, original);
        return copy;
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
    if (e.key === "Escape") {
      setEditingId(null);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNewMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
    if (e.target.value.trim()) broadcastTyping();
    else stopTyping();
  }

  async function handleTranslate(msgId: string, content: string) {
    if (translatingId || translatedMessages[msgId]) return;
    setTranslatingId(msgId);
    try {
      const res = await fetch("/api/messages/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, target_language: "en" }),
      });
      const data = await res.json();
      if (data.translation) {
        setTranslatedMessages((prev) => ({ ...prev, [msgId]: data.translation }));
      }
    } finally {
      setTranslatingId(null);
    }
  }

  async function startDm(targetUserId: string) {
    setDmLoading(targetUserId);
    try {
      const res = await fetch("/api/conversations/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });
      const data = await res.json();
      if (data.short_id) {
        router.push(`/dm/${data.short_id}${box ? `?box=${box.short_id}` : ""}`);
      }
    } finally {
      setDmLoading(null);
    }
  }

  // ── Reply tree ──
  const childrenMap = new Map<string, MessageData[]>();
  for (const m of messages) {
    if (m.parent_message_id) {
      const arr = childrenMap.get(m.parent_message_id) || [];
      arr.push(m);
      childrenMap.set(m.parent_message_id, arr);
    }
  }
  const topLevelMessages = messages.filter((m) => !m.parent_message_id);

  const mentionNames = Object.fromEntries(
    conversation.participants.map((p) => [p.username || p.email.split("@")[0], p.full_name || p.email])
  );

  const msgCallbacks: MessageCallbacks = {
    currentUserId: user.id,
    onReaction: handleReaction,
    onReply: (msg) => { setReplyingTo(msg); inputRef.current?.focus(); },
    onTranslate: handleTranslate,
    onEdit: (id, content) => { setEditingId(id); setEditContent(content); },
    onDelete: handleDelete,
    onMediaPreview: setMediaPreview,
    onEmojiPickerChange: setEmojiPickerMsgId,
    onHover: setHoveredMsgId,
    translatingId,
    translatedMessages,
    confirmDeleteId,
    onConfirmDelete: setConfirmDeleteId,
    emojiPickerMsgId,
    editingId,
    editContent,
    onEditContentChange: setEditContent,
    onEditSave: handleEditSave,
    onEditCancel: () => setEditingId(null),
    editInputRef,
    onEditKeyDown: handleEditKeyDown,
    inputRef,
    mentionNames,
    boxShortId: box?.short_id,
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <ChatSidebar
        user={user}
        boxes={boxes}
        box={box}
        channels={channels}
        members={members}
        currentUserId={user.id}
        activeDmUserId={otherParticipants.length === 1 ? otherParticipants[0].user_id : undefined}
        getStatus={getStatus}
        onCreateChannel={() => setCreateChannelOpen(true)}
        onStartDm={startDm}
        onInvite={() => setInviteOpen(true)}
        activeCalls={activeCalls}
        dmLoading={dmLoading}
      />

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-[#1a1a1a] px-4">
          {otherParticipants.length === 1 && otherParticipants[0].avatar_url ? (
            <img
              src={otherParticipants[0].avatar_url}
              alt=""
              className="h-7 w-7 rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-bold text-white">
              {otherParticipants[0]
                ? getInitials(
                    otherParticipants[0].full_name,
                    otherParticipants[0].email
                  )
                : "?"}
            </div>
          )}
          <h1 className="flex-1 text-[14px] font-semibold text-white">
            {displayName}
          </h1>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleStartCall}
              disabled={startingCall}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
              title="Start a call"
            >
              <Phone className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[12px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              title="Search messages"
            >
              <Search className="h-3.5 w-3.5" />
              <kbd className="hidden rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#444] sm:inline">
                ⌘K
              </kbd>
            </button>
            <NotificationBell userId={user.id} />
          </div>
        </div>

        {/* Active call banner */}
        {activeCall && (
          <button
            onClick={handleStartCall}
            disabled={startingCall}
            className="flex w-full items-center gap-3 border-b border-[#1a1a1a] bg-[#22c55e]/10 px-4 py-2.5 text-left transition-colors hover:bg-[#22c55e]/15 disabled:opacity-70"
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
            <span className="text-[13px] font-medium text-[#22c55e]">
              Call in progress
            </span>
            <span className="ml-auto rounded-full bg-[#22c55e] px-3 py-0.5 text-[11px] font-semibold text-black">
              Join
            </span>
          </button>
        )}

        {/* Messages */}
        <div ref={scrollContainerRef} className="relative flex-1 overflow-auto">
          <div className="px-4 py-4">
            {loadingMore && (
              <div className="flex justify-center py-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-white" />
              </div>
            )}
            {!hasMore && messages.length > 0 && (
              <div className="pb-4 pt-2 text-center text-[12px] text-[#444]">
                Beginning of conversation
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#111]">
                  <MessageSquare className="h-8 w-8 text-[#333]" />
                </div>
                <h3 className="text-[18px] font-bold text-white">
                  {displayName}
                </h3>
                <p className="mt-1 max-w-sm text-[14px] leading-[22px] text-[#555]">
                  This is the start of your conversation. Say hello!
                </p>
              </div>
            ) : (
              topLevelMessages.map((msg, i) => {
                // System messages (call events) get special rendering
                const systemData = parseSystemMessage(msg.content);
                if (systemData) {
                  return <SystemMessage key={msg.id} data={systemData} />;
                }

                const prev = i > 0 ? topLevelMessages[i - 1] : null;
                const next = i < topLevelMessages.length - 1 ? topLevelMessages[i + 1] : null;
                const showDateDivider = shouldShowDate(
                  msg.created_at,
                  prev?.created_at ?? null
                );
                const grouped = isGrouped(msg, prev);
                const isOwn = msg.sender_id === user.id;
                const isHovered = hoveredMsgId === msg.id;
                const isEditing = editingId === msg.id;
                const senderInitials = getInitials(
                  msg.sender.full_name,
                  msg.sender.email
                );

                // "Seen" indicator: show under the other user's messages at burst boundaries
                const otherUser = otherParticipants[0];
                const otherCursor = otherUser
                  ? readCursors.find((c) => c.user_id === otherUser.user_id)
                  : null;

                // Burst grouping: only show on the last message of consecutive
                // same-sender messages that are <2 min apart
                const isLastInBurst =
                  !next ||
                  next.sender_id !== msg.sender_id ||
                  new Date(next.created_at).getTime() - new Date(msg.created_at).getTime() >= 120000;

                const showSeen =
                  otherCursor &&
                  !isOwn &&
                  isLastInBurst &&
                  new Date(msg.created_at) <= new Date(otherCursor.last_read_at) &&
                  (!next ||
                    new Date(next.created_at) > new Date(otherCursor.last_read_at));

                return (
                  <div key={msg.id}>
                    {showDateDivider && (
                      <div className="my-5 flex items-center gap-3">
                        <div className="flex-1 border-t border-[#1a1a1a]" />
                        <span className="rounded-full bg-[#111] px-3 py-0.5 text-[11px] font-semibold text-[#555]">
                          {formatDate(msg.created_at)}
                        </span>
                        <div className="flex-1 border-t border-[#1a1a1a]" />
                      </div>
                    )}

                    <div
                      className={`group relative rounded-[4px] transition-colors ${
                        grouped ? "mt-0" : "mt-4"
                      } ${isHovered && !isEditing ? "bg-[#0d0d0d]" : ""}`}
                      onMouseEnter={() => setHoveredMsgId(msg.id)}
                      onMouseLeave={() => { if (emojiPickerMsgId !== msg.id) setHoveredMsgId(null); }}
                    >
                      {(isHovered || emojiPickerMsgId === msg.id) && !isEditing && <HoverActions msg={msg} cb={msgCallbacks} />}

                      <div
                        className={`flex gap-3 px-2 ${
                          grouped ? "py-[1px]" : "py-1"
                        }`}
                      >
                        {grouped ? (
                          <div className="flex w-10 shrink-0 items-start justify-end">
                            <span className="mt-0.5 hidden text-[10px] text-[#444] group-hover:inline">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-0.5 w-10 shrink-0">
                            {msg.sender.avatar_url ? (
                              <img
                                src={msg.sender.avatar_url}
                                alt=""
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a] text-[11px] font-bold text-white">
                                {senderInitials}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          {!grouped && (
                            <div className="flex items-baseline gap-2">
                              <MemberProfileCard
                                sender={msg.sender}
                                currentUserId={user.id}
                                boxShortId={box?.short_id}
                              >
                                <span className="text-[14px] font-semibold text-white">
                                  {msg.sender.full_name || msg.sender.email}
                                </span>
                              </MemberProfileCard>
                              <span className="text-[11px] text-[#444]">
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          )}

                          {isEditing ? <EditBox cb={msgCallbacks} /> : <MessageContent msg={msg} cb={msgCallbacks} />}
                        </div>
                      </div>

                      <MessageReactions msg={msg} paddingLeft="pl-[56px]" cb={msgCallbacks} />
                    </div>

                    {/* Nested replies */}
                    <ThreadReplies parentId={msg.id} depth={1} childrenMap={childrenMap} cb={msgCallbacks} hoveredMsgId={hoveredMsgId} />

                    {showSeen && (
                      <div className="flex gap-3 px-2 pb-1">
                        <div className="w-10 shrink-0" />
                        <span className="text-[11px] text-[#555]">Seen</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {showScrollDown && (
            <button
              onClick={() => {
                scrollToBottom();
                setNewMsgCount(0);
              }}
              className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#1a1a1a] bg-[#111] px-3 py-1.5 text-[12px] text-[#888] shadow-lg transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              {newMsgCount > 0
                ? `${newMsgCount} new message${newMsgCount === 1 ? "" : "s"}`
                : "Scroll to bottom"}
            </button>
          )}
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="shrink-0 px-5 pb-1">
            <span className="text-[12px] text-[#888]">
              {typingUsers.length === 1
                ? `${typingUsers[0].user_name || "Someone"} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        {/* Composer */}
        <MessageComposer
          placeholder={`Message ${displayName}`}
          newMessage={newMessage}
          onNewMessageChange={setNewMessage}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          attachments={attachments}
          onRemoveAttachment={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          uploading={uploading}
          sending={sending}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFileUpload={handleFileUpload}
          onSend={handleSend}
          members={members}
        />
      </div>

      {/* Modals */}
      {box && (
        <>
          <CreateChannelModal
            open={createChannelOpen}
            onClose={() => setCreateChannelOpen(false)}
            boxId={box.id}
            boxShortId={box.short_id}
          />
          <InviteModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            boxId={box.id}
            boxName={box.name}
          />
        </>
      )}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        boxShortId={box?.short_id}
        boxId={box?.id}
      />
      <MediaPreviewModal
        open={!!mediaPreview}
        onClose={() => setMediaPreview(null)}
        url={mediaPreview?.url ?? ""}
        type={mediaPreview?.type ?? "image"}
        fileName={mediaPreview?.fileName}
      />
    </div>
  );
}
