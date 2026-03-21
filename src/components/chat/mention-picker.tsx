"use client";

import { useState, useEffect, useRef } from "react";
import { PersonIcon as User, HashIcon as Hash, PeopleIcon as Users, LockIcon as Lock } from "@primer/octicons-react";
import type { MemberData, SidebarChannel } from "@/lib/chat-helpers";

export interface SpecialMention {
  handle: "all" | "here" | "channel";
  label: string;
  description: string;
}

export const SPECIAL_MENTIONS: SpecialMention[] = [
  { handle: "all", label: "@all", description: "Notify everyone in this channel" },
  { handle: "here", label: "@here", description: "Notify online members" },
  { handle: "channel", label: "@channel", description: "Notify everyone in this channel" },
];

export interface MentionItem {
  type: "user" | "channel";
  id: string;
  label: string;
  sublabel: string;
  avatarUrl?: string | null;
  initials: string;
  isPrivate?: boolean;
  raw: MemberData | SidebarChannel;
}

interface MentionPickerProps {
  members: MemberData[];
  channels?: SidebarChannel[];
  query: string;
  onSelectMember: (member: MemberData) => void;
  onSelectChannel: (channel: SidebarChannel) => void;
  onSelectSpecial?: (mention: SpecialMention) => void;
  onClose: () => void;
}

function buildItems(
  members: MemberData[],
  channels: SidebarChannel[],
  query: string
): MentionItem[] {
  const q = query.toLowerCase();

  const userItems: MentionItem[] = members
    .filter(
      (m) =>
        (m.username?.toLowerCase().includes(q) ?? false) ||
        (m.full_name?.toLowerCase().includes(q) ?? false) ||
        m.email.toLowerCase().includes(q)
    )
    .map((m) => ({
      type: "user" as const,
      id: m.user_id,
      label: m.full_name || m.email,
      sublabel: `@${m.username || m.email.split("@")[0]}`,
      avatarUrl: m.avatar_url,
      initials: m.full_name
        ? m.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : m.email[0]?.toUpperCase() || "?",
      raw: m,
    }));

  const channelItems: MentionItem[] = channels
    .filter(
      (c) =>
        !c.is_archived &&
        c.name.toLowerCase().includes(q)
    )
    .map((c) => ({
      type: "channel" as const,
      id: c.id,
      label: c.name,
      sublabel: c.description || (c.is_private ? "Private channel" : "Channel"),
      isPrivate: c.is_private,
      initials: "#",
      raw: c,
    }));

  return [...userItems, ...channelItems];
}

export function MentionPicker({
  members,
  channels = [],
  query,
  onSelectMember,
  onSelectChannel,
  onSelectSpecial,
  onClose,
}: MentionPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = buildItems(members, channels, query);

  // Filter special mentions by query
  const q = query.toLowerCase();
  const specialItems = SPECIAL_MENTIONS.filter(
    (s) => s.handle.includes(q) || s.label.includes(q)
  );

  // Group items by type for section headers
  const userItems = items.filter((i) => i.type === "user");
  const channelItems = items.filter((i) => i.type === "channel");

  // Flat list for keyboard navigation: specials first, then users, then channels
  const totalSpecial = specialItems.length;
  const flatItems = [...userItems, ...channelItems];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const totalItems = totalSpecial + flatItems.length;

  useEffect(() => {
    if (totalItems === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, totalItems - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (selectedIndex < totalSpecial) {
          onSelectSpecial?.(specialItems[selectedIndex]);
        } else {
          const item = flatItems[selectedIndex - totalSpecial];
          if (item?.type === "user") {
            onSelectMember(item.raw as MemberData);
          } else if (item?.type === "channel") {
            onSelectChannel(item.raw as SidebarChannel);
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [flatItems, specialItems, totalSpecial, totalItems, selectedIndex, onSelectMember, onSelectChannel, onSelectSpecial, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const items = listRef.current?.querySelectorAll("[data-mention-item]");
    const el = items?.[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // No results at all
  if (totalItems === 0) return null;

  let globalIndex = 0;

  return (
    <div
      className="absolute bottom-full left-0 z-50 mb-1 max-h-[280px] w-[280px] overflow-auto rounded-[8px] border border-[#2a2a2a] bg-[#111] py-1 shadow-xl"
      ref={listRef}
    >
      {/* Special mentions section */}
      {specialItems.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            <Users className="h-3 w-3 text-[#555]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]">
              Special
            </span>
          </div>
          {specialItems.map((item) => {
            const idx = globalIndex++;
            return (
              <button
                key={item.handle}
                data-mention-item
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectSpecial?.(item);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] ${
                  idx === selectedIndex
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#999] hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a1f00] text-[10px] font-bold text-[#d4a843]">
                  @
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[#d4a843]">
                    {item.label}
                  </div>
                  <div className="truncate text-[11px] text-[#555]">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </>
      )}

      {/* Users section */}
      {userItems.length > 0 && (
        <>
          {specialItems.length > 0 && (
            <div className="mx-3 my-1 border-t border-[#1a1a1a]" />
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            <User className="h-3 w-3 text-[#555]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]">
              Users
            </span>
          </div>
          {userItems.map((item) => {
            const idx = globalIndex++;
            return (
              <button
                key={item.id}
                data-mention-item
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectMember(item.raw as MemberData);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] ${
                  idx === selectedIndex
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#999] hover:bg-[#1a1a1a]"
                }`}
              >
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#222] text-[8px] font-bold text-white">
                    {item.initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">
                    {item.label}
                  </div>
                  <div className="truncate text-[11px] text-[#555]">
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </>
      )}

      {/* Channels section */}
      {channelItems.length > 0 && (
        <>
          {(userItems.length > 0 || specialItems.length > 0) && (
            <div className="mx-3 my-1 border-t border-[#1a1a1a]" />
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            <Users className="h-3 w-3 text-[#555]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]">
              Channels
            </span>
          </div>
          {channelItems.map((item) => {
            const idx = globalIndex++;
            return (
              <button
                key={item.id}
                data-mention-item
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectChannel(item.raw as SidebarChannel);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] ${
                  idx === selectedIndex
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#999] hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#222] text-[#888]">
                  {item.isPrivate ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Hash className="h-3 w-3" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">
                    {item.label}
                  </div>
                  <div className="truncate text-[11px] text-[#555]">
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
