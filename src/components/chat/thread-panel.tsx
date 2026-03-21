"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  XIcon as X,
  SmileyIcon as Smile,
  BoldIcon as Bold,
  ItalicIcon as Italic,
  PaperAirplaneIcon as Send,
  PlusIcon as Plus,
  PencilIcon as Pencil,
  TrashIcon as Trash2,
  CheckboxIcon as CheckSquare,
} from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { EmojiPicker } from "@/components/emoji-picker";
import { Spinner } from "@/components/ui/spinner";
import { formatTime, getInitials, type MessageData, type MemberData } from "@/lib/chat-helpers";
import { MessageContent, MessageReactions, type MessageCallbacks } from "@/components/chat/message-components";
import { MentionPicker } from "@/components/chat/mention-picker";
import { createClient } from "@/lib/supabase/client";

interface ThreadPanelProps {
  parentMessage: MessageData;
  channelId: string;
  onClose: () => void;
  currentUserId: string;
  currentUser: { id: string; fullName: string; email: string; avatarUrl: string | null };
  onSendReply: (content: string, alsoSendToChannel: boolean) => void;
  sending?: boolean;
  /** Members available for @mentions */
  members?: MemberData[];
  /** Message callbacks for reactions, edit, delete on thread messages */
  msgCallbacks: MessageCallbacks;
}

export function ThreadPanel({
  parentMessage,
  channelId,
  onClose,
  currentUserId,
  currentUser,
  onSendReply,
  sending,
  members,
  msgCallbacks,
}: ThreadPanelProps) {
  const [replyText, setReplyText] = useState("");
  const [alsoSendToChannel, setAlsoSendToChannel] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lazy-loaded replies
  const [replies, setReplies] = useState<MessageData[]>([]);
  const [totalReplies, setTotalReplies] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Attachment state
  const [attachments, setAttachments] = useState<
    { url: string; file_name: string; file_type: string; file_size: number }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);

  // Hover state for thread messages
  const [hoveredReplyId, setHoveredReplyId] = useState<string | null>(null);

  // Edit state local to thread
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch replies from API
  const fetchReplies = useCallback(async (before?: string) => {
    const isLoadMore = !!before;
    if (isLoadMore) setLoadingMore(true); else setLoading(true);

    try {
      const params = new URLSearchParams({ limit: "50" });
      if (before) params.set("before", before);
      const res = await fetch(`/api/threads/${parentMessage.id}?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      if (isLoadMore) {
        setReplies((prev) => [...data.replies, ...prev]);
      } else {
        setReplies(data.replies);
      }
      setTotalReplies(data.total);
      setHasMore(data.hasMore);
    } finally {
      if (isLoadMore) setLoadingMore(false); else setLoading(false);
    }
  }, [parentMessage.id]);

  // Load on mount and when parent changes
  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  // Subscribe to realtime for new thread replies
  useEffect(() => {
    const supabase = createClient();
    const subscription = supabase
      .channel(`thread-${parentMessage.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `parent_message_id=eq.${parentMessage.id}`,
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
          // Fetch sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url, username")
            .eq("id", newMsg.sender_id)
            .single();

          const sender = profile || {
            id: newMsg.sender_id,
            full_name: "Unknown",
            email: "",
            avatar_url: null,
          };

          setReplies((prev) => {
            // Avoid duplicates
            if (prev.some((r) => r.id === newMsg.id)) return prev;
            return [
              ...prev,
              { ...newMsg, reactions: [], sender },
            ];
          });
          setTotalReplies((prev) => prev + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `parent_message_id=eq.${parentMessage.id}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; content: string; edited_at: string | null };
          setReplies((prev) =>
            prev.map((r) =>
              r.id === updated.id
                ? { ...r, content: updated.content, edited_at: updated.edited_at }
                : r,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `parent_message_id=eq.${parentMessage.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setReplies((prev) => prev.filter((r) => r.id !== deletedId));
          setTotalReplies((prev) => Math.max(0, prev - 1));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [parentMessage.id]);

  // Auto-scroll on new replies
  useEffect(() => {
    if (!loading) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [replies.length, loading]);

  // Mark thread as read when opened / new replies arrive
  useEffect(() => {
    if (loading || replies.length === 0) return;
    const supabase = createClient();
    supabase
      .from("thread_subscriptions")
      .upsert(
        {
          user_id: currentUserId,
          parent_message_id: parentMessage.id,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,parent_message_id" },
      )
      .then(() => {});
  }, [loading, replies.length, currentUserId, parentMessage.id]);

  const autoGrow = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  function handleSend() {
    const content = replyText.trim();
    if ((!content && attachments.length === 0) || sending) return;

    // Build final content with attachments
    let finalContent = content;
    if (attachments.length > 0) {
      const urls = attachments.map((a) => a.url).join("\n");
      finalContent = finalContent ? `${finalContent}\n${urls}` : urls;
    }

    onSendReply(finalContent, alsoSendToChannel);
    setReplyText("");
    setAttachments([]);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }

  function wrapSelection(before: string, after: string) {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = replyText;
    const selected = text.slice(start, end);
    const newText = text.slice(0, start) + before + selected + after + text.slice(end);
    setReplyText(newText);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = end + before.length;
    });
  }

  // File upload handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `uploads/${currentUserId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("attachments").upload(path, file);
      if (error) continue;

      const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);
      setAttachments((prev) => [
        ...prev,
        { url: urlData.publicUrl, file_name: file.name, file_type: file.type, file_size: file.size },
      ]);
    }

    setUploading(false);
    e.target.value = "";
  }

  // Mention detection in textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setReplyText(val);
    autoGrow();

    // Detect @mention
    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionStart(cursorPos - atMatch[0].length);
    } else {
      setMentionQuery(null);
    }
  }

  function handleMentionSelect(username: string) {
    const before = replyText.slice(0, mentionStart);
    const after = replyText.slice(mentionStart + (mentionQuery?.length ?? 0) + 1); // +1 for @
    setReplyText(`${before}@${username} ${after}`);
    setMentionQuery(null);
    inputRef.current?.focus();
  }

  // Thread-local edit handlers
  async function handleEditSave() {
    if (!editingId) return;
    const supabase = createClient();
    await supabase
      .from("messages")
      .update({ content: editContent, edited_at: new Date().toISOString() })
      .eq("id", editingId);
    setEditingId(null);
  }

  async function handleDeleteReply(messageId: string) {
    const supabase = createClient();
    await supabase.from("messages").delete().eq("id", messageId);
  }

  // Thread-local reaction handler
  async function handleReaction(messageId: string, emoji: string) {
    const supabase = createClient();
    const msg = replies.find((r) => r.id === messageId) || (messageId === parentMessage.id ? parentMessage : null);
    if (!msg) return;

    const existing = msg.reactions.find(
      (r) => r.emoji === emoji && r.user_id === currentUserId,
    );

    if (existing) {
      await supabase.from("reactions").delete().eq("message_id", messageId).eq("user_id", currentUserId).eq("emoji", emoji);
      setReplies((prev) =>
        prev.map((r) =>
          r.id === messageId
            ? { ...r, reactions: r.reactions.filter((rx) => !(rx.emoji === emoji && rx.user_id === currentUserId)) }
            : r,
        ),
      );
    } else {
      await supabase.from("reactions").insert({ message_id: messageId, user_id: currentUserId, emoji });
      setReplies((prev) =>
        prev.map((r) =>
          r.id === messageId
            ? { ...r, reactions: [...r.reactions, { emoji, user_id: currentUserId }] }
            : r,
        ),
      );
    }
  }

  // Build thread-local message callbacks
  const threadCb: MessageCallbacks = {
    ...msgCallbacks,
    onReaction: handleReaction,
    onEdit: (id, content) => { setEditingId(id); setEditContent(content); },
    onDelete: handleDeleteReply,
    onHover: setHoveredReplyId,
    onEmojiPickerChange: (id) => setHoveredReplyId(id),
    editingId,
    editContent,
    onEditContentChange: setEditContent,
    onEditSave: handleEditSave,
    onEditCancel: () => setEditingId(null),
    editInputRef,
    emojiPickerMsgId: hoveredReplyId,
    confirmDeleteId: null,
    onConfirmDelete: () => {},
    onOpenThread: undefined, // No nested threads
    inputRef,
  };

  function renderMessage(msg: MessageData, isParent?: boolean) {
    const initials = getInitials(msg.sender.full_name, msg.sender.email);
    const isHovered = hoveredReplyId === msg.id;
    const isEditing = editingId === msg.id;

    return (
      <div
        key={msg.id}
        className={`group relative rounded-[4px] transition-colors ${isHovered && !isEditing ? "bg-[#0d0d0d]" : ""}`}
        onMouseEnter={() => !isParent && setHoveredReplyId(msg.id)}
        onMouseLeave={() => !isParent && setHoveredReplyId(null)}
      >
        {/* Hover actions for reply messages */}
        {!isParent && isHovered && !isEditing && (
          <div className="absolute -top-3 right-2 z-10 flex items-center gap-px rounded-[6px] border border-[#1a1a1a] bg-[#111] p-0.5 shadow-lg">
            {["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{1F440}", "\u{2705}"].map((emoji) => (
              <Tooltip key={emoji} label={emoji}>
                <button
                  onClick={() => handleReaction(msg.id, emoji)}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[14px] transition-colors hover:bg-[#1a1a1a]"
                >
                  {emoji}
                </button>
              </Tooltip>
            ))}
            <div className="mx-0.5 h-4 w-px bg-[#222]" />
            <EmojiPicker onSelect={(emoji) => handleReaction(msg.id, emoji)}>
              <Tooltip label="React">
                <button className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white">
                  <Smile className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </EmojiPicker>
            {msg.sender_id === currentUserId && (
              <>
                <Tooltip label="Edit">
                  <button
                    onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                    className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
                <Tooltip label="Delete">
                  <button
                    onClick={() => handleDeleteReply(msg.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-[#de1135]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3 px-4 py-2">
          <div className="mt-0.5 shrink-0">
            {msg.sender.avatar_url ? (
              <img src={msg.sender.avatar_url} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-bold text-white">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-white">
                {msg.sender.full_name || msg.sender.email}
              </span>
              <span className="text-[10px] text-[#444]">
                {formatTime(msg.created_at)}
              </span>
            </div>
            {isEditing ? (
              <div className="mt-1 rounded-[8px] border border-[#2a2a2a] bg-[#111] p-2">
                <textarea
                  ref={editInputRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-full resize-none bg-transparent text-[14px] leading-[22px] text-[#ddd] focus:outline-none"
                  rows={1}
                  autoFocus
                />
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[#555]">
                  Escape to{" "}
                  <button onClick={() => setEditingId(null)} className="text-[#888] hover:text-white">cancel</button>
                  {" "}&middot; Enter to{" "}
                  <button onClick={handleEditSave} className="text-[#888] hover:text-white">save</button>
                </div>
              </div>
            ) : (
              <MessageContent msg={msg} cb={threadCb} />
            )}
          </div>
        </div>
        <MessageReactions msg={msg} paddingLeft="pl-[56px]" cb={threadCb} />
      </div>
    );
  }

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-l border-[#1a1a1a] bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-[#1a1a1a] px-4">
        <span className="text-[14px] font-semibold text-white">Thread</span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#555]">
            {totalReplies} {totalReplies === 1 ? "reply" : "replies"}
          </span>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Parent message */}
      <div className="border-b border-[#1a1a1a] py-2">
        {renderMessage(parentMessage, true)}
      </div>

      {/* Replies */}
      <div ref={scrollRef} className="flex-1 overflow-auto py-2">
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={() => {
                if (replies.length > 0) fetchReplies(replies[0].created_at);
              }}
              disabled={loadingMore}
              className="flex items-center gap-1.5 rounded-[6px] px-3 py-1 text-[12px] text-[#4a9eff] transition-colors hover:bg-[#111]"
            >
              {loadingMore ? <Spinner size="xs" /> : "Load earlier replies"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-[13px] text-[#555]">No replies yet</p>
            <p className="mt-1 text-[11px] text-[#333]">Be the first to reply</p>
          </div>
        ) : (
          replies.map((reply) => renderMessage(reply))
        )}
      </div>

      {/* Reply input */}
      <div className="border-t border-[#1a1a1a] p-3">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-[6px] bg-[#1a1a1a] px-2 py-1 text-[11px] text-[#aaa]">
                <span className="max-w-[120px] truncate">{a.file_name}</span>
                <button onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-[#555] hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mention picker */}
        {mentionQuery !== null && members && members.length > 0 && (
          <div className="mb-1">
            <MentionPicker
              members={members}
              query={mentionQuery}
              onSelectMember={(m) => handleMentionSelect(m.username || m.email.split("@")[0])}
              onSelectChannel={() => {}}
              onSelectSpecial={(s) => handleMentionSelect(s.handle)}
              onClose={() => setMentionQuery(null)}
            />
          </div>
        )}

        <div className="rounded-[8px] border border-[#1a1a1a] bg-[#111] focus-within:border-[#2a2a2a]">
          {/* Formatting toolbar */}
          <div className="flex items-center gap-px border-b border-[#1a1a1a] px-2 py-1">
            <Tooltip label="Attach file">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <div className="mx-0.5 h-4 w-px bg-[#222]" />
            <Tooltip label="Bold">
              <button
                onClick={() => wrapSelection("**", "**")}
                className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <Tooltip label="Italic">
              <button
                onClick={() => wrapSelection("*", "*")}
                className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <div className="mx-0.5 h-4 w-px bg-[#222]" />
            <EmojiPicker onSelect={(emoji) => setReplyText((prev) => prev + emoji)}>
              <Tooltip label="Emoji">
                <button className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white">
                  <Smile className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </EmojiPicker>
          </div>

          {/* Input + send */}
          <div className="flex items-end gap-2 px-3 py-2">
            <textarea
              ref={inputRef}
              value={replyText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                  e.preventDefault();
                  wrapSelection("**", "**");
                }
                if ((e.metaKey || e.ctrlKey) && e.key === "i") {
                  e.preventDefault();
                  wrapSelection("*", "*");
                }
              }}
              placeholder="Reply..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[13px] text-white placeholder:text-[#555] focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={(!replyText.trim() && attachments.length === 0) || sending || uploading}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:text-white disabled:opacity-30"
            >
              {uploading ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-[#555] border-t-transparent" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Bottom row: also send to channel + keyboard hints */}
          <div className="flex items-center justify-between px-3 pb-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <button
                onClick={() => setAlsoSendToChannel(!alsoSendToChannel)}
                className={`flex h-4 w-4 items-center justify-center rounded-[3px] border transition-colors ${
                  alsoSendToChannel
                    ? "border-[#276ef1] bg-[#276ef1]"
                    : "border-[#333] bg-transparent hover:border-[#555]"
                }`}
              >
                {alsoSendToChannel && <CheckSquare className="h-3 w-3 text-white" />}
              </button>
              <span className="text-[10px] text-[#555]">Also send to channel</span>
            </label>
            <span className="text-[10px] text-[#333]">
              <kbd className="rounded bg-[#1a1a1a] px-1 py-0.5 text-[9px] text-[#555]">Enter</kbd> send
            </span>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
