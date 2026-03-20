"use client";

import { SmileyIcon as Smile, PencilIcon as Pencil, TrashIcon as Trash2, ReplyIcon as Reply, KebabHorizontalIcon as MoreHorizontal, GlobeIcon as Languages, DeviceMobileIcon as Phone, NoEntryIcon as PhoneOff, PinIcon as Pin, PinSlashIcon as PinOff } from "@primer/octicons-react";
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
      {Object.entries(grouped).map(([emoji, userIds]) => (
        <button
          key={emoji}
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
      ))}
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
  return (
    <div className="absolute -top-3 right-2 z-10 flex items-center gap-px rounded-[6px] border border-[#1a1a1a] bg-[#111] p-0.5 shadow-lg">
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
      <Tooltip label="Translate">
        <button
          onClick={() => cb.onTranslate(msg.id, msg.content)}
          disabled={cb.translatingId === msg.id}
          className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
        >
          <Languages className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
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
      {cb.onPin && cb.onUnpin && (
        cb.pinnedMessageIds?.has(msg.id) ? (
          <Tooltip label="Unpin message">
            <button
              onClick={() => cb.onUnpin!(msg.id)}
              className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#f59e0b] transition-colors hover:bg-[#1a1a1a] hover:text-[#fbbf24]"
            >
              <PinOff className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip label="Pin message">
            <button
              onClick={() => cb.onPin!(msg.id)}
              className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        )
      )}
      <Tooltip label="More">
        <button
          className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
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

// ── ThreadReplies ──

export function ThreadReplies({
  parentId,
  depth,
  childrenMap,
  cb,
  hoveredMsgId,
}: {
  parentId: string;
  depth: number;
  childrenMap: Map<string, MessageData[]>;
  cb: MessageCallbacks;
  hoveredMsgId: string | null;
}) {
  const replies = childrenMap.get(parentId) || [];
  if (!replies.length) return null;
  return (
    <div
      className={`${depth === 1 ? "ml-[52px]" : "ml-8"} border-l-2 border-[#222] pl-3`}
    >
      {replies.map((reply) => {
        const ri = getInitials(reply.sender.full_name, reply.sender.email);
        const rHov = hoveredMsgId === reply.id;
        const rEdit = cb.editingId === reply.id;
        return (
          <div key={reply.id}>
            <div
              className={`group relative mt-0.5 rounded-[4px] transition-colors ${rHov && !rEdit ? "bg-[#0d0d0d]" : ""}`}
              onMouseEnter={() => cb.onHover(reply.id)}
              onMouseLeave={() => {
                if (cb.emojiPickerMsgId !== reply.id) cb.onHover(null);
              }}
            >
              {(rHov || cb.emojiPickerMsgId === reply.id) && !rEdit && (
                <HoverActions msg={reply} cb={cb} />
              )}
              <div className="flex gap-2 py-1">
                <div className="mt-0.5 w-6 shrink-0">
                  {reply.sender.avatar_url ? (
                    <img
                      src={reply.sender.avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-[8px] font-bold text-white">
                      {ri}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <MemberProfileCard
                      sender={reply.sender}
                      currentUserId={cb.currentUserId}
                      boxShortId={cb.boxShortId}
                    >
                      <span className="text-[13px] font-semibold text-white">
                        {cb.contactName ? cb.contactName(reply.sender_id, reply.sender.full_name || reply.sender.email) : (reply.sender.full_name || reply.sender.email)}
                      </span>
                    </MemberProfileCard>
                    <span className="text-[10px] text-[#444]">
                      {new Date(reply.created_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {rEdit ? (
                    <EditBox cb={cb} />
                  ) : (
                    <MessageContent msg={reply} cb={cb} />
                  )}
                </div>
              </div>
              <MessageReactions msg={reply} paddingLeft="pl-[40px]" cb={cb} />
            </div>
            <ThreadReplies
              parentId={reply.id}
              depth={depth + 1}
              childrenMap={childrenMap}
              cb={cb}
              hoveredMsgId={hoveredMsgId}
            />
          </div>
        );
      })}
    </div>
  );
}
