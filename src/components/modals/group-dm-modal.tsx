"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon as X, SearchIcon as Search, CheckIcon as Check, PeopleIcon as Users } from "@primer/octicons-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

interface Member {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface GroupDmModalProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
  currentUserId: string;
  boxShortId?: string;
}

export function GroupDmModal({
  open,
  onClose,
  members,
  currentUserId,
  boxShortId,
}: GroupDmModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const otherMembers = members.filter((m) => m.user_id !== currentUserId);

  const filtered = search.trim()
    ? otherMembers.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
      )
    : otherMembers;

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected([]);
      setGroupName("");
      setCreating(false);
      setError("");
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function toggleMember(userId: string) {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
    setError("");
  }

  async function handleCreate() {
    if (selected.length < 2) {
      setError("Select at least 2 people");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/conversations/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_ids: selected,
          name: groupName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create group DM");
        setCreating(false);
        return;
      }

      onClose();
      router.push(`/dm/${data.short_id}${boxShortId ? `?box=${boxShortId}` : ""}`);
    } catch {
      setError("Something went wrong");
      setCreating(false);
    }
  }

  if (!open) return null;

  const selectedMembers = otherMembers.filter((m) => selected.includes(m.user_id));

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="flex w-full max-w-[480px] flex-col rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <h2 className="text-[16px] font-bold text-white">New Group DM</h2>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Group name (optional) */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#777]">
              Group name (optional)
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Design Team"
              maxLength={50}
              className="h-9 w-full rounded-[8px] border border-[#1a1a1a] bg-[#0a0a0a] px-3 text-[13px] text-white placeholder:text-[#444] focus:border-[#333] focus:outline-none"
            />
          </div>

          {/* Selected chips */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map((m) => (
                <Tooltip label={`Remove ${m.full_name || m.email}`}>
                  <button
                    key={m.user_id}
                    onClick={() => toggleMember(m.user_id)}
                    className="flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2.5 py-1 text-[12px] text-[#ccc] transition-colors hover:bg-[#252525]"
                  >
                    {m.full_name || m.email}
                    <X className="h-3 w-3 text-[#555]" />
                  </button>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="h-9 w-full rounded-[8px] border border-[#1a1a1a] bg-[#0a0a0a] pl-9 pr-3 text-[13px] text-white placeholder:text-[#444] focus:border-[#333] focus:outline-none"
            />
          </div>

          {/* Member list */}
          <div className="max-h-[240px] overflow-auto space-y-0.5">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[#555]">
                {search.trim() ? "No members match" : "No members available"}
              </p>
            ) : (
              filtered.map((m) => {
                const isSelected = selected.includes(m.user_id);
                const initials = m.full_name
                  ? m.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : m.email[0].toUpperCase();

                return (
                  <button
                    key={m.user_id}
                    onClick={() => toggleMember(m.user_id)}
                    className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-[#1a1a1a]"
                        : "hover:bg-[#0f0f0f]"
                    }`}
                  >
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full"
                      />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-white">
                        {m.full_name || m.email}
                      </span>
                      {m.full_name && (
                        <span className="block truncate text-[11px] text-[#555]">
                          {m.email}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                        isSelected
                          ? "border-white bg-white"
                          : "border-[#333] bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-black" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {error && (
            <p className="text-[12px] text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1a1a1a] px-5 py-3">
          <div className="flex items-center gap-1.5 text-[12px] text-[#555]">
            <Users className="h-3.5 w-3.5" />
            {selected.length + 1} members
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={selected.length < 2 || creating}
            >
              {creating ? (
                <>
                  <Spinner size="xs" className="mr-1.5" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
