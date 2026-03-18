"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon as X, SearchIcon as Search, CheckIcon as Check, PersonAddIcon as UserPlus, LockIcon as Lock, TrophyIcon as Crown, ShieldIcon as Shield } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";

interface MemberData {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  username: string;
  role?: string;
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

interface AddToChannelModalProps {
  open: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  /** All box members */
  boxMembers: MemberData[];
  /** Current channel members */
  channelMembers: ChannelMemberData[];
  /** Called after members are added */
  onMembersAdded: (newMembers: ChannelMemberData[]) => void;
  /** Called after a member is removed */
  onMemberRemoved: (userId: string) => void;
}

export function AddToChannelModal({
  open,
  onClose,
  channelId,
  channelName,
  boxMembers,
  channelMembers,
  onMembersAdded,
  onMemberRemoved,
}: AddToChannelModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [tab, setTab] = useState<"add" | "current">("add");
  const searchRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const channelMemberIds = new Set(channelMembers.map((m) => m.user_id));

  // Members not yet in the channel
  const availableMembers = boxMembers.filter(
    (m) => !channelMemberIds.has(m.user_id)
  );

  const filtered = search.trim()
    ? availableMembers.filter(
        (m) =>
          m.full_name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase()) ||
          m.username.toLowerCase().includes(search.toLowerCase())
      )
    : availableMembers;

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected(new Set());
      setTab(channelMembers.length > 0 ? "current" : "add");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, channelMembers.length]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  function toggleSelect(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  async function handleAdd() {
    if (selected.size === 0) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: Array.from(selected) }),
      });
      if (res.ok) {
        // Build new member entries from the selected box members
        const newMembers: ChannelMemberData[] = Array.from(selected)
          .map((uid) => {
            const bm = boxMembers.find((m) => m.user_id === uid);
            if (!bm) return null;
            return {
              id: crypto.randomUUID(),
              user_id: uid,
              added_at: new Date().toISOString(),
              full_name: bm.full_name,
              email: bm.email,
              avatar_url: bm.avatar_url,
              username: bm.username,
            };
          })
          .filter(Boolean) as ChannelMemberData[];

        onMembersAdded(newMembers);
        setSelected(new Set());
        setTab("current");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: string) {
    setRemoving(userId);
    try {
      const res = await fetch(
        `/api/channels/${channelId}/members?user_id=${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onMemberRemoved(userId);
      }
    } finally {
      setRemoving(null);
    }
  }

  function getInitials(name: string, email: string) {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
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
            <Lock className="h-4 w-4 text-[#555]" />
            <h2 className="text-[16px] font-bold text-white">
              #{channelName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a1a]">
          <button
            onClick={() => setTab("current")}
            className={`flex-1 py-2.5 text-center text-[13px] font-medium transition-colors ${
              tab === "current"
                ? "border-b-2 border-white text-white"
                : "text-[#555] hover:text-[#888]"
            }`}
          >
            Members ({channelMembers.length})
          </button>
          <button
            onClick={() => setTab("add")}
            className={`flex-1 py-2.5 text-center text-[13px] font-medium transition-colors ${
              tab === "add"
                ? "border-b-2 border-white text-white"
                : "text-[#555] hover:text-[#888]"
            }`}
          >
            Add People
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-auto px-5 py-3">
          {tab === "add" ? (
            <>
              {/* Search */}
              <div className="mb-3">
                <div className="flex items-center gap-2 rounded-[8px] bg-[#1a1a1a] px-3">
                  <Search className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members..."
                    className="h-9 w-full bg-transparent text-[13px] text-white placeholder:text-[#444] focus:outline-none"
                  />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="py-8 text-center">
                  <UserPlus className="mx-auto mb-2 h-6 w-6 text-[#333]" />
                  <p className="text-[13px] text-[#555]">
                    {availableMembers.length === 0
                      ? "All box members are already in this channel"
                      : "No members match your search"}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((member) => {
                    const isSelected = selected.has(member.user_id);
                    const initials = getInitials(member.full_name, member.email);
                    return (
                      <button
                        key={member.user_id}
                        onClick={() => toggleSelect(member.user_id)}
                        className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "bg-[#276ef1]/10"
                            : "hover:bg-[#1a1a1a]"
                        }`}
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-[11px] font-bold text-white">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-white">
                            {member.full_name || member.email}
                          </div>
                          <div className="truncate text-[11px] text-[#555]">
                            @{member.username}
                          </div>
                        </div>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors ${
                            isSelected
                              ? "border-[#276ef1] bg-[#276ef1]"
                              : "border-[#333]"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Current members tab */
            <div className="space-y-0.5">
              {channelMembers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-[#555]">
                    No members yet. Add people to get started.
                  </p>
                </div>
              ) : (
                channelMembers.map((member) => {
                  const initials = getInitials(member.full_name, member.email);
                  return (
                    <div
                      key={member.user_id}
                      className="group flex items-center gap-3 rounded-[8px] px-3 py-2 hover:bg-[#1a1a1a]"
                    >
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-[11px] font-bold text-white">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-white">
                          {member.full_name || member.email}
                        </div>
                        <div className="truncate text-[11px] text-[#555]">
                          @{member.username}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(member.user_id)}
                        disabled={removing === member.user_id}
                        className="rounded-[6px] px-2 py-1 text-[11px] text-[#555] opacity-0 transition-all hover:bg-[#2a1520] hover:text-[#de1135] group-hover:opacity-100 disabled:opacity-50"
                      >
                        {removing === member.user_id ? "..." : "Remove"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === "add" && (
          <div className="flex items-center justify-between border-t border-[#1a1a1a] px-5 py-3">
            <span className="text-[12px] text-[#555]">
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select members to add"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                loading={adding}
                disabled={selected.size === 0}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Add ({selected.size})
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
