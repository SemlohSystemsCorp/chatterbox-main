"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { GearIcon as Settings, CommentDiscussionIcon as MessageSquare, PersonAddIcon as UserPlus, SignOutIcon as LogOut, SignOutIcon as DoorOpen, SmileyIcon as Smile, XIcon as X, ClockIcon as Clock } from "@primer/octicons-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getInitials, type UserData } from "@/lib/chat-helpers";

interface UserPopoverProps {
  user: UserData;
  isAdmin: boolean;
  onInvite?: () => void;
  /** If provided, shows "Leave Box" option (hidden for owner/admin) */
  boxId?: string;
  boxName?: string;
  boxRole?: string;
  /** Full UUID of the current channel — used to post status system messages */
  currentChannelId?: string;
}

const STATUS_PRESETS = [
  { emoji: "📅", text: "In a meeting", duration: 60 },
  { emoji: "🚗", text: "Commuting", duration: 30 },
  { emoji: "🤒", text: "Out sick", duration: null },
  { emoji: "🌴", text: "On vacation", duration: null },
  { emoji: "🎯", text: "Focusing", duration: 120 },
  { emoji: "🏠", text: "Working remotely", duration: null },
];

const DURATION_OPTIONS = [
  { label: "Don't clear", value: null },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "Today", value: "today" as const },
];

export function UserPopover({ user, isAdmin, onInvite, boxId, boxName, boxRole, currentChannelId }: UserPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Status form state
  const [statusEmoji, setStatusEmoji] = useState(user.statusEmoji || "");
  const [statusText, setStatusText] = useState(user.statusText || "");
  const [statusDuration, setStatusDuration] = useState<number | "today" | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  // Current active status display
  const hasActiveStatus = user.statusText && (!user.statusExpiresAt || new Date(user.statusExpiresAt) > new Date());

  const canLeaveBox = boxId && boxRole && !["owner", "admin"].includes(boxRole);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setStatusModalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleLeaveBox() {
    if (!boxId || leaving) return;
    const confirmed = window.confirm(
      `Are you sure you want to leave ${boxName || "this Box"}? You will lose access to all channels and messages.`
    );
    if (!confirmed) return;

    setLeaving(true);
    try {
      const res = await fetch(`/api/boxes/${boxId}/leave`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to leave Box");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  async function handleSetStatus() {
    if (savingStatus) return;
    setSavingStatus(true);

    let expiresAt: string | null = null;
    if (statusDuration === "today") {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      expiresAt = endOfDay.toISOString();
    } else if (typeof statusDuration === "number") {
      expiresAt = new Date(Date.now() + statusDuration * 60 * 1000).toISOString();
    }

    try {
      await fetch("/api/profile/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_text: statusText.trim() || null,
          status_emoji: statusEmoji || null,
          status_expires_at: expiresAt,
          channel_id: currentChannelId || undefined,
          sender_name: user.fullName,
        }),
      });
      setStatusModalOpen(false);
      setOpen(false);
      router.refresh();
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleClearStatus() {
    setSavingStatus(true);
    try {
      await fetch("/api/profile/status", { method: "DELETE" });
      setStatusText("");
      setStatusEmoji("");
      setStatusModalOpen(false);
      setOpen(false);
      router.refresh();
    } finally {
      setSavingStatus(false);
    }
  }

  function openStatusModal() {
    setStatusEmoji(user.statusEmoji || "");
    setStatusText(user.statusText || "");
    setStatusDuration(null);
    setStatusModalOpen(true);
  }

  function applyPreset(preset: { emoji: string; text: string; duration: number | null }) {
    setStatusEmoji(preset.emoji);
    setStatusText(preset.text);
    setStatusDuration(preset.duration);
  }

  return (
    <div className="relative border-t border-[#1a1a1a]" ref={ref}>
      {/* Status modal */}
      {statusModalOpen && (
        <div className="absolute bottom-full left-2 right-2 z-50 mb-1 rounded-[10px] border border-[#1a1a1a] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-2.5">
            <span className="text-[13px] font-medium text-white">Set status</span>
            <button
              onClick={() => setStatusModalOpen(false)}
              className="flex h-5 w-5 items-center justify-center rounded text-[#555] hover:text-white"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Status input */}
          <div className="border-b border-[#1a1a1a] px-3 py-2.5">
            <div className="flex items-center gap-2 rounded-[6px] border border-[#1a1a1a] bg-[#0a0a0a] px-2.5 py-2">
              <button
                onClick={() => {
                  const emojis = ["😀", "😊", "🎯", "💡", "🔥", "✨", "🚀", "☕", "📅", "🌴", "🤒", "🏠", "🎉", "💪", "🧠"];
                  const current = emojis.indexOf(statusEmoji);
                  setStatusEmoji(emojis[(current + 1) % emojis.length]);
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[16px] hover:bg-[#1a1a1a]"
              >
                {statusEmoji || <Smile className="h-4 w-4 text-[#555]" />}
              </button>
              <input
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="What's your status?"
                className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#555] focus:outline-none"
                maxLength={100}
                autoFocus
              />
            </div>
          </div>

          {/* Presets */}
          <div className="border-b border-[#1a1a1a] px-3 py-2">
            <div className="space-y-0.5">
              {STATUS_PRESETS.map((preset) => (
                <button
                  key={preset.text}
                  onClick={() => applyPreset(preset)}
                  className="flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-[12px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.text}</span>
                  {preset.duration && (
                    <span className="ml-auto text-[10px] text-[#444]">
                      {preset.duration >= 60 ? `${preset.duration / 60}h` : `${preset.duration}m`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="border-b border-[#1a1a1a] px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-[#555]">
              <Clock className="h-3 w-3" />
              Clear after
            </div>
            <div className="flex flex-wrap gap-1">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setStatusDuration(opt.value)}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                    statusDuration === opt.value
                      ? "bg-white text-black"
                      : "bg-[#1a1a1a] text-[#888] hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-3 py-2.5">
            {hasActiveStatus && (
              <button
                onClick={handleClearStatus}
                disabled={savingStatus}
                className="flex-1 rounded-[6px] border border-[#1a1a1a] py-1.5 text-[12px] font-medium text-[#888] transition-colors hover:text-white disabled:opacity-50"
              >
                Clear status
              </button>
            )}
            <button
              onClick={handleSetStatus}
              disabled={savingStatus || !statusText.trim()}
              className="flex-1 rounded-[6px] bg-white py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              {savingStatus ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Main popover */}
      {open && !statusModalOpen && (
        <div className="absolute bottom-full left-2 right-2 z-50 mb-1 rounded-[10px] border border-[#1a1a1a] bg-[#111] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="border-b border-[#1a1a1a] px-3 py-2.5">
            <div className="text-[13px] font-medium text-white">
              {user.fullName || user.email}
            </div>
            <div className="text-[11px] text-[#555]">{user.email}</div>
          </div>

          {/* Status section */}
          <div className="border-b border-[#1a1a1a] py-1">
            <button
              onClick={openStatusModal}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Smile className="h-3.5 w-3.5" />
              {hasActiveStatus ? (
                <span className="flex-1 truncate text-left">
                  {user.statusEmoji ? `${user.statusEmoji} ` : ""}{user.statusText}
                </span>
              ) : (
                "Set status"
              )}
            </button>
          </div>

          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              All Boxes
            </Link>
            {isAdmin && onInvite && (
              <button
                onClick={() => {
                  setOpen(false);
                  onInvite();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Invite People
              </button>
            )}
          </div>
          <div className="border-t border-[#1a1a1a] py-1">
            {canLeaveBox && (
              <button
                onClick={handleLeaveBox}
                disabled={leaving}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-[#f59e0b] disabled:opacity-50"
              >
                <DoorOpen className="h-3.5 w-3.5" />
                {leaving ? "Leaving…" : "Leave Box"}
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-[#de1135]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 p-2.5 px-3 transition-colors hover:bg-[#111]"
      >
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
              {getInitials(user.fullName, user.email)}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0a0a] bg-[#22c55e]" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-[13px] font-medium text-white">
            {user.fullName || user.email}
          </div>
          <div className="truncate text-[11px] text-[#555]">
            {hasActiveStatus
              ? `${user.statusEmoji ? user.statusEmoji + " " : ""}${user.statusText}`
              : "Online"}
          </div>
        </div>
      </button>
    </div>
  );
}
