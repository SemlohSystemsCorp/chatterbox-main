"use client";

import { useState, useCallback, useMemo } from "react";
import { PaperAirplaneIcon as Send, PlusIcon as Plus, SmileyIcon as Smile, ReplyIcon as Reply, XIcon as X, ImageIcon as Image, ClockIcon as Clock } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { EmojiPicker } from "@/components/emoji-picker";
import { GifPicker } from "@/components/gif-picker";
import { ToneAdjuster } from "@/components/chat/tone-adjuster";
import { MentionPicker } from "@/components/chat/mention-picker";
import { SlashCommandPicker } from "@/components/chat/slash-command-picker";
import { SchedulePicker } from "@/components/chat/schedule-picker";
import type { MessageData, MemberData, SidebarChannel } from "@/lib/chat-helpers";
import type { SlashCommand } from "@/lib/slash-commands";

// ── Types ──

export interface Attachment {
  url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export const MAX_MESSAGE_LENGTH = 4000;

export interface MessageComposerProps {
  placeholder: string;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  replyingTo: MessageData | null;
  onCancelReply: () => void;
  attachments: Attachment[];
  onRemoveAttachment: (index: number) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  sending: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  /** Members available for @mentions */
  members?: MemberData[];
  /** Channels available for @channel mentions */
  channels?: SidebarChannel[];
  /** Called when user picks a GIF from the picker */
  onGifSelect?: (gif: { url: string; title: string; width: number; height: number }) => void;
  /** Called when user confirms scheduling a message */
  onSchedule?: (date: Date) => void;
}

function formatScheduleTime(date: Date): string {
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Component ──

export function MessageComposer({
  placeholder,
  newMessage,
  onNewMessageChange,
  replyingTo,
  onCancelReply,
  attachments,
  onRemoveAttachment,
  inputRef,
  fileInputRef,
  uploading,
  sending,
  onInputChange,
  onKeyDown,
  onPaste,
  onFileUpload,
  onSend,
  members,
  channels,
  onGifSelect,
  onSchedule,
}: MessageComposerProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);

  // Detect slash command: only when "/" is at position 0
  const showSlashPicker = useMemo(() => {
    if (slashQuery === null) return false;
    // Only show when the message starts with "/"
    return newMessage.startsWith("/");
  }, [slashQuery, newMessage]);

  // Detect @mention and /slash triggers from input
  const handleInputChangeWithMention = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(e);

      const value = e.target.value;
      const cursor = e.target.selectionStart;

      // Detect slash command at start of input
      if (value.startsWith("/") && !value.includes("\n")) {
        const spaceIdx = value.indexOf(" ");
        if (spaceIdx === -1) {
          // Still typing the command name
          setSlashQuery(value.slice(1));
        } else {
          setSlashQuery(null);
        }
      } else {
        setSlashQuery(null);
      }

      // Look backwards from cursor for an unmatched @
      const textBeforeCursor = value.slice(0, cursor);
      const atIdx = textBeforeCursor.lastIndexOf("@");

      if (atIdx >= 0) {
        const charBefore = atIdx > 0 ? textBeforeCursor[atIdx - 1] : " ";
        const query = textBeforeCursor.slice(atIdx + 1);
        // Trigger mention if @ is at start or preceded by whitespace, and query has no spaces
        if ((charBefore === " " || charBefore === "\n" || atIdx === 0) && !query.includes(" ")) {
          setMentionQuery(query);
          setMentionStart(atIdx);
          return;
        }
      }

      setMentionQuery(null);
    },
    [onInputChange],
  );

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      onNewMessageChange(`/${cmd.name} `);
      setSlashQuery(null);
      requestAnimationFrame(() => {
        const textarea = inputRef.current;
        if (textarea) {
          const pos = cmd.name.length + 2; // "/name "
          textarea.focus();
          textarea.setSelectionRange(pos, pos);
        }
      });
    },
    [onNewMessageChange, inputRef],
  );

  const handleMentionSelect = useCallback(
    (member: MemberData) => {
      const handle = member.username || member.email.split("@")[0];
      const before = newMessage.slice(0, mentionStart);
      const after = newMessage.slice(
        mentionStart + 1 + (mentionQuery?.length ?? 0),
      );
      const updated = `${before}<@${handle}> ${after}`;
      onNewMessageChange(updated);
      setMentionQuery(null);

      requestAnimationFrame(() => {
        const textarea = inputRef.current;
        if (textarea) {
          const pos = mentionStart + `<@${handle}> `.length;
          textarea.focus();
          textarea.setSelectionRange(pos, pos);
        }
      });
    },
    [newMessage, mentionStart, mentionQuery, onNewMessageChange, inputRef],
  );

  const handleChannelSelect = useCallback(
    (channel: SidebarChannel) => {
      const before = newMessage.slice(0, mentionStart);
      const after = newMessage.slice(
        mentionStart + 1 + (mentionQuery?.length ?? 0),
      );
      const updated = `${before}#${channel.name} ${after}`;
      onNewMessageChange(updated);
      setMentionQuery(null);

      requestAnimationFrame(() => {
        const textarea = inputRef.current;
        if (textarea) {
          const pos = mentionStart + `#${channel.name} `.length;
          textarea.focus();
          textarea.setSelectionRange(pos, pos);
        }
      });
    },
    [newMessage, mentionStart, mentionQuery, onNewMessageChange, inputRef],
  );

  const handleKeyDownWithMention = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // If slash picker is open, let it handle keys
      if (slashQuery !== null && newMessage.startsWith("/")) {
        if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) {
          return;
        }
      }
      // If mention picker is open, let it handle arrow keys, enter, tab, escape
      if (mentionQuery !== null && ((members && members.length > 0) || (channels && channels.length > 0))) {
        if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) {
          return;
        }
      }
      // If in schedule mode and Enter (no shift), intercept to confirm schedule
      if (scheduledFor && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSchedule?.(scheduledFor);
        setScheduledFor(null);
        return;
      }
      onKeyDown(e);
    },
    [slashQuery, newMessage, mentionQuery, members, channels, scheduledFor, onSchedule, onKeyDown],
  );

  function handleSendClick() {
    if (scheduledFor) {
      onSchedule?.(scheduledFor);
      setScheduledFor(null);
    } else {
      onSend();
    }
  }

  const hasContent = newMessage.trim() || attachments.length > 0;
  const isDisabled = !hasContent || sending || newMessage.length > MAX_MESSAGE_LENGTH;

  return (
    <div className="shrink-0 px-4 pb-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileUpload}
        accept="image/*,.pdf,.txt,.zip,.json,.mp4,.webm,.mp3,.wav"
      />

      <div className="relative rounded-[8px] border border-[#1a1a1a] bg-[#111] focus-within:border-[#2a2a2a]">
        {/* Slash command picker */}
        {showSlashPicker && slashQuery !== null && (
          <SlashCommandPicker
            query={slashQuery}
            onSelect={handleSlashSelect}
            onClose={() => setSlashQuery(null)}
          />
        )}

        {/* Mention picker */}
        {mentionQuery !== null && members && members.length > 0 && (
          <MentionPicker
            members={members}
            channels={channels}
            query={mentionQuery}
            onSelectMember={handleMentionSelect}
            onSelectChannel={handleChannelSelect}
            onClose={() => setMentionQuery(null)}
          />
        )}

        {/* Schedule mode banner */}
        {scheduledFor && (
          <div className="flex items-center gap-2 border-b border-[#1a1a1a] px-3 py-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[#d4a843]" />
            <span className="text-[12px] text-[#d4a843]">
              Will send {formatScheduleTime(scheduledFor)}
            </span>
            <span className="text-[12px] text-[#555]">— press Send to confirm</span>
            <button
              onClick={() => setScheduledFor(null)}
              className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#555] hover:text-white"
              title="Cancel schedule"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Reply bar */}
        {replyingTo && (
          <div className="flex items-center gap-2 border-b border-[#1a1a1a] px-3 py-2">
            <Reply className="h-3.5 w-3.5 shrink-0 text-[#555]" />
            <span className="text-[12px] text-[#888]">
              Replying to{" "}
              <span className="font-semibold text-white">
                {replyingTo.sender.full_name || replyingTo.sender.email}
              </span>
            </span>
            <span className="flex-1 truncate text-[12px] text-[#555]">
              {replyingTo.content.split("\n").find((l) => !l.trim().startsWith("http")) || replyingTo.content.split("\n")[0]}
            </span>
            <button
              onClick={onCancelReply}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#555] hover:text-white"
              title="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-[#1a1a1a] px-3 py-2">
            {attachments.map((a, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[6px] border border-[#2a2a2a] bg-[#0a0a0a]"
              >
                {a.file_type.startsWith("image/") ? (
                  <img
                    src={a.url}
                    alt={a.file_name}
                    className="h-20 w-20 object-cover"
                  />
                ) : a.file_type.startsWith("video/") ? (
                  <div className="flex h-20 w-20 items-center justify-center bg-[#0a0a0a]">
                    <video
                      src={a.url}
                      muted
                      preload="metadata"
                      className="h-20 w-20 object-cover"
                    />
                  </div>
                ) : a.file_type.startsWith("audio/") ? (
                  <div className="flex h-20 w-20 flex-col items-center justify-center px-1">
                    <svg className="h-6 w-6 text-[#555]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    <span className="mt-1 max-w-full truncate text-[9px] text-[#444]">
                      {a.file_name}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 flex-col items-center justify-center px-1">
                    <span className="text-[10px] font-bold uppercase text-[#555]">
                      {a.file_name.split(".").pop()}
                    </span>
                    <span className="mt-0.5 max-w-full truncate text-[9px] text-[#444]">
                      {a.file_name}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => onRemoveAttachment(i)}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  title="Remove attachment"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end px-3 py-2">
          <Tooltip label="Attach file">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:text-white disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
            </button>
          </Tooltip>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChangeWithMention}
            onKeyDown={handleKeyDownWithMention}
            onPaste={onPaste}
            placeholder={uploading ? "Uploading..." : placeholder}
            rows={1}
            className="max-h-[160px] min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1 text-[14px] leading-[22px] text-white placeholder:text-[#555] focus:outline-none"
          />
          {onGifSelect && (
            <GifPicker onSelect={onGifSelect}>
              <Tooltip label="GIF">
                <button className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:text-white">
                  <Image className="h-5 w-5" />
                </button>
              </Tooltip>
            </GifPicker>
          )}
          <EmojiPicker
            onSelect={(emoji) => {
              onNewMessageChange(newMessage + emoji);
              inputRef.current?.focus();
            }}
          >
            <Tooltip label="Emoji">
              <button className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:text-white">
                <Smile className="h-5 w-5" />
              </button>
            </Tooltip>
          </EmojiPicker>
        </div>

        <div className="flex items-center justify-between border-t border-[#1a1a1a] px-3 py-1.5">
          <div className="flex items-center gap-3 text-[11px] text-[#444]">
            <span>
              <kbd className="rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">
                Enter
              </kbd>{" "}
              to {scheduledFor ? "schedule" : "send"} ·{" "}
              <kbd className="rounded bg-[#0a0a0a] px-1 py-0.5 text-[10px] text-[#555]">
                Shift+Enter
              </kbd>{" "}
              new line
            </span>
            {newMessage.length > MAX_MESSAGE_LENGTH * 0.8 && (
              <span className={`text-[10px] ${newMessage.length > MAX_MESSAGE_LENGTH ? "text-[#de1135]" : "text-[#555]"}`}>
                {newMessage.length}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ToneAdjuster
              text={newMessage}
              onRewrite={(text) => onNewMessageChange(text)}
            />
            {onSchedule && (
              <SchedulePicker
                onSchedule={(date) => setScheduledFor(date)}
                disabled={isDisabled}
              />
            )}
            <Tooltip label={scheduledFor ? "Confirm schedule" : "Send message"}>
              <button
                onClick={handleSendClick}
                disabled={isDisabled}
                className={`flex h-7 items-center justify-center gap-1 rounded-[6px] px-2 transition-colors disabled:bg-[#1a1a1a] disabled:text-[#555] ${
                  scheduledFor
                    ? "bg-[#d4a843] text-black hover:bg-[#c49a3a]"
                    : "bg-white text-black hover:bg-[#e0e0e0]"
                }`}
              >
                {scheduledFor ? (
                  <Clock className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
