"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Hash,
  Lock,
  Users,
  Phone,
  PhoneOff,
  Pin,
  Search,
  Sparkles,
  Newspaper,
  ChevronDown,
  UserPlus,
  LogIn,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { AddToChannelModal } from "@/components/modals/add-to-channel-modal";
import { SearchModal } from "@/components/modals/search-modal";
import { SummaryModal } from "@/components/modals/summary-modal";
import { DigestModal } from "@/components/modals/digest-modal";
import { HighlightsPanel } from "@/components/chat/highlights-panel";
import { PinnedMessagesPanel } from "@/components/chat/pinned-messages-panel";
import { NotificationBell } from "@/components/notifications/notification-bell";
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
  type MessageData,
  type BoxData,
  type SidebarChannel,
  type MemberData,
  type ReadCursor,
  type UserData,
} from "@/lib/chat-helpers";

// ── Types ──

interface ChannelData {
  id: string;
  short_id: string;
  box_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
}

interface ActiveCallData {
  id: string;
  room_name: string;
  started_by: string;
  started_at: string;
}

interface ChannelMemberData {
  id: string;
  user_id: string;
  added_at: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  username: string;
}

interface ChannelEventData {
  id: string;
  channel_id: string;
  actor_id: string | null;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ChannelPageClientProps {
  user: UserData;
  boxes: BoxData[];
  box: BoxData & { description: string | null };
  channel: ChannelData;
  channels: SidebarChannel[];
  members: MemberData[];
  channelMembers: ChannelMemberData[];
  unreadCounts: Record<string, number>;
  initialReadCursors: ReadCursor[];
  initialMessages: MessageData[];
  activeCall?: ActiveCallData | null;
  activeCalls?: SidebarCall[];
  initialEvents: ChannelEventData[];
}

// ── Notification helper (fire-and-forget) ──

function sendMessageNotifications(
  messageId: string,
  content: string,
  replyTo: MessageData | null,
  members: MemberData[],
  sender: UserData,
  channel: { id: string; name: string },
  box: { id: string }
) {
  // Parse @mentions from content (format: @username)
  const mentionRegex = /@(\w[\w.-]*)/g;
  const mentionedUsernames = new Set<string>();
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentionedUsernames.add(match[1].toLowerCase());
  }

  // Find mentioned member IDs
  const mentionedIds = members
    .filter((m) => mentionedUsernames.has((m.username || "").toLowerCase()))
    .map((m) => m.user_id)
    .filter((id) => id !== sender.id);

  // Send mention notifications
  if (mentionedIds.length > 0) {
    fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_ids: mentionedIds,
        type: "mention",
        title: `${sender.fullName} mentioned you in #${channel.name}`,
        body: content.slice(0, 200),
        box_id: box.id,
        channel_id: channel.id,
        message_id: messageId,
      }),
    }).catch(() => {});
  }

  // Send reply notification to the parent message author
  if (replyTo && replyTo.sender_id !== sender.id) {
    // Don't double-notify if already mentioned
    if (!mentionedIds.includes(replyTo.sender_id)) {
      fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: [replyTo.sender_id],
          type: "reply",
          title: `${sender.fullName} replied to your message in #${channel.name}`,
          body: content.slice(0, 200),
          box_id: box.id,
          channel_id: channel.id,
          message_id: messageId,
        }),
      }).catch(() => {});
    }
  }
}

// ── Component ──

export function ChannelPageClient({
  user,
  boxes,
  box,
  channel,
  channels,
  members,
  channelMembers: initialChannelMembers,
  unreadCounts: initialUnreadCounts,
  initialReadCursors,
  initialMessages,
  activeCall,
  activeCalls,
  initialEvents,
}: ChannelPageClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [channelEvents, setChannelEvents] = useState<ChannelEventData[]>(initialEvents);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(initialUnreadCounts);
  const [readCursors, setReadCursors] = useState<ReadCursor[]>(initialReadCursors);
  const markAsReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showScrollDownRef = useRef(false);
  const markAsReadRef = useRef<() => void>(() => {});
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length >= 50);
  const [newMsgCount, setNewMsgCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Channel members (private channels)
  const [channelMembersList, setChannelMembersList] = useState<ChannelMemberData[]>(initialChannelMembers);
  const [addToChannelOpen, setAddToChannelOpen] = useState(false);
  const [leavingChannel, setLeavingChannel] = useState(false);

  const isBoxAdmin = box.role === "owner" || box.role === "admin";

  async function handleLeaveChannel() {
    if (!confirm(`Leave #${channel.name}? You'll need to be re-invited to rejoin.`)) return;
    setLeavingChannel(true);
    try {
      const res = await fetch(
        `/api/channels/${channel.id}/members?user_id=${user.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        router.push(`/box/${box.short_id}`);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to leave channel");
      }
    } finally {
      setLeavingChannel(false);
    }
  }

  // Modals
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set());
  const [dmLoading, setDmLoading] = useState<string | null>(null);

  // Reply
  const [replyingTo, setReplyingTo] = useState<MessageData | null>(null);

  // Media preview
  const [mediaPreview, setMediaPreview] = useState<{
    url: string;
    type: MediaType;
    fileName?: string;
  } | null>(null);


  // ── Presence & typing ──
  const { getStatus } = usePresence(`box-${box.id}`, user.id, user.fullName);
  const { typingUsers, broadcastTyping, stopTyping } = useTyping(
    `channel-${channel.id}`,
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
        body: JSON.stringify({ channel_id: channel.id }),
      });
      const data = await res.json();
      if (data.call) {
        const returnTo = `/box/${box.short_id}/c/${channel.short_id}`;
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

  // ── Mark as read (throttled) ──
  const markAsRead = useCallback(() => {
    if (markAsReadTimer.current) return;
    markAsReadTimer.current = setTimeout(() => {
      markAsReadTimer.current = null;
    }, 2000);

    const last = messages[messages.length - 1];
    if (!last || last.id.startsWith("temp-")) return;

    setUnreadCounts((prev) => ({ ...prev, [channel.id]: 0 }));

    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel_id: channel.id,
        timestamp: last.created_at,
      }),
    });
  }, [messages, channel.id]);

  // Keep refs in sync for use inside realtime callbacks (avoids stale closures)
  markAsReadRef.current = markAsRead;
  showScrollDownRef.current = showScrollDown;

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

  // Auto-scroll to bottom
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
      // Load older messages when scrolled near top
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
        `/api/messages/history?channel_id=${channel.id}&before=${encodeURIComponent(oldest.created_at)}&limit=50`
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

        // Restore scroll position after prepending
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
  }, [loadingMore, hasMore, messages, channel.id]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus edit input when editing
  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      const len = editInputRef.current?.value.length ?? 0;
      editInputRef.current?.setSelectionRange(len, len);
    }
  }, [editingId]);

  // ── Realtime subscription ──
  useEffect(() => {
    const supabase = createClient();

    const subscription = supabase
      .channel(`channel-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
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

          // Desktop notification for messages from others
          const senderName = sender.full_name || sender.email || "Someone";
          showPushNotification({
            title: `#${channel.name}`,
            body: `${senderName}: ${newMsg.content.slice(0, 120)}`,
            tag: `msg-${channel.id}`,
            url: `/box/${box.short_id}/c/${channel.short_id}`,
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
          filter: `channel_id=eq.${channel.id}`,
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
                ? { ...m, content: updated.content, edited_at: updated.edited_at }
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
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    const cursorSubscription = supabase
      .channel(`channel-cursors-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "read_cursors",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const cursor = (payload.eventType === "DELETE" ? payload.old : payload.new) as {
            user_id: string;
            last_read_at: string;
          };
          if (payload.eventType === "DELETE") {
            setReadCursors((prev) => prev.filter((c) => c.user_id !== cursor.user_id));
          } else {
            setReadCursors((prev) => {
              const exists = prev.find((c) => c.user_id === cursor.user_id);
              if (exists) {
                return prev.map((c) =>
                  c.user_id === cursor.user_id ? { ...c, last_read_at: cursor.last_read_at } : c
                );
              }
              return [...prev, { user_id: cursor.user_id, last_read_at: cursor.last_read_at }];
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new messages in OTHER channels for sidebar unread badges
    const otherChannelIds = channels
      .filter((ch) => ch.id !== channel.id)
      .map((ch) => ch.id);

    let otherChannelSub: ReturnType<typeof supabase.channel> | null = null;
    if (otherChannelIds.length > 0) {
      otherChannelSub = supabase
        .channel("sidebar-unread")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const msg = payload.new as { channel_id?: string; sender_id?: string; parent_message_id?: string | null };
            if (
              msg.channel_id &&
              otherChannelIds.includes(msg.channel_id) &&
              msg.sender_id !== user.id &&
              !msg.parent_message_id
            ) {
              setUnreadCounts((prev) => ({
                ...prev,
                [msg.channel_id!]: (prev[msg.channel_id!] ?? 0) + 1,
              }));
            }
          }
        )
        .subscribe();
    }

    // Subscribe to channel events (member joined, call started, etc.)
    const eventsSub = supabase
      .channel(`channel-events-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_events",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const evt = payload.new as ChannelEventData;
          setChannelEvents((prev) => {
            if (prev.some((e) => e.id === evt.id)) return prev;
            return [...prev, evt];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(cursorSubscription);
      supabase.removeChannel(eventsSub);
      if (otherChannelSub) supabase.removeChannel(otherChannelSub);
    };
  }, [channel.id, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message ──
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

    // Use counter for unique temp IDs (avoids collision on rapid send)
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
        channel_id: channel.id,
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

      // Send notifications (fire-and-forget)
      sendMessageNotifications(
        inserted.id,
        fullContent,
        replyMsg,
        members,
        user,
        channel,
        box
      );
    }

    setSending(false);
    inputRef.current?.focus();
  }

  // ── Edit message ──
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
      // Rollback on failure
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? original : m
        )
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

  // ── Delete message ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(msgId: string) {
    const supabase = createClient();
    const original = messages.find((m) => m.id === msgId);
    const originalIndex = messages.findIndex((m) => m.id === msgId);

    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setConfirmDeleteId(null);

    const { error } = await supabase.from("messages").delete().eq("id", msgId);

    if (error && original) {
      // Rollback on failure
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

  // ── Pinned messages ──
  useEffect(() => {
    fetch(`/api/messages/pin?channel_id=${channel.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pins) {
          setPinnedMessageIds(new Set(data.pins.map((p: { message_id: string }) => p.message_id)));
        }
      })
      .catch(() => {});
  }, [channel.id]);

  async function handlePin(messageId: string) {
    const res = await fetch("/api/messages/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, channel_id: channel.id }),
    });
    if (res.ok) {
      setPinnedMessageIds((prev) => new Set(prev).add(messageId));

      // Send notification to channel members
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        const recipientIds = members
          .map((m) => m.user_id)
          .filter((id) => id !== user.id);
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_ids: recipientIds,
            type: "pin",
            title: `${user.fullName} pinned a message in #${channel.name}`,
            body: msg.content.slice(0, 200),
            box_id: box.id,
            channel_id: channel.id,
            message_id: messageId,
          }),
        }).catch(() => {});
      }
    }
  }

  async function handleUnpin(messageId: string) {
    const res = await fetch(`/api/messages/pin?message_id=${messageId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPinnedMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
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
        router.push(`/dm/${data.short_id}?box=${box.short_id}`);
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

  // Build combined timeline of messages + events, sorted by time
  type TimelineItem =
    | { kind: "message"; msg: MessageData }
    | { kind: "event"; event: ChannelEventData };

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [
      ...topLevelMessages.map((msg) => ({ kind: "message" as const, msg })),
      ...channelEvents.map((event) => ({ kind: "event" as const, event })),
    ];
    items.sort((a, b) => {
      const aT = new Date(a.kind === "message" ? a.msg.created_at : a.event.created_at).getTime();
      const bT = new Date(b.kind === "message" ? b.msg.created_at : b.event.created_at).getTime();
      return aT - bT;
    });
    return items;
  }, [topLevelMessages, channelEvents]);

  const mentionNames = Object.fromEntries(
    members.map((m) => [m.username, m.full_name || m.email])
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
    pinnedMessageIds,
    onPin: handlePin,
    onUnpin: handleUnpin,
    boxShortId: box.short_id,
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
        activeChannelId={channel.short_id}
        unreadCounts={unreadCounts}
        getStatus={getStatus}
        onCreateChannel={() => setCreateChannelOpen(true)}
        onStartDm={startDm}
        onInvite={() => setInviteOpen(true)}
        onJoinCall={() => handleStartCall()}
        activeCalls={activeCalls}
        dmLoading={dmLoading}
      />

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Channel header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-4">
          <div className="flex min-w-0 items-center gap-2">
            {channel.is_private ? (
              <Lock className="h-4 w-4 shrink-0 text-[#555]" />
            ) : (
              <Hash className="h-4 w-4 shrink-0 text-[#555]" />
            )}
            <h1 className="truncate text-[14px] font-semibold text-white">
              {channel.name}
            </h1>
            {channel.description && (
              <>
                <div className="mx-1 h-4 w-px shrink-0 bg-[#222]" />
                <span className="hidden truncate text-[12px] text-[#555] sm:inline">
                  {channel.description}
                </span>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[12px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Search className="h-3.5 w-3.5" />
              <kbd className="hidden rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#444] sm:inline">
                ⌘K
              </kbd>
            </button>
            <div className="mx-0.5 h-4 w-px bg-[#1a1a1a]" />
            <button
              onClick={handleStartCall}
              disabled={startingCall}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
              title="Start a call"
            >
              <Phone className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setSummaryOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              title="Summarize channel"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDigestOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              title="Channel digest"
            >
              <Newspaper className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowPinnedPanel(!showPinnedPanel)}
              className={`flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors ${
                showPinnedPanel
                  ? "bg-[#1a1a1a] text-[#f59e0b]"
                  : "text-[#555] hover:bg-[#1a1a1a] hover:text-white"
              }`}
              title="Pinned messages"
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            <NotificationBell userId={user.id} />
            {channel.is_private ? (
              <button
                onClick={() => setAddToChannelOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                title="Manage channel members"
              >
                <UserPlus className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setInviteOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                title="Invite people"
              >
                <UserPlus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => channel.is_private ? setAddToChannelOpen(true) : undefined}
              className="flex h-7 items-center gap-1 rounded-[6px] px-2 text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              title="Members"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="text-[11px]">
                {channel.is_private ? channelMembersList.length : members.length}
              </span>
            </button>
            {channel.is_private && !isBoxAdmin && (
              <button
                onClick={handleLeaveChannel}
                disabled={leavingChannel}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#2a1520] hover:text-[#de1135] disabled:opacity-50"
                title="Leave channel"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Highlights panel */}
        {showHighlights && (
          <HighlightsPanel
            channelId={channel.id}
            channelName={channel.name}
            since={readCursors.find((c) => c.user_id === user.id)?.last_read_at ?? null}
            unreadCount={unreadCounts[channel.id] ?? 0}
            onDismiss={() => setShowHighlights(false)}
            onMarkAllRead={markAsRead}
          />
        )}

        {/* Pinned messages panel */}
        {showPinnedPanel && (
          <PinnedMessagesPanel
            channelId={channel.id}
            onClose={() => setShowPinnedPanel(false)}
            onUnpin={handleUnpin}
          />
        )}

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
        <div
          ref={scrollContainerRef}
          className="relative flex-1 overflow-auto"
        >
          <div className="px-4 py-4">
            {loadingMore && (
              <div className="flex justify-center py-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-white" />
              </div>
            )}
            {!hasMore && messages.length > 0 && (
              <div className="px-4 pb-6 pt-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#111] border border-[#1a1a1a]">
                  {channel.is_private ? (
                    <Lock className="h-4 w-4 text-[#333]" />
                  ) : (
                    <Hash className="h-4 w-4 text-[#333]" />
                  )}
                </div>
                <h3 className="text-[15px] font-semibold text-white">
                  #{channel.name}
                </h3>
                <p className="mt-0.5 text-[13px] text-[#555]">
                  {channel.description || `This is the beginning of #${channel.name}.`}
                </p>
              </div>
            )}
            {messages.length === 0 && channelEvents.length === 0 ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center px-4">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111] border border-[#1a1a1a]">
                  {channel.is_private ? (
                    <Lock className="h-7 w-7 text-[#333]" />
                  ) : (
                    <Hash className="h-7 w-7 text-[#333]" />
                  )}
                </div>
                <h3 className="text-[18px] font-bold text-white">
                  Welcome to #{channel.name}
                </h3>
                <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-[#555]">
                  {channel.description ||
                    `This is the very beginning of the ${channel.is_private ? "private " : ""}#${channel.name} channel. Send a message to get things started.`}
                </p>
                <button
                  onClick={() => inputRef.current?.focus()}
                  className="mt-4 rounded-[8px] border border-[#1a1a1a] bg-[#111] px-4 py-2 text-[13px] text-[#888] transition-colors hover:border-[#2a2a2a] hover:text-white"
                >
                  Write the first message
                </button>
              </div>
            ) : (
              timeline.map((item, i) => {
                // ── Channel events (centered text) ──
                if (item.kind === "event") {
                  const evt = item.event;
                  const actorName = (evt.metadata.actor_name as string) || "Someone";
                  let icon: React.ReactNode;
                  let text: React.ReactNode;

                  if (evt.type === "member_joined") {
                    icon = <LogIn className="h-3.5 w-3.5 text-[#22c55e]" />;
                    text = (
                      <>
                        <span className="font-medium text-[#ccc]">{actorName}</span> joined the channel
                      </>
                    );
                  } else if (evt.type === "call_started") {
                    icon = <Phone className="h-3.5 w-3.5 text-[#22c55e]" />;
                    text = (
                      <>
                        <span className="font-medium text-[#ccc]">{actorName}</span> started a call
                        {activeCall && activeCall.id === evt.metadata.call_id && (
                          <button
                            onClick={handleStartCall}
                            disabled={startingCall}
                            className="ml-2 rounded-full bg-[#22c55e] px-2.5 py-0.5 text-[11px] font-semibold text-black transition-colors hover:bg-[#16a34a] disabled:opacity-50"
                          >
                            Join
                          </button>
                        )}
                      </>
                    );
                  } else if (evt.type === "call_ended") {
                    const duration = (evt.metadata.duration as string) || "";
                    icon = <PhoneOff className="h-3.5 w-3.5 text-[#555]" />;
                    text = (
                      <>
                        Call ended{duration && <span className="ml-1 text-[#555]">· {duration}</span>}
                      </>
                    );
                  } else {
                    icon = null;
                    text = <>{evt.type}</>;
                  }

                  return (
                    <div key={`evt-${evt.id}`} className="my-3 flex items-center justify-center gap-2">
                      <div className="flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#111] px-3 py-1.5">
                        {icon}
                        <span className="text-[12px] text-[#888]">{text}</span>
                      </div>
                    </div>
                  );
                }

                // ── Regular messages ──
                const msg = item.msg;

                // Legacy system messages (backward compat for old __system: messages)
                const systemData = parseSystemMessage(msg.content);
                if (systemData) {
                  return <SystemMessage key={msg.id} data={systemData} />;
                }

                // Find prev message (skip events) for grouping
                let prevMsg: MessageData | null = null;
                for (let j = i - 1; j >= 0; j--) {
                  const t = timeline[j];
                  if (t.kind === "message") {
                    prevMsg = t.msg;
                    break;
                  }
                }

                const showDateDivider = shouldShowDate(
                  msg.created_at,
                  prevMsg?.created_at ?? null
                );
                const grouped = isGrouped(msg, prevMsg);
                const isHovered = hoveredMsgId === msg.id;
                const isEditing = editingId === msg.id;
                const senderInitials = getInitials(
                  msg.sender.full_name,
                  msg.sender.email
                );

                // Find next message (skip events) for read indicators
                let nextMsg: MessageData | null = null;
                for (let j = i + 1; j < timeline.length; j++) {
                  const t = timeline[j];
                  if (t.kind === "message") {
                    nextMsg = t.msg;
                    break;
                  }
                }

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
                                boxShortId={box.short_id}
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

                    {/* Read indicator — only on non-own messages, at burst boundaries */}
                    {(() => {
                      if (msg.sender_id === user.id) return null;

                      const isLastInBurst =
                        !nextMsg ||
                        nextMsg.sender_id !== msg.sender_id ||
                        new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() >= 120000;

                      if (!isLastInBurst) return null;

                      const readers = readCursors
                        .filter((c) => {
                          if (c.user_id === user.id) return false;
                          if (c.user_id === msg.sender_id) return false;
                          const readTime = new Date(c.last_read_at).getTime();
                          const msgTime = new Date(msg.created_at).getTime();
                          if (readTime < msgTime) return false;
                          if (nextMsg) {
                            const nextMsgTime = new Date(nextMsg.created_at).getTime();
                            if (readTime >= nextMsgTime) return false;
                          }
                          return true;
                        })
                        .map((c) => {
                          const member = members.find((m) => m.user_id === c.user_id);
                          return member?.full_name || member?.email || "Someone";
                        });

                      if (readers.length === 0) return null;

                      const label =
                        readers.length === 1
                          ? `${readers[0]} read`
                          : `${readers.length} people read`;

                      return (
                        <div className="flex gap-3 px-2 pb-1">
                          <div className="w-10 shrink-0" />
                          <span className="text-[11px] text-[#444]">{label}</span>
                        </div>
                      );
                    })()}
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
                : typingUsers.length === 2
                  ? `${typingUsers[0].user_name} and ${typingUsers[1].user_name} are typing...`
                  : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        {/* Message composer */}
        <MessageComposer
          placeholder={`Message #${channel.name}`}
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
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        boxShortId={box.short_id}
        boxId={box.id}
      />
      <MediaPreviewModal
        open={!!mediaPreview}
        onClose={() => setMediaPreview(null)}
        url={mediaPreview?.url ?? ""}
        type={mediaPreview?.type ?? "image"}
        fileName={mediaPreview?.fileName}
      />
      <SummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        channelId={channel.id}
        channelName={channel.name}
      />
      <DigestModal
        open={digestOpen}
        onClose={() => setDigestOpen(false)}
        channelId={channel.id}
        channelName={channel.name}
      />
      {channel.is_private && (
        <AddToChannelModal
          open={addToChannelOpen}
          onClose={() => setAddToChannelOpen(false)}
          channelId={channel.id}
          channelName={channel.name}
          boxMembers={members}
          channelMembers={channelMembersList}
          onMembersAdded={(newMembers) => {
            setChannelMembersList((prev) => [...prev, ...newMembers]);
          }}
          onMemberRemoved={(userId) => {
            setChannelMembersList((prev) =>
              prev.filter((m) => m.user_id !== userId)
            );
          }}
        />
      )}
    </div>
  );
}
