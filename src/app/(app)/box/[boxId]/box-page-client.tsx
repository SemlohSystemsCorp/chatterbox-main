"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HashIcon as Hash, LockIcon as Lock, PlusIcon as Plus, PeopleIcon as Users, GearIcon as Settings, ArrowRightIcon as ArrowRight, TrophyIcon as Crown, ShieldIcon as Shield, ChevronDownIcon as ChevronDown, CheckIcon as Check, DeviceMobileIcon as Phone, PersonAddIcon as UserPlus, CopyIcon as Copy, CommentIcon as Comment } from "@primer/octicons-react";
import { AppShell } from "@/components/layout/app-shell";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { InviteModal } from "@/components/modals/invite-modal";

interface BoxData {
  id: string;
  short_id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  plan: string;
  role: string;
}

interface ChannelData {
  id: string;
  short_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface MemberData {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  status: string;
}

interface ActiveCallData {
  id: string;
  channel_id: string | null;
  conversation_id: string | null;
  started_by: string;
  started_at: string;
  channel_name?: string;
  starter_name?: string;
}

interface RecentActivityItem {
  id: string;
  channelName: string;
  channelShortId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string;
  createdAt: string;
}

interface BoxPageClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  boxes: BoxData[];
  box: {
    id: string;
    short_id: string;
    name: string;
    slug: string;
    description: string | null;
    icon_url: string | null;
    plan: string;
    role: string;
  };
  channels: ChannelData[];
  members: MemberData[];
  activeCalls: ActiveCallData[];
  channelUnreads: Record<string, number>;
  recentActivity: RecentActivityItem[];
}

function getRoleIcon(role: string) {
  if (role === "owner") return Crown;
  if (role === "admin") return Shield;
  return null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncateContent(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "\u2026";
}

export function BoxPageClient({
  user,
  boxes,
  box,
  channels,
  members,
  activeCalls,
  channelUnreads,
  recentActivity,
}: BoxPageClientProps) {
  const router = useRouter();
  const isAdmin = box.role === "owner" || box.role === "admin";
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);
  const [dmLoading, setDmLoading] = useState<string | null>(null);
  const boxInitials = box.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Box switcher dropdown
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const onlineMembers = members.filter((m) => m.status === "online");

  // Sort channels: unreads first, then original order
  const sortedChannels = [...channels].sort((a, b) => {
    const aUnread = channelUnreads[a.id] ?? 0;
    const bUnread = channelUnreads[b.id] ?? 0;
    if (aUnread > 0 && bUnread === 0) return -1;
    if (aUnread === 0 && bUnread > 0) return 1;
    return 0;
  });

  // Sort members: online first, then away, dnd, offline
  const statusOrder: Record<string, number> = { online: 0, away: 1, dnd: 2, offline: 3 };
  const sortedMembers = [...members].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
  );

  // Pick the best channel for "Jump in" (first with unreads, or most recently updated)
  const jumpInChannel = sortedChannels[0] ?? null;

  // Build quick actions
  const quickActions: { key: string; element: React.ReactNode }[] = [];
  if (jumpInChannel) {
    const unreadCount = channelUnreads[jumpInChannel.id] ?? 0;
    quickActions.push({
      key: "jump-in",
      element: (
        <Link
          href={`/box/${box.short_id}/c/${jumpInChannel.short_id}`}
          className="flex items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-3.5 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#1a1a1a]">
            <Hash className="h-4 w-4 text-[#888]" />
            {unreadCount > 0 && (
              <div className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                {unreadCount}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-white">#{jumpInChannel.name}</div>
            <div className="text-[11px] text-[#555]">{unreadCount > 0 ? `${unreadCount} unread` : "Jump in"}</div>
          </div>
        </Link>
      ),
    });
  }
  if (isAdmin) {
    quickActions.push({
      key: "create-channel",
      element: (
        <button
          onClick={() => setCreateChannelOpen(true)}
          className="flex items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-3.5 text-left transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#1a1a1a]">
            <Plus className="h-4 w-4 text-[#888]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white">New Channel</div>
            <div className="text-[11px] text-[#555]">Create</div>
          </div>
        </button>
      ),
    });
    quickActions.push({
      key: "invite",
      element: (
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-3.5 text-left transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#1a1a1a]">
            <UserPlus className="h-4 w-4 text-[#888]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white">Invite</div>
            <div className="text-[11px] text-[#555]">Add people</div>
          </div>
        </button>
      ),
    });
  }
  if (!isAdmin) {
    quickActions.push({
      key: "settings",
      element: (
        <Link
          href={`/box/${box.short_id}/settings`}
          className="flex items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-3.5 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#1a1a1a]">
            <Settings className="h-4 w-4 text-[#888]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white">Settings</div>
            <div className="text-[11px] text-[#555]">Configure</div>
          </div>
        </Link>
      ),
    });
  }

  const gridCols = quickActions.length >= 3 ? "grid-cols-3" : quickActions.length === 2 ? "grid-cols-2" : "grid-cols-1";

  async function handleMessageMember(targetUserId: string) {
    if (dmLoading) return;
    setDmLoading(targetUserId);
    try {
      const res = await fetch("/api/conversations/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });
      const data = await res.json();
      if (data.short_id) {
        router.push(`/dm/${data.short_id}`);
      }
    } finally {
      setDmLoading(null);
    }
  }

  const totalUnreads = Object.values(channelUnreads).reduce((sum, n) => sum + n, 0);

  return (
    <AppShell user={user} boxes={boxes} activeBoxId={box.short_id} hideSidebar>
      {/* Box Header Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-5">
        <div className="flex items-center gap-3">
          {/* Box switcher */}
          <div className="relative" ref={switcherRef}>
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors hover:bg-[#1a1a1a]"
            >
              {box.icon_url ? (
                <img src={box.icon_url} alt="" className="h-6 w-6 rounded-[4px]" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-[9px] font-bold text-black">
                  {boxInitials}
                </div>
              )}
              <span className="text-[15px] font-semibold text-white">{box.name}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-[#555] transition-transform ${switcherOpen ? "rotate-180" : ""}`} />
            </button>

            {switcherOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[240px] rounded-[10px] border border-[#1a1a1a] bg-[#111] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                  Switch Box
                </div>
                {boxes.map((b) => {
                  const isCurrent = b.short_id === box.short_id;
                  const initials = b.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSwitcherOpen(false);
                        if (!isCurrent) router.push(`/box/${b.short_id}`);
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isCurrent ? "bg-[#1a1a1a]" : "hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {b.icon_url ? (
                        <img src={b.icon_url} alt="" className="h-7 w-7 rounded-[5px]" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-white text-[10px] font-bold text-black">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-white">{b.name}</div>
                        <div className="text-[11px] capitalize text-[#555]">{b.role}</div>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 shrink-0 text-white" />}
                    </button>
                  );
                })}
                <div className="border-t border-[#1a1a1a] mt-1 pt-1">
                  <Link
                    href="/create/box"
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Create a new Box
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[12px] text-[#555]">
            <Link href={`/box/${box.short_id}/channels`} className="flex items-center gap-1 transition-colors hover:text-white">
              <Hash className="h-3 w-3" />
              {channels.length}
            </Link>
            <Link href={`/box/${box.short_id}/members`} className="flex items-center gap-1 transition-colors hover:text-white">
              <Users className="h-3 w-3" />
              {members.length}
            </Link>
            {onlineMembers.length > 0 && (
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {onlineMembers.length} online
              </span>
            )}
            {totalUnreads > 0 && (
              <span className="flex items-center gap-1 text-white">
                {totalUnreads} unread
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/box/${box.short_id}/settings`}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[720px] px-6 py-8">
          {/* Box Identity — plan badge removed */}
          <div className="mb-6 flex items-center gap-4">
            {box.icon_url ? (
              <img src={box.icon_url} alt="" className="h-16 w-16 rounded-xl" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-[20px] font-bold text-black">
                {boxInitials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] font-bold text-white">{box.name}</h2>
                {box.role === "owner" && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400">
                    <Crown className="h-3 w-3" /> Owner
                  </span>
                )}
                {box.role === "admin" && (
                  <span className="flex items-center gap-1 text-[11px] text-blue-400">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>
              {box.description && (
                <p className="mt-0.5 text-[13px] text-[#666]">{box.description}</p>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`getchatterbox.app/${box.slug}`);
                  setSlugCopied(true);
                  setTimeout(() => setSlugCopied(false), 2000);
                }}
                className="mt-0.5 flex items-center gap-1 text-[12px] text-[#444] transition-colors hover:text-[#888]"
              >
                getchatterbox.app/{box.slug}
                {slugCopied ? (
                  <Check className="h-3 w-3 text-[#22c55e]" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className={`mb-8 grid ${gridCols} gap-3`}>
              {quickActions.map((action) => (
                <div key={action.key}>{action.element}</div>
              ))}
            </div>
          )}

          {/* Channels */}
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Channels ({channels.length})
              </h3>
              <button
                onClick={() => setCreateChannelOpen(true)}
                className="text-[12px] font-medium text-[#555] hover:text-white"
              >
                <Plus className="mr-0.5 inline h-3 w-3" /> New
              </button>
            </div>

            {channels.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[#222] py-8 text-center">
                <Hash className="mx-auto mb-2 h-6 w-6 text-[#444]" />
                <p className="text-[13px] text-[#666]">No channels yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedChannels.slice(0, 5).map((channel) => {
                  const unread = channelUnreads[channel.id] ?? 0;
                  return (
                    <Link
                      key={channel.id}
                      href={`/box/${box.short_id}/c/${channel.short_id}`}
                      className="group flex items-center gap-3 rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
                    >
                      {channel.is_private ? (
                        <Lock className="h-4 w-4 shrink-0 text-[#555]" />
                      ) : (
                        <Hash className="h-4 w-4 shrink-0 text-[#555]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className={`text-[14px] font-medium ${unread > 0 ? "text-white font-semibold" : "text-white"}`}>
                          {channel.name}
                        </span>
                        {channel.description && (
                          <p className="truncate text-[12px] text-[#555]">
                            {channel.description}
                          </p>
                        )}
                      </div>
                      {unread > 0 && (
                        <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-black">
                          {unread}
                        </div>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-[#333] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#666] group-hover:opacity-100" />
                    </Link>
                  );
                })}
                {channels.length > 5 && (
                  <Link
                    href={`/box/${box.short_id}/channels`}
                    className="flex items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-[13px] font-medium text-[#555] transition-colors hover:bg-[#111] hover:text-white"
                  >
                    View all {channels.length} channels
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Recent Activity
              </h3>
              <div className="space-y-1">
                {recentActivity.map((item) => {
                  const senderInitials = item.senderName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <Link
                      key={item.id}
                      href={`/box/${box.short_id}/c/${item.channelShortId}`}
                      className="group flex items-center gap-3 rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-2.5 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
                    >
                      {item.senderAvatarUrl ? (
                        <img src={item.senderAvatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full" />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black">
                          {senderInitials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-white">{item.senderName}</span>
                          <span className="text-[11px] text-[#444]">in</span>
                          <span className="text-[12px] text-[#666]">#{item.channelName}</span>
                          <span className="ml-auto shrink-0 text-[11px] text-[#444]">{timeAgo(item.createdAt)}</span>
                        </div>
                        <p className="truncate text-[12px] text-[#555]">
                          {truncateContent(item.content)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Calls */}
          {activeCalls.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Active Calls ({activeCalls.length})
              </h3>
              <div className="space-y-1">
                {activeCalls.map((call) => (
                  <Link
                    key={call.id}
                    href={`/call/${call.id}?returnTo=/box/${box.short_id}`}
                    className="group flex items-center gap-3 rounded-[10px] border border-[#1a2a1a] bg-[#0a150a] px-4 py-3 transition-colors hover:border-[#22c55e]/30 hover:bg-[#0d1a0d]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/10">
                      <Phone className="h-4 w-4 text-[#22c55e]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-white">
                          {call.channel_name ? `#${call.channel_name}` : "Call"}
                        </span>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                        </span>
                      </div>
                      <p className="text-[12px] text-[#555]">
                        Started by {call.starter_name || "someone"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#22c55e]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#22c55e] opacity-0 transition-opacity group-hover:opacity-100">
                      Join
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Members — sorted online first, with DM action */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Members ({members.length})
              </h3>
              {isAdmin && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="text-[12px] font-medium text-[#555] hover:text-white"
                >
                  <UserPlus className="mr-0.5 inline h-3 w-3" /> Invite
                </button>
              )}
            </div>

            <div className="space-y-1">
              {sortedMembers.slice(0, 5).map((member) => {
                const RoleIcon = getRoleIcon(member.role);
                const initials = member.full_name
                  ? member.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : member.email[0].toUpperCase();
                const isSelf = member.user_id === user.id;

                return (
                  <div
                    key={member.id}
                    className="group flex items-center gap-3 rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3"
                  >
                    <div className="relative">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
                          {initials}
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0f0f0f] ${
                          member.status === "online"
                            ? "bg-green-500"
                            : member.status === "away"
                              ? "bg-yellow-500"
                              : member.status === "dnd"
                                ? "bg-red-500"
                                : "bg-[#555]"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[14px] font-medium text-white">
                          {member.full_name || member.email}
                        </span>
                        {isSelf && (
                          <span className="text-[11px] text-[#555]">(you)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] capitalize text-[#555]">
                        {RoleIcon && <RoleIcon className="h-3 w-3" />}
                        {member.role}
                      </div>
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => handleMessageMember(member.user_id)}
                        disabled={dmLoading === member.user_id}
                        className="flex h-7 items-center gap-1 rounded-[6px] px-2 text-[11px] font-medium text-[#555] opacity-0 transition-all hover:bg-[#1a1a1a] hover:text-white group-hover:opacity-100"
                      >
                        <Comment className="h-3.5 w-3.5" />
                        {dmLoading === member.user_id ? "..." : "Message"}
                      </button>
                    )}
                  </div>
                );
              })}
              {members.length > 5 && (
                <Link
                  href={`/box/${box.short_id}/members`}
                  className="flex items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-[13px] font-medium text-[#555] transition-colors hover:bg-[#111] hover:text-white"
                >
                  View all {members.length} members
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <CreateChannelModal
        open={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        boxId={box.id}
        boxShortId={box.short_id}
      />
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        boxId={box.id}
        boxName={box.name}
      />
    </AppShell>
  );
}
