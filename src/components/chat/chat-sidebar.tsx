"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { HashIcon as Hash, LockIcon as Lock, PlusIcon as Plus, HubotIcon as Bot, CircleIcon as Circle, CommentDiscussionIcon as MessageSquare, DeviceMobileIcon as Phone, BookmarkIcon as Bookmark, PlugIcon as Plug, GearIcon as Gear, PeopleIcon as People } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { BoxSwitcher } from "@/components/chat/box-switcher";
import { UserPopover } from "@/components/chat/user-popover";
import { createClient } from "@/lib/supabase/client";
import { useContactNames } from "@/hooks/use-contact-names";
import type {
  BoxData,
  SidebarChannel,
  MemberData,
  UserData,
} from "@/lib/chat-helpers";

export interface SidebarCall {
  id: string;
  channel_id: string | null;
  conversation_id: string | null;
  started_by: string;
  started_at: string;
  channel_name?: string;
  starter_name?: string;
}

export interface SidebarConversation {
  id: string;
  short_id: string;
  is_group: boolean;
  name: string | null;
  participants: { user_id: string; full_name: string; email: string; avatar_url: string | null }[];
}

interface ChatSidebarProps {
  user: UserData;
  boxes: BoxData[];
  box: (BoxData & { description?: string | null }) | null;
  channels: SidebarChannel[];
  members: MemberData[];
  currentUserId: string;
  /** short_id of the active channel (if on a channel page) */
  activeChannelId?: string;
  /** user_id of the active DM partner (if on a DM page) */
  activeDmUserId?: string;
  unreadCounts?: Record<string, number>;
  activeCalls?: SidebarCall[];
  getStatus: (userId: string) => string;
  onCreateChannel: () => void;
  onStartDm: (targetUserId: string) => void;
  onInvite: () => void;
  onJoinCall?: (call: SidebarCall) => void;
  dmLoading?: string | null;
  /** Full UUID of the active channel (for status system messages) */
  currentChannelId?: string;
  /** Whether the user is currently in their self-DM */
  isSelfDm?: boolean;
  /** DM conversations to display in sidebar */
  conversations?: SidebarConversation[];
  onCreateGroupDm?: () => void;
  /** Whether the user is currently on the Sherlock AI page */
  isSherlockActive?: boolean;
}

export function ChatSidebar({
  user,
  boxes,
  box,
  channels,
  members,
  currentUserId,
  activeChannelId,
  activeDmUserId,
  unreadCounts,
  activeCalls: initialCalls,
  getStatus,
  onCreateChannel,
  onStartDm,
  onInvite,
  onJoinCall,
  dmLoading,
  currentChannelId,
  isSelfDm,
  conversations,
  onCreateGroupDm,
  isSherlockActive,
}: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = box?.role === "owner" || box?.role === "admin";
  const otherMembers = members.filter((m) => m.user_id !== currentUserId);
  const [activeCalls, setActiveCalls] = useState<SidebarCall[]>(initialCalls ?? []);
  const { displayName: contactName } = useContactNames();

  // Realtime subscription for calls
  useEffect(() => {
    if (!box) return;

    const supabase = createClient();
    const channelIds = channels.map((c) => c.id);
    if (channelIds.length === 0) return;

    const subscription = supabase
      .channel(`sidebar-calls-${box.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls" },
        async (payload) => {
          const newCall = payload.new as {
            id: string;
            channel_id: string | null;
            conversation_id: string | null;
            started_by: string;
            started_at: string;
            ended_at: string | null;
          };
          if (!newCall.channel_id || !channelIds.includes(newCall.channel_id)) return;
          if (newCall.ended_at) return;

          // Look up channel name and starter name
          const ch = channels.find((c) => c.id === newCall.channel_id);
          const member = members.find((m) => m.user_id === newCall.started_by);
          setActiveCalls((prev) => [
            ...prev.filter((c) => c.id !== newCall.id),
            {
              id: newCall.id,
              channel_id: newCall.channel_id,
              conversation_id: newCall.conversation_id,
              started_by: newCall.started_by,
              started_at: newCall.started_at,
              channel_name: ch?.name,
              starter_name: member?.full_name || member?.email,
            },
          ]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls" },
        (payload) => {
          const updated = payload.new as { id: string; ended_at: string | null };
          if (updated.ended_at) {
            // Call ended — remove from list
            setActiveCalls((prev) => prev.filter((c) => c.id !== updated.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "calls" },
        (payload) => {
          const deleted = payload.old as { id: string };
          setActiveCalls((prev) => prev.filter((c) => c.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [box, channels, members]);

  return (
    <div className="flex w-[240px] shrink-0 flex-col border-r border-[#1a1a1a] bg-[#0a0a0a]">
      {/* Box header */}
      {box ? (
        <BoxSwitcher boxes={boxes} currentBox={box} memberCount={members.length} onInvite={onInvite} />
      ) : (
        <div className="flex h-14 items-center gap-2 border-b border-[#1a1a1a] px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white">
              <MessageSquare className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="text-[14px] font-semibold text-white">
              Messages
            </span>
          </Link>
        </div>
      )}

      {/* Channels + DMs */}
      <div className="flex-1 overflow-auto px-2 py-3">
        {box && channels.length > 0 && (
          <>
            <div className="mb-1.5 flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Channels
              </span>
              <Tooltip label="Create channel">
                <button
                  onClick={onCreateChannel}
                  className="flex h-4 w-4 items-center justify-center rounded text-[#444] hover:text-white"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </Tooltip>
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => {
                const isActive = ch.short_id === activeChannelId;
                const unread = unreadCounts?.[ch.id] ?? 0;
                return (
                  <Link
                    key={ch.id}
                    href={`/box/${box.short_id}/c/${ch.short_id}`}
                    className={`flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors ${
                      isActive
                        ? "bg-[#1a1a1a] font-medium text-white"
                        : "text-[#666] hover:bg-[#111] hover:text-[#aaa]"
                    }`}
                  >
                    {ch.is_private ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                    ) : (
                      <Hash className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                    )}
                    <span className="truncate">{ch.name}</span>
                    {!isActive && unread > 0 && (
                      <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                        {unread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Active Calls */}
        {activeCalls.length > 0 && (
          <div className={`${box && channels.length > 0 ? "mt-5" : ""}`}>
            <div className="mb-1.5 flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Active Calls
              </span>
            </div>
            <div className="space-y-0.5">
              {activeCalls.map((call) => {
                const ch = channels.find((c) => c.id === call.channel_id);
                const displayName = call.channel_name || ch?.name || "Call";
                return (
                  <button
                    key={call.id}
                    onClick={() => {
                      if (onJoinCall) {
                        onJoinCall(call);
                      } else if (ch && box) {
                        router.push(`/box/${box.short_id}/c/${ch.short_id}`);
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[#22c55e] transition-colors hover:bg-[#111]"
                  >
                    <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                      <Phone className="h-3.5 w-3.5" />
                      <div className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
                    </div>
                    <span className="truncate">#{displayName}</span>
                    <span className="ml-auto rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[10px] font-semibold">
                      Join
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Direct Messages */}
        <div
          className={`${box && channels.length > 0 || activeCalls.length > 0 ? "mt-5" : ""} mb-1.5 flex items-center justify-between px-2`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
            Direct Messages
          </span>
          {onCreateGroupDm && (
            <Tooltip label="New group DM">
              <button
                onClick={onCreateGroupDm}
                className="flex h-4 w-4 items-center justify-center rounded text-[#444] hover:text-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </Tooltip>
          )}
        </div>
        <div className="space-y-0.5">
          {/* Saved Messages (self-DM) */}
          <button
            onClick={() => onStartDm(currentUserId)}
            disabled={dmLoading === currentUserId}
            className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors disabled:opacity-50 ${
              isSelfDm
                ? "bg-[#1a1a1a] font-medium text-white"
                : "text-[#666] hover:bg-[#111] hover:text-[#aaa]"
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a]">
              <Bookmark className="h-3 w-3 text-[#888]" />
            </div>
            <span className="truncate">Saved Messages</span>
          </button>

          {/* Sherlock AI */}
          {box && (
            <Link
              href={`/box/${box.short_id}/sherlock`}
              className={`flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors ${
                isSherlockActive
                  ? "bg-[#1a1a1a] font-medium text-white"
                  : "text-[#666] hover:bg-[#111] hover:text-[#aaa]"
              }`}
            >
              <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#276ef1]">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <span className="truncate font-medium">Sherlock</span>
              <span className="ml-auto rounded bg-[#276ef1]/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#276ef1]">
                AI
              </span>
            </Link>
          )}

          {/* DM Conversations */}
          {conversations && conversations.length > 0
            ? conversations
                .filter((c) => {
                  // Filter out self-DM (already shown as Saved Messages)
                  const others = c.participants.filter((p) => p.user_id !== currentUserId);
                  return others.length > 0;
                })
                .map((c) => {
                  const others = c.participants.filter((p) => p.user_id !== currentUserId);
                  const displayName = c.name || others.map((p) => contactName(p.user_id, p.full_name || p.email)).join(", ");
                  const firstOther = others[0];
                  const isActive = firstOther && firstOther.user_id === activeDmUserId;
                  const liveStatus = firstOther ? getStatus(firstOther.user_id) : "offline";
                  const statusColor =
                    liveStatus === "online"
                      ? "bg-[#22c55e]"
                      : liveStatus === "away"
                        ? "bg-[#f59e0b]"
                        : "bg-[#555]";
                  const initials = firstOther
                    ? firstOther.full_name
                      ? firstOther.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : firstOther.email[0].toUpperCase()
                    : "?";

                  return (
                    <Link
                      key={c.id}
                      href={`/dm/${c.short_id}${box ? `?box=${box.short_id}` : ""}`}
                      className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors ${
                        isActive
                          ? "bg-[#1a1a1a] font-medium text-white"
                          : "text-[#666] hover:bg-[#111] hover:text-[#aaa]"
                      }`}
                    >
                      <div className="relative h-5 w-5 shrink-0">
                        {firstOther?.avatar_url ? (
                          <img
                            src={firstOther.avatar_url}
                            alt=""
                            className="h-5 w-5 rounded-full"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a1a] text-[8px] font-bold text-white">
                            {initials}
                          </div>
                        )}
                        <Circle
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${statusColor} fill-current stroke-[#0a0a0a] stroke-[3]`}
                        />
                      </div>
                      <span className="truncate">{displayName}</span>
                    </Link>
                  );
                })
            : otherMembers.map((m) => {
                const initials = m.full_name
                  ? m.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : m.email[0].toUpperCase();
                const isCurrentDm = m.user_id === activeDmUserId;
                const liveStatus = getStatus(m.user_id);
                const statusColor =
                  liveStatus === "online"
                    ? "bg-[#22c55e]"
                    : liveStatus === "away"
                      ? "bg-[#f59e0b]"
                      : "bg-[#555]";

                return (
                  <button
                    key={m.user_id}
                    onClick={() => onStartDm(m.user_id)}
                    disabled={dmLoading === m.user_id}
                    className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors disabled:opacity-50 ${
                      isCurrentDm
                        ? "bg-[#1a1a1a] font-medium text-white"
                        : "text-[#666] hover:bg-[#111] hover:text-[#aaa]"
                    }`}
                  >
                    <div className="relative h-5 w-5 shrink-0">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt=""
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a1a] text-[8px] font-bold text-white">
                          {initials}
                        </div>
                      )}
                      <Circle
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${statusColor} fill-current stroke-[#0a0a0a] stroke-[3]`}
                      />
                    </div>
                    <span className="truncate">{contactName(m.user_id, m.full_name || m.email)}</span>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Workspace navigation */}
      {box && (
        <div className="border-t border-[#1a1a1a] px-2 py-2 space-y-0.5">
          <Link
            href={`/box/${box.short_id}/members`}
            className={`flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors ${
              pathname?.includes(`/box/${box.short_id}/members`)
                ? "bg-[#1a1a1a] font-medium text-white"
                : "text-[#666] hover:bg-[#111] hover:text-[#aaa]"
            }`}
          >
            <People className="h-3.5 w-3.5 text-[#555]" />
            <span className="truncate">Members</span>
            <span className="ml-auto text-[11px] text-[#444]">{members.length}</span>
          </Link>
          <Link
            href={`/box/${box.short_id}/integrations`}
            className={`flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors ${
              pathname?.includes(`/box/${box.short_id}/integrations`)
                ? "bg-[#1a1a1a] font-medium text-white"
                : "text-[#666] hover:bg-[#111] hover:text-[#aaa]"
            }`}
          >
            <Plug className="h-3.5 w-3.5 text-[#555]" />
            <span className="truncate">Integrations</span>
          </Link>
          {isAdmin && (
            <Link
              href={`/box/${box.short_id}/settings`}
              className={`flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors ${
                pathname?.includes(`/box/${box.short_id}/settings`)
                  ? "bg-[#1a1a1a] font-medium text-white"
                  : "text-[#666] hover:bg-[#111] hover:text-[#aaa]"
              }`}
            >
              <Gear className="h-3.5 w-3.5 text-[#555]" />
              <span className="truncate">Settings</span>
            </Link>
          )}
        </div>
      )}

      {/* User popover */}
      <UserPopover
        user={user}
        isAdmin={isAdmin}
        onInvite={onInvite}
        boxId={box?.id}
        boxName={box?.name}
        boxRole={box?.role}
        currentChannelId={currentChannelId}
      />
    </div>
  );
}
