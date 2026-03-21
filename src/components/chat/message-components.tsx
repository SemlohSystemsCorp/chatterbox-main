"use client";

import { useState, useRef, useEffect } from "react";
import { SmileyIcon as Smile, PencilIcon as Pencil, TrashIcon as Trash2, ReplyIcon as Reply, KebabHorizontalIcon as MoreHorizontal, GlobeIcon as Languages, DeviceMobileIcon as Phone, NoEntryIcon as PhoneOff, PinIcon as Pin, PinSlashIcon as PinOff, CopyIcon as Copy, LinkIcon, CommentDiscussionIcon as Thread } from "@primer/octicons-react";
import { segmentContent } from "@/components/ui/markdown";
import { Tooltip } from "@/components/ui/tooltip";
import { EmojiPicker } from "@/components/emoji-picker";
import { getMediaType, type MediaType } from "@/components/modals/media-preview-modal";
import { getInitials, type MessageData } from "@/lib/chat-helpers";
import { TextWithPreviews } from "@/components/chat/link-preview";
import { MemberProfileCard } from "@/components/chat/member-profile-card";
import { PollCard } from "@/components/chat/poll-card";

// ── Shared callbacks interface ──

export interface MessageCallbacks {
  currentUserId: string;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (msg: MessageData) => void;
  onTranslate: (messageId: string, content: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onMediaPreview: (preview: { url: string; type: MediaType; fileName?: string }) => void;
  onEmojiPickerChange: (messageId: string | null) => void;
  onHover: (messageId: string | null) => void;
  translatingId: string | null;
  translatedMessages: Record<string, string>;
  confirmDeleteId: string | null;
  onConfirmDelete: (messageId: string | null) => void;
  emojiPickerMsgId: string | null;
  // Edit box
  editingId: string | null;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  editInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onEditKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Map of userId → display name for @mention rendering */
  mentionNames?: Record<string, string>;
  /** Pin support */
  pinnedMessageIds?: Set<string>;
  onPin?: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  /** Box short_id for profile card DM navigation */
  boxShortId?: string;
  /** Contact nickname resolver: (userId, fallback) → display name */
  contactName?: (userId: string, fallback: string) => string;
  /** Open thread panel for a given parent message */
  onOpenThread?: (msg: MessageData) => void;
}

// ── System message helpers ──

export interface SystemMessageData {
  type: "call_started" | "call_ended" | "status_update" | "poll";
  call_id?: string;
  duration?: string;
  started_by_name?: string;
  user_name?: string;
  status_emoji?: string;
  status_text?: string;
  poll_id?: string;
  question?: string;
}

export function parseSystemMessage(content: string): SystemMessageData | null {
  if (!content.startsWith("__system:")) return null;
  try {
    const json = content.slice("__system:".length);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function SystemMessage({ data, currentUserId }: { data: SystemMessageData; currentUserId?: string }) {
  if (data.type === "call_started") {
    return (
      <div className="my-3 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#111] px-3 py-1.5">
          <Phone className="h-3.5 w-3.5 text-[#22c55e]" />
          <span className="text-[12px] text-[#888]">
            <span className="font-medium text-[#ccc]">
              {data.started_by_name || "Someone"}
            </span>{" "}
            started a call
          </span>
        </div>
      </div>
    );
  }

  if (data.type === "call_ended") {
    return (
      <div className="my-3 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#111] px-3 py-1.5">
          <PhoneOff className="h-3.5 w-3.5 text-[#555]" />
          <span className="text-[12px] text-[#888]">
            Call ended
            {data.duration && (
              <span className="ml-1 text-[#555]">· {data.duration}</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  if (data.type === "status_update") {
    return (
      <div className="my-3 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#111] px-3 py-1.5">
          <span className="text-[14px]">{data.status_emoji || "💬"}</span>
          <span className="text-[12px] text-[#888]">
            <span className="font-medium text-[#ccc]">
              {data.user_name || "Someone"}
            </span>{" "}
            set their status to{" "}
            <span className="font-medium text-[#ccc]">
              {data.status_emoji ? `${data.status_emoji} ` : ""}{data.status_text}
            </span>
          </span>
        </div>
      </div>
    );
  }

  if (data.type === "poll" && data.poll_id) {
    return (
      <PollCard
        pollId={data.poll_id}
        question={data.question || "Poll"}
        currentUserId={currentUserId || ""}
      />
    );
  }

  return null;
}

// ── MessageContent ──

export function MessageContent({
  msg,
  cb,
}: {
  msg: MessageData;
  cb: MessageCallbacks;
}) {
  return (
    <div className="overflow-hidden">
      {segmentContent(msg.content, getMediaType).map((seg, si) => {
        if (seg.type === "text") {
          return (
            <TextWithPreviews key={si} text={seg.content} mentionNames={cb.mentionNames} />
          );
        }
        if (seg.mediaType === "image") {
          return (
            <button
              key={si}
              onClick={() =>
                cb.onMediaPreview({
                  url: seg.url,
                  type: "image",
                  fileName: seg.url.split("/").pop()?.split("?")[0],
                })
              }
              className="mt-1 block cursor-pointer"
            >
              <img
                src={seg.url}
                alt=""
                className="max-h-[300px] max-w-[400px] rounded-[8px] border border-[#1a1a1a] transition-opacity hover:opacity-80"
              />
            </button>
          );
        }
        if (seg.mediaType === "video") {
          return (
            <div key={si} className="mt-1">
              <video
                src={seg.url}
                controls
                preload="metadata"
                className="max-h-[300px] max-w-[400px] rounded-[8px] border border-[#1a1a1a]"
              />
              <button
                onClick={() =>
                  cb.onMediaPreview({
                    url: seg.url,
                    type: "video",
                    fileName: seg.url.split("/").pop()?.split("?")[0],
                  })
                }
                className="mt-0.5 text-[11px] text-[#555] hover:text-white"
              >
                Open fullscreen
              </button>
            </div>
          );
        }
        if (seg.mediaType === "audio") {
          return (
            <div
              key={si}
              className="mt-1 flex items-center gap-2 rounded-[8px] border border-[#1a1a1a] bg-[#0d0d0d] p-2"
            >
              <audio
                src={seg.url}
                controls
                preload="metadata"
                className="h-8 flex-1"
              />
              <button
                onClick={() =>
                  cb.onMediaPreview({
                    url: seg.url,
                    type: "audio",
                    fileName: seg.url.split("/").pop()?.split("?")[0],
                  })
                }
                className="shrink-0 text-[11px] text-[#555] hover:text-white"
              >
                Expand
              </button>
            </div>
          );
        }
        return null;
      })}
      {msg.edited_at && (
        <span className="text-[10px] text-[#444]">(edited)</span>
      )}
      {cb.translatedMessages[msg.id] && (
        <div className="mt-1 rounded bg-[#0d0d0d] px-2 py-1">
          <span className="text-[10px] font-medium text-[#555]">
            Translated
          </span>
          <p className="text-[13px] leading-[20px] text-[#999]">
            {cb.translatedMessages[msg.id]}
          </p>
        </div>
      )}
    </div>
  );
}

// ── MessageReactions ──

export function MessageReactions({
  msg,
  paddingLeft,
  cb,
}: {
  msg: MessageData;
  paddingLeft: string;
  cb: MessageCallbacks;
}) {
  if (msg.reactions.length === 0) return null;
  const grouped = msg.reactions.reduce<Record<string, string[]>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.user_id);
    return acc;
  }, {});
  return (
    <div className={`flex flex-wrap gap-1 px-2 pb-1 ${paddingLeft}`}>
      {Object.entries(grouped).map(([emoji, userIds]) => {
        const names = userIds.map((uid) => {
          if (uid === cb.currentUserId) return "You";
          return cb.mentionNames?.[uid] || "Someone";
        });
        const tooltipLabel =
          names.length <= 3
            ? names.join(", ")
            : `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;

        return (
          <Tooltip key={emoji} label={`${emoji} ${tooltipLabel}`}>
            <button
              onClick={() => cb.onReaction(msg.id, emoji)}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition-colors ${
                userIds.includes(cb.currentUserId)
                  ? "border-blue-500/40 bg-blue-500/10 text-white"
                  : "border-[#1a1a1a] bg-[#111] text-[#888] hover:border-[#2a2a2a]"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-[11px]">{userIds.length}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

// ── HoverActions ──

export function HoverActions({
  msg,
  cb,
}: {
  msg: MessageData;
  cb: MessageCallbacks;
}) {
  const isOwn = msg.sender_id === cb.currentUserId;
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  function handleCopyText() {
    navigator.clipboard.writeText(msg.content);
    setCopied("text");
    setTimeout(() => { setCopied(null); setMoreOpen(false); }, 800);
  }

  function handleCopyLink() {
    const url = `${window.location.href.split("#")[0]}#msg-${msg.id}`;
    navigator.clipboard.writeText(url);
    setCopied("link");
    setTimeout(() => { setCopied(null); setMoreOpen(false); }, 800);
  }

  const menuBtnClass = "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#ccc] transition-colors hover:bg-[#1a1a1a]";

  const quickEmojis = ["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{1F440}", "\u{2705}"];

  return (
    <div className="absolute -top-3 right-2 z-10 flex items-center gap-px rounded-[6px] border border-[#1a1a1a] bg-[#111] p-0.5 shadow-lg">
      {/* Quick reactions */}
      {quickEmojis.map((emoji) => (
        <Tooltip key={emoji} label={emoji}>
          <button
            onClick={() => cb.onReaction(msg.id, emoji)}
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[14px] transition-colors hover:bg-[#1a1a1a]"
          >
            {emoji}
          </button>
        </Tooltip>
      ))}
      <div className="mx-0.5 h-4 w-px bg-[#222]" />
      <EmojiPicker
        onSelect={(emoji) => cb.onReaction(msg.id, emoji)}
        onOpenChange={(open) => {
          cb.onEmojiPickerChange(open ? msg.id : null);
          if (!open) cb.onHover(null);
        }}
      >
        <Tooltip label="React">
          <button
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </EmojiPicker>
      <Tooltip label="Reply">
        <button
          onClick={() => {
            cb.onReply(msg);
            cb.inputRef.current?.focus();
          }}
          className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <Reply className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
      {cb.onOpenThread && (
        <Tooltip label="Thread">
          <button
            onClick={() => cb.onOpenThread!(msg)}
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <Thread className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}
      {isOwn && (
        <>
          <Tooltip label="Edit">
            <button
              onClick={() => cb.onEdit(msg.id, msg.content)}
              className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          {cb.confirmDeleteId === msg.id ? (
            <button
              onClick={() => cb.onDelete(msg.id)}
              className="flex h-6 items-center gap-1 rounded-[4px] px-1.5 text-[11px] font-medium text-[#de1135] transition-colors hover:bg-[#1a1a1a]"
            >
              Confirm?
            </button>
          ) : (
            <Tooltip label="Delete">
              <button
                onClick={() => cb.onConfirmDelete(msg.id)}
                className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-[#de1135]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}
        </>
      )}
      {/* More dropdown */}
      <div className="relative" ref={moreRef}>
        <Tooltip label="More">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
        {moreOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-[180px] rounded-[8px] border border-[#1a1a1a] bg-[#111] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <button onClick={handleCopyText} className={menuBtnClass}>
              <Copy className="h-3.5 w-3.5 shrink-0 text-[#555]" />
              {copied === "text" ? "Copied!" : "Copy text"}
            </button>
            <button onClick={handleCopyLink} className={menuBtnClass}>
              <LinkIcon className="h-3.5 w-3.5 shrink-0 text-[#555]" />
              {copied === "link" ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={() => {
                cb.onTranslate(msg.id, msg.content);
                setMoreOpen(false);
              }}
              disabled={cb.translatingId === msg.id || !!cb.translatedMessages[msg.id]}
              className={`${menuBtnClass} disabled:opacity-40`}
            >
              <Languages className="h-3.5 w-3.5 shrink-0 text-[#555]" />
              {cb.translatingId === msg.id ? "Translating..." : cb.translatedMessages[msg.id] ? "Translated" : "Translate"}
            </button>
            {cb.onOpenThread && (
              <button
                onClick={() => {
                  cb.onOpenThread!(msg);
                  setMoreOpen(false);
                }}
                className={menuBtnClass}
              >
                <Thread className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                View thread
              </button>
            )}
            {cb.onPin && cb.onUnpin && (
              <>
                <div className="my-1 border-t border-[#1a1a1a]" />
                {cb.pinnedMessageIds?.has(msg.id) ? (
                  <button
                    onClick={() => {
                      cb.onUnpin!(msg.id);
                      setMoreOpen(false);
                    }}
                    className={menuBtnClass}
                  >
                    <PinOff className="h-3.5 w-3.5 shrink-0 text-[#f59e0b]" />
                    Unpin message
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      cb.onPin!(msg.id);
                      setMoreOpen(false);
                    }}
                    className={menuBtnClass}
                  >
                    <Pin className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                    Pin message
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── EditBox ──

export function EditBox({ cb }: { cb: MessageCallbacks }) {
  return (
    <div className="mt-1 rounded-[8px] border border-[#2a2a2a] bg-[#111] p-2">
      <textarea
        ref={cb.editInputRef}
        value={cb.editContent}
        onChange={(e) => cb.onEditContentChange(e.target.value)}
        onKeyDown={cb.onEditKeyDown}
        className="w-full resize-none bg-transparent text-[14px] leading-[22px] text-[#ddd] focus:outline-none"
        rows={1}
      />
      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#555]">
        Escape to{" "}
        <button onClick={cb.onEditCancel} className="text-[#888] hover:text-white">
          cancel
        </button>{" "}
        · Enter to{" "}
        <button onClick={cb.onEditSave} className="text-[#888] hover:text-white">
          save
        </button>
      </div>
    </div>
  );
}

// ── ThreadIndicator ──

export function ThreadIndicator({
  parentId,
  childrenMap,
  cb,
  parentMessage,
  isActiveThread,
}: {
  parentId: string;
  childrenMap: Map<string, MessageData[]>;
  cb: MessageCallbacks;
  parentMessage: MessageData;
  isActiveThread?: boolean;
}) {
  const replies = childrenMap.get(parentId) || [];
  if (!replies.length || !cb.onOpenThread) return null;

  // Collect unique participant avatars (max 4)
  const seen = new Set<string>();
  const participants: { id: string; avatar_url: string | null; initials: string }[] = [];
  for (const r of replies) {
    if (seen.has(r.sender_id)) continue;
    seen.add(r.sender_id);
    participants.push({
      id: r.sender_id,
      avatar_url: r.sender.avatar_url,
      initials: getInitials(r.sender.full_name, r.sender.email),
    });
    if (participants.length >= 4) break;
  }

  const lastReply = replies[replies.length - 1];
  const lastReplyTime = new Date(lastReply.created_at);
  const now = new Date();
  const diff = now.getTime() - lastReplyTime.getTime();
  const mins = Math.floor(diff / 60000);
  let timeLabel: string;
  if (mins < 1) timeLabel = "just now";
  else if (mins < 60) timeLabel = `${mins}m ago`;
  else {
    const hours = Math.floor(mins / 60);
    if (hours < 24) timeLabel = `${hours}h ago`;
    else timeLabel = lastReplyTime.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <button
      onClick={() => cb.onOpenThread!(parentMessage)}
      className={`ml-[52px] mt-1 mb-1 flex items-center gap-2 rounded-[6px] px-2 py-1.5 transition-colors hover:bg-[#111] ${
        isActiveThread ? "bg-[#111] border border-[#276ef1]/30" : ""
      }`}
    >
      {/* Stacked avatars */}
      <div className="flex -space-x-1.5">
        {participants.map((p) =>
          p.avatar_url ? (
            <img key={p.id} src={p.avatar_url} alt="" className="h-5 w-5 rounded-full ring-2 ring-[#0a0a0a]" />
          ) : (
            <div key={p.id} className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a1a] text-[7px] font-bold text-white ring-2 ring-[#0a0a0a]">
              {p.initials}
            </div>
          ),
        )}
      </div>
      <span className="text-[12px] font-medium text-[#4a9eff]">
        {replies.length} {replies.length === 1 ? "reply" : "replies"}
      </span>
      <span className="text-[11px] text-[#444]">
        Last reply {timeLabel}
      </span>
    </button>
  );
}
