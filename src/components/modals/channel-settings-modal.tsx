"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  XIcon as X,
  HashIcon as Hash,
  LockIcon as Lock,
  TrashIcon as Trash2,
  SignOutIcon as LogOut,
  ClockIcon as Clock,
  PeopleIcon as Users,
  InfoIcon as Info,
  GearIcon as Settings,
  CopyIcon as Copy,
  CheckIcon as Check,
  MuteIcon as BellOff,
  UnmuteIcon as Bell,
} from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface ChannelSettingsModalProps {
  open: boolean;
  onClose: () => void;
  channel: {
    id: string;
    short_id: string;
    name: string;
    description: string | null;
    is_private: boolean;
    is_archived: boolean;
    created_by: string | null;
    created_at: string;
  };
  boxShortId: string;
  currentUserId: string;
  isBoxAdmin: boolean;
}

export function ChannelSettingsModal({
  open,
  onClose,
  channel,
  boxShortId,
  currentUserId,
  isBoxAdmin,
}: ChannelSettingsModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"about" | "settings">("about");
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [isPrivate, setIsPrivate] = useState(channel.is_private);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const isCreator = channel.created_by === currentUserId;
  const canEdit = isBoxAdmin || isCreator;
  const canDelete = isBoxAdmin || isCreator;

  useEffect(() => {
    if (open) {
      setName(channel.name);
      setDescription(channel.description || "");
      setIsPrivate(channel.is_private);
      setError("");
      setConfirmDelete(false);
      setTab("about");

      // Fetch channel stats
      fetch(`/api/channels/${channel.id}/stats`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            setMemberCount(data.member_count ?? null);
            setMessageCount(data.message_count ?? null);
            setCreatorName(data.creator_name ?? null);
          }
        })
        .catch(() => {});
    }
  }, [open, channel]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !canEdit) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: slug || name.trim(),
          description: description.trim() || null,
          is_private: isPrivate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update channel");
        setLoading(false);
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        onClose();
        if (data.redirect_channel_short_id) {
          router.push(`/box/${boxShortId}/c/${data.redirect_channel_short_id}`);
        } else {
          router.push(`/box/${boxShortId}`);
        }
        router.refresh();
      } else {
        setError(data.error || "Failed to delete channel");
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      const res = await fetch(
        `/api/channels/${channel.id}/members?user_id=${currentUserId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        onClose();
        router.push(`/box/${boxShortId}`);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to leave channel");
      }
    } finally {
      setLeaving(false);
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/box/${boxShortId}/c/${channel.short_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs = [
    { key: "about" as const, label: "About", icon: Info },
    ...(canEdit ? [{ key: "settings" as const, label: "Settings", icon: Settings }] : []),
  ];

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[480px] rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <div className="flex items-center gap-2">
            {channel.is_private ? (
              <Lock className="h-4 w-4 text-[#555]" />
            ) : (
              <Hash className="h-4 w-4 text-[#555]" />
            )}
            <h2 className="text-[16px] font-bold text-white">#{channel.name}</h2>
          </div>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-[#1a1a1a] px-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? "border-white text-white"
                  : "border-transparent text-[#555] hover:text-[#999]"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* About tab */}
        {tab === "about" && (
          <div className="max-h-[400px] overflow-y-auto">
            {/* Description */}
            <div className="border-b border-[#1a1a1a] px-5 py-4">
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-[#555]">
                Description
              </label>
              <p className="text-[14px] leading-relaxed text-[#ccc]">
                {channel.description || "No description set for this channel."}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-px border-b border-[#1a1a1a] bg-[#1a1a1a]">
              <div className="bg-[#111] px-4 py-3 text-center">
                <div className="text-[18px] font-bold text-white">
                  {memberCount ?? "—"}
                </div>
                <div className="text-[11px] text-[#555]">Members</div>
              </div>
              <div className="bg-[#111] px-4 py-3 text-center">
                <div className="text-[18px] font-bold text-white">
                  {messageCount !== null ? (messageCount > 999 ? `${(messageCount / 1000).toFixed(1)}k` : messageCount) : "—"}
                </div>
                <div className="text-[11px] text-[#555]">Messages</div>
              </div>
              <div className="bg-[#111] px-4 py-3 text-center">
                <div className="text-[18px] font-bold text-white">
                  {channel.is_private ? "Private" : "Public"}
                </div>
                <div className="text-[11px] text-[#555]">Visibility</div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center gap-3 text-[13px]">
                <Clock className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                <span className="text-[#999]">
                  Created{" "}
                  {new Date(channel.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {creatorName && (
                <div className="flex items-center gap-3 text-[13px]">
                  <Users className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                  <span className="text-[#999]">
                    Created by <span className="text-white">{creatorName}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-[#1a1a1a] px-5 py-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[#22c55e]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                onClick={() => setMuted(!muted)}
                className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] transition-colors ${
                  muted
                    ? "bg-[#1a1a1a] text-[#f59e0b]"
                    : "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                }`}
              >
                {muted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                {muted ? "Muted" : "Mute"}
              </button>
              {channel.is_private && (
                <button
                  onClick={() => setLeaveConfirmOpen(true)}
                  disabled={leaving}
                  className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] text-[#888] transition-colors hover:bg-[#1a1515] hover:text-[#f59e0b] disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {leaving ? "Leaving..." : "Leave"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Settings tab (admin/creator only) */}
        {tab === "settings" && canEdit && (
          <div>
            <form onSubmit={handleSave} className="px-5 py-4">
              <div className="space-y-4">
                {/* Channel type toggle */}
                <div>
                  <label className="mb-[6px] block text-[14px] font-medium text-white">
                    Channel type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`flex flex-1 items-center gap-2 rounded-[8px] border-2 px-3 py-2.5 text-left transition-colors ${
                        !isPrivate
                          ? "border-white bg-[#1a1a1a]"
                          : "border-transparent bg-[#0f0f0f] hover:bg-[#141414]"
                      }`}
                    >
                      <Hash className={`h-4 w-4 ${!isPrivate ? "text-white" : "text-[#555]"}`} />
                      <div>
                        <div className={`text-[13px] font-medium ${!isPrivate ? "text-white" : "text-[#888]"}`}>Public</div>
                        <div className="text-[11px] text-[#555]">Anyone in the Box</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`flex flex-1 items-center gap-2 rounded-[8px] border-2 px-3 py-2.5 text-left transition-colors ${
                        isPrivate
                          ? "border-white bg-[#1a1a1a]"
                          : "border-transparent bg-[#0f0f0f] hover:bg-[#141414]"
                      }`}
                    >
                      <Lock className={`h-4 w-4 ${isPrivate ? "text-white" : "text-[#555]"}`} />
                      <div>
                        <div className={`text-[13px] font-medium ${isPrivate ? "text-white" : "text-[#888]"}`}>Private</div>
                        <div className="text-[11px] text-[#555]">Invite only</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <Input
                  ref={nameRef}
                  id="channel-name"
                  label="Channel name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={error || undefined}
                />

                {slug && slug !== channel.name && (
                  <div className="rounded-[8px] bg-[#0a0a0a] px-3 py-1.5">
                    <span className="text-[12px] text-[#555]">
                      Will be renamed to{" "}
                      <span className="font-medium text-[#888]">#{slug}</span>
                    </span>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label
                    htmlFor="channel-desc"
                    className="mb-[6px] block text-[14px] font-medium text-white"
                  >
                    Description{" "}
                    <span className="font-normal text-[#555]">(optional)</span>
                  </label>
                  <textarea
                    id="channel-desc"
                    placeholder="What is this channel about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-[10px] text-[14px] text-white placeholder:text-[#666] focus:border-white focus:bg-[#222] focus:outline-none"
                  />
                </div>
              </div>

              {/* Save */}
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={loading}
                  disabled={!name.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </form>

            {/* Danger zone */}
            {canDelete && (
              <div className="border-t border-[#1a1a1a] px-5 py-3">
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-wide text-[#555]">
                  Danger Zone
                </label>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] transition-colors disabled:opacity-50 ${
                    confirmDelete
                      ? "bg-[#de1135] text-white hover:bg-[#c00f2e]"
                      : "text-[#888] hover:bg-[#2a1520] hover:text-[#de1135]"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "Delete Channel"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        onConfirm={() => {
          setLeaveConfirmOpen(false);
          handleLeave();
        }}
        title={`Leave #${channel.name}?`}
        description="You'll need to be re-invited to rejoin this private channel."
        confirmLabel="Leave"
        confirmVariant="danger"
        loading={leaving}
      />
    </div>
  );
}
