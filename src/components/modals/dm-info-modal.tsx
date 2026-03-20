"use client";

import { useState, useEffect, useRef } from "react";
import {
  XIcon as X,
  MuteIcon as BellOff,
  UnmuteIcon as Bell,
  TrashIcon as Trash2,
  PencilIcon as Pencil,
  CheckIcon as Check,
  PersonIcon as UserIcon,
  ClockIcon as Clock,
  MailIcon as Mail,
} from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface Participant {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  username?: string;
}

interface DmInfoModalProps {
  open: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    short_id: string;
    is_group: boolean;
    name: string | null;
    created_at: string;
    participants: Participant[];
  };
  currentUserId: string;
  displayName: string;
}

export function DmInfoModal({
  open,
  onClose,
  conversation,
  currentUserId,
  displayName,
}: DmInfoModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const otherParticipants = conversation.participants.filter(
    (p) => p.user_id !== currentUserId
  );
  const isSelfDm = otherParticipants.length === 0;
  const primaryContact = otherParticipants[0] || null;

  // Nickname state
  const [nickname, setNickname] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const nicknameRef = useRef<HTMLInputElement>(null);

  // Group name state
  const [groupName, setGroupName] = useState(conversation.name || "");
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [savingGroupName, setSavingGroupName] = useState(false);
  const groupNameRef = useRef<HTMLInputElement>(null);

  // Mute state
  const [muted, setMuted] = useState(false);

  // Load nickname
  useEffect(() => {
    if (!open || !primaryContact) return;
    fetch(`/api/contacts/nickname?contact_user_id=${primaryContact.user_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.nickname) {
          setNickname(data.nickname);
          setNicknameInput(data.nickname);
        } else {
          setNickname("");
          setNicknameInput("");
        }
      })
      .catch(() => {});
  }, [open, primaryContact]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  function getInitials(name: string, email: string) {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "?";
  }

  async function saveNickname() {
    if (!primaryContact) return;
    setSavingNickname(true);
    try {
      const res = await fetch("/api/contacts/nickname", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_user_id: primaryContact.user_id,
          nickname: nicknameInput.trim() || null,
        }),
      });
      const data = await res.json();
      setNickname(data.nickname || "");
      setEditingNickname(false);
    } catch {
      // silent
    } finally {
      setSavingNickname(false);
    }
  }

  async function saveGroupName() {
    setSavingGroupName(true);
    try {
      await fetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() || null }),
      });
      setEditingGroupName(false);
    } catch {
      // silent
    } finally {
      setSavingGroupName(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[440px] rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <h2 className="text-[16px] font-bold text-white">
            {isSelfDm ? "Saved Messages" : conversation.is_group ? "Group Info" : "Conversation Info"}
          </h2>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Profile section */}
        {!isSelfDm && !conversation.is_group && primaryContact && (
          <div className="flex flex-col items-center border-b border-[#1a1a1a] px-5 py-6">
            {primaryContact.avatar_url ? (
              <img
                src={primaryContact.avatar_url}
                alt=""
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a] text-[20px] font-bold text-white">
                {getInitials(primaryContact.full_name, primaryContact.email)}
              </div>
            )}
            <h3 className="mt-3 text-[16px] font-semibold text-white">
              {nickname || primaryContact.full_name || primaryContact.email}
            </h3>
            {nickname && (
              <span className="text-[13px] text-[#555]">
                {primaryContact.full_name}
              </span>
            )}
            {primaryContact.username && (
              <span className="mt-0.5 text-[13px] text-[#555]">
                @{primaryContact.username}
              </span>
            )}
          </div>
        )}

        {/* Group header */}
        {conversation.is_group && (
          <div className="border-b border-[#1a1a1a] px-5 py-4">
            <div className="flex items-center justify-between">
              {editingGroupName ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    ref={groupNameRef}
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveGroupName();
                      if (e.key === "Escape") setEditingGroupName(false);
                    }}
                    autoFocus
                    className="flex-1 rounded-[6px] border border-[#333] bg-[#1a1a1a] px-2 py-1.5 text-[14px] text-white focus:border-white focus:outline-none"
                    placeholder="Group name"
                  />
                  <button
                    onClick={saveGroupName}
                    disabled={savingGroupName}
                    className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-white text-black transition-colors hover:bg-[#ddd]"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-[15px] font-semibold text-white">
                    {conversation.name || displayName}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingGroupName(true);
                      setTimeout(() => groupNameRef.current?.focus(), 50);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Contact nickname (1:1 DMs only) */}
        {!isSelfDm && !conversation.is_group && primaryContact && (
          <div className="border-b border-[#1a1a1a] px-5 py-3">
            <label className="mb-2 block text-[12px] font-medium uppercase tracking-wide text-[#555]">
              Contact Nickname
            </label>
            {editingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  ref={nicknameRef}
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveNickname();
                    if (e.key === "Escape") {
                      setEditingNickname(false);
                      setNicknameInput(nickname);
                    }
                  }}
                  autoFocus
                  className="flex-1 rounded-[6px] border border-[#333] bg-[#1a1a1a] px-2.5 py-1.5 text-[14px] text-white placeholder:text-[#444] focus:border-white focus:outline-none"
                  placeholder={primaryContact.full_name}
                />
                <button
                  onClick={saveNickname}
                  disabled={savingNickname}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-white text-black transition-colors hover:bg-[#ddd]"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditingNickname(false);
                    setNicknameInput(nickname);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingNickname(true);
                  setTimeout(() => nicknameRef.current?.focus(), 50);
                }}
                className="flex w-full items-center justify-between rounded-[6px] px-2.5 py-2 text-left transition-colors hover:bg-[#1a1a1a]"
              >
                <span className={`text-[14px] ${nickname ? "text-white" : "text-[#555]"}`}>
                  {nickname || "Set a nickname..."}
                </span>
                <Pencil className="h-3 w-3 text-[#555]" />
              </button>
            )}
            <p className="mt-1.5 text-[11px] text-[#444]">
              Only you will see this nickname
            </p>
          </div>
        )}

        {/* Details section */}
        <div className="border-b border-[#1a1a1a] px-5 py-3">
          {!isSelfDm && primaryContact && !conversation.is_group && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-[13px]">
                <Mail className="h-3.5 w-3.5 text-[#555]" />
                <span className="text-[#999]">{primaryContact.email}</span>
              </div>
              {primaryContact.username && (
                <div className="flex items-center gap-3 text-[13px]">
                  <UserIcon className="h-3.5 w-3.5 text-[#555]" />
                  <span className="text-[#999]">@{primaryContact.username}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-[13px]">
                <Clock className="h-3.5 w-3.5 text-[#555]" />
                <span className="text-[#999]">
                  Conversation started{" "}
                  {new Date(conversation.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Group participants */}
          {conversation.is_group && (
            <div>
              <span className="mb-2 block text-[12px] font-medium uppercase tracking-wide text-[#555]">
                {conversation.participants.length} Members
              </span>
              <div className="space-y-1">
                {conversation.participants.map((p) => (
                  <div key={p.user_id} className="flex items-center gap-2.5 rounded-[6px] px-2 py-1.5">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-[9px] font-bold text-white">
                        {getInitials(p.full_name, p.email)}
                      </div>
                    )}
                    <span className="text-[13px] text-white">
                      {p.full_name || p.email}
                      {p.user_id === currentUserId && (
                        <span className="ml-1 text-[#555]">(you)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSelfDm && (
            <div className="flex items-center gap-3 text-[13px]">
              <Clock className="h-3.5 w-3.5 text-[#555]" />
              <span className="text-[#999]">
                Your private space for notes, bookmarks, and reminders
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 py-3">
          <button
            onClick={() => setMuted(!muted)}
            className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] transition-colors ${
              muted
                ? "bg-[#1a1a1a] text-[#f59e0b]"
                : "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
            }`}
          >
            {muted ? (
              <BellOff className="h-3.5 w-3.5" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
            {muted ? "Muted" : "Mute"}
          </button>
        </div>
      </div>
    </div>
  );
}
