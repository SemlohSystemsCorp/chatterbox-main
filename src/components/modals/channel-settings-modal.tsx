"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { XIcon as X, HashIcon as Hash, LockIcon as Lock, TrashIcon as Trash2, SignOutIcon as LogOut } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [isPrivate, setIsPrivate] = useState(channel.is_private);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
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
      setTimeout(() => nameRef.current?.focus(), 50);
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
        // Redirect to general (or first available) channel
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
    if (!confirm(`Leave #${channel.name}? You'll need to be re-invited to rejoin.`)) return;
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
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info */}
        <div className="border-b border-[#1a1a1a] px-5 py-3">
          <div className="flex items-center gap-4 text-[12px] text-[#555]">
            <span>Created {new Date(channel.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span>{channel.is_private ? "Private" : "Public"} channel</span>
          </div>
        </div>

        {/* Edit form (only for admins/creators) */}
        {canEdit ? (
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
        ) : (
          <div className="px-5 py-4">
            <p className="text-[13px] text-[#555]">
              {channel.description || "No description set for this channel."}
            </p>
          </div>
        )}

        {/* Danger zone */}
        <div className="border-t border-[#1a1a1a] px-5 py-3">
          <div className="flex items-center gap-2">
            {/* Leave channel (private channels only, non-admin) */}
            {channel.is_private && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] text-[#888] transition-colors hover:bg-[#1a1515] hover:text-[#f59e0b] disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                {leaving ? "Leaving..." : "Leave Channel"}
              </button>
            )}

            {canDelete && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
