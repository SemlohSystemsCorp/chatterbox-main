"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PlusIcon as Plus, LinkIcon, HashIcon as Hash, PeopleIcon as Users, ArrowRightIcon as ArrowRight, TrophyIcon as Crown, ShieldIcon as Shield, CommentDiscussionIcon as MessageSquare, GearIcon as Settings, SignOutIcon as LogOut, CommentIcon as MessageCircle, MailIcon as Mail, PersonIcon as Person, SearchIcon as Search } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/stores/settings-store";
import { createClient } from "@/lib/supabase/client";
import { getInitials, type BoxData, type UserData } from "@/lib/chat-helpers";

function DashboardSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-6">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 animate-pulse rounded-md bg-[#1a1a1a]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[#1a1a1a]" />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[880px] px-6 py-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[#1a1a1a]" />
            <div>
              <div className="h-6 w-48 animate-pulse rounded bg-[#1a1a1a]" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-[#1a1a1a]" />
            </div>
          </div>
          <div className="mb-8 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-[12px] bg-[#1a1a1a]" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-[12px] bg-[#1a1a1a]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DMData {
  id: string;
  shortId: string;
  isGroup: boolean;
  name: string | null;
  updatedAt: string;
  participants: { user_id: string; full_name: string; email: string; avatar_url: string | null }[];
}

interface PendingInviteData {
  code: string;
  boxName: string;
  boxIconUrl: string | null;
  role: string;
  inviterName: string | null;
  memberCount: number;
}

interface DashboardClientProps {
  user: UserData;
  boxes: BoxData[];
  boxStats: Record<string, { channels: number; members: number }>;
  recentChannels: Record<string, { short_id: string; name: string }[]>;
  recentDMs: DMData[];
  pendingInvites: PendingInviteData[];
  boxUnreadCounts: Record<string, number>;
  dmUnreadCounts: Record<string, number>;
  lastMessages: Record<string, { content: string; senderId: string }>;
}

function getRoleBadge(role: string) {
  if (role === "owner")
    return { icon: Crown, label: "Owner", color: "text-amber-400" };
  if (role === "admin")
    return { icon: Shield, label: "Admin", color: "text-blue-400" };
  return null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

function truncatePreview(content: string, maxLength = 50) {
  const stripped = content.replace(/\n/g, " ").trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength) + "\u2026";
}

export function DashboardClient({ user, boxes, boxStats, recentChannels, recentDMs, pendingInvites: initialInvites, boxUnreadCounts, dmUnreadCounts, lastMessages }: DashboardClientProps) {
  const router = useRouter();
  const firstName = user.fullName?.split(" ")[0] || "there";
  const { loaded, loadFromServer } = useSettingsStore();
  const [pendingInvites, setPendingInvites] = useState(initialInvites);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaded) loadFromServer();
  }, [loaded, loadFromServer]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  if (!loaded) return <DashboardSkeleton />;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleJoinInvite(code: string) {
    setJoinError("");
    setJoiningCode(code);

    try {
      const res = await fetch("/api/invites/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setJoinError(data.error || "Failed to join");
        setJoiningCode(null);
        return;
      }

      // Remove the invite from the list and navigate
      setPendingInvites((prev) => prev.filter((inv) => inv.code !== code));
      router.push(`/box/${data.box.short_id}`);
      router.refresh();
    } catch {
      setJoinError("Something went wrong");
      setJoiningCode(null);
    }
  }

  const hasBoxes = boxes.length > 0;
  const totalUnread = Object.values(boxUnreadCounts).reduce((a, b) => a + b, 0)
    + Object.values(dmUnreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-6">
        <div className="flex items-center gap-2.5">
          <div className="logo-glass flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <MessageSquare className="h-4 w-4 text-black" />
          </div>
          <span className="text-[15px] font-bold text-white">Chatterbox</span>
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex h-8 items-center gap-2 rounded-[8px] px-2 transition-colors hover:bg-[#1a1a1a]"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black">
                {getInitials(user.fullName, user.email)}
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-[10px] border border-[#1a1a1a] bg-[#111] py-1 shadow-xl">
              <div className="border-b border-[#1a1a1a] px-3 py-2.5">
                <div className="truncate text-[13px] font-semibold text-white">
                  {user.fullName || user.email}
                </div>
                {user.fullName && (
                  <div className="truncate text-[11px] text-[#555]">
                    {user.email}
                  </div>
                )}
              </div>
              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                >
                  <Person className="h-4 w-4" />
                  Profile & Settings
                </Link>
              </div>
              <div className="border-t border-[#1a1a1a] py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[880px] px-6 py-8">
          {/* Greeting with avatar */}
          <div className="mb-8 flex items-center gap-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-full" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[16px] font-bold text-black">
                {getInitials(user.fullName, user.email)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-[22px] font-bold tracking-tight text-white">
                {getGreeting()}, {firstName}
              </h2>
              <p className="mt-0.5 text-[14px] text-[#555]">
                {!hasBoxes
                  ? "Get started by creating or joining a workspace."
                  : totalUnread > 0
                    ? `You have ${totalUnread} unread message${totalUnread !== 1 ? "s" : ""} across ${boxes.length} workspace${boxes.length !== 1 ? "s" : ""}.`
                    : `You\u2019re all caught up across ${boxes.length} workspace${boxes.length !== 1 ? "s" : ""}.`}
              </p>
            </div>
            {/* Keyboard shortcut hint */}
            <button
              onClick={() => {
                // Trigger command palette
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="hidden items-center gap-1.5 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] px-3 py-1.5 text-[12px] text-[#444] transition-colors hover:border-[#2a2a2a] hover:text-[#666] md:flex"
            >
              <Search className="h-3 w-3" />
              <span>Search</span>
              <kbd className="ml-1 rounded bg-[#1a1a1a] px-1 py-0.5 text-[10px] font-medium text-[#555]">
                {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "\u2318" : "Ctrl+"}K
              </kbd>
            </button>
          </div>

          {/* Quick actions */}
          {hasBoxes ? (
            /* Compact inline buttons for returning users */
            <div className="mb-8 flex items-center gap-2">
              <Link
                href="/create/box"
                className="flex items-center gap-2 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] px-3 py-2 text-[13px] text-[#888] transition-colors hover:border-[#2a2a2a] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                New Box
              </Link>
              <Link
                href="/join"
                className="flex items-center gap-2 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] px-3 py-2 text-[13px] text-[#888] transition-colors hover:border-[#2a2a2a] hover:text-white"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Join Box
              </Link>
              <Link
                href="/dashboard/messages"
                className="flex items-center gap-2 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] px-3 py-2 text-[13px] text-[#888] transition-colors hover:border-[#2a2a2a] hover:text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Messages
              </Link>
            </div>
          ) : (
            /* Full cards for new users */
            <div className="mb-8 grid grid-cols-3 gap-3">
              <Link
                href="/create/box"
                className="group flex items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-black">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">Create a Box</div>
                  <div className="mt-0.5 text-[12px] text-[#555]">New workspace</div>
                </div>
              </Link>
              <Link
                href="/join"
                className="group flex items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#1a1a1a] text-white">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">Join a Box</div>
                  <div className="mt-0.5 text-[12px] text-[#555]">Invite code or link</div>
                </div>
              </Link>
              <Link
                href="/dashboard/messages"
                className="group flex items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#1a1a1a] text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">Messages</div>
                  <div className="mt-0.5 text-[12px] text-[#555]">DMs &amp; groups</div>
                </div>
              </Link>
            </div>
          )}

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                <Mail className="h-3 w-3" />
                Pending Invites
              </h3>

              <div className="space-y-2">
                {pendingInvites.map((invite) => {
                  const initials = invite.boxName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const isJoining = joiningCode === invite.code;

                  return (
                    <div
                      key={invite.code}
                      className="flex items-center gap-4 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4"
                    >
                      {invite.boxIconUrl ? (
                        <img
                          src={invite.boxIconUrl}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-[10px]"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white text-[13px] font-bold text-black">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold text-white">
                          {invite.boxName}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#555]">
                          <Users className="h-3 w-3" />
                          {invite.memberCount} member{invite.memberCount !== 1 ? "s" : ""}
                          {invite.inviterName && (
                            <>
                              <span className="text-[#333]">&middot;</span>
                              <span>Invited by {invite.inviterName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinInvite(invite.code)}
                        loading={isJoining}
                        disabled={joiningCode !== null}
                        className="shrink-0"
                      >
                        Join
                      </Button>
                    </div>
                  );
                })}
              </div>

              {joinError && (
                <p className="mt-2 text-[13px] text-[#de1135]">{joinError}</p>
              )}
            </div>
          )}

          {/* Boxes */}
          {boxes.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Your Boxes
              </h3>

              <div className="space-y-2">
                {boxes.map((box) => {
                  const initials = box.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const roleBadge = getRoleBadge(box.role);
                  const stats = boxStats[box.id];
                  const channels = recentChannels[box.id] ?? [];
                  const unread = boxUnreadCounts[box.id] ?? 0;

                  return (
                    <Link
                      key={box.id}
                      href={`/box/${box.short_id}`}
                      className="group relative flex items-center gap-4 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-all hover:border-[#2a2a2a] hover:bg-[#111]"
                    >
                      {/* Icon */}
                      <div className="relative">
                        {box.icon_url ? (
                          <img
                            src={box.icon_url}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-[10px]"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white text-[13px] font-bold text-black">
                            {initials}
                          </div>
                        )}
                        {unread > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-semibold text-white">
                            {box.name}
                          </span>
                          {roleBadge && (
                            <span className={`flex items-center gap-1 text-[11px] ${roleBadge.color}`}>
                              <roleBadge.icon className="h-3 w-3" />
                              {roleBadge.label}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[12px] text-[#555]">
                            <Hash className="h-3 w-3" />
                            {stats?.channels ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-[12px] text-[#555]">
                            <Users className="h-3 w-3" />
                            {stats?.members ?? 0}
                          </span>
                          {channels.length > 0 && (
                            <>
                              <span className="text-[10px] text-[#333]">&middot;</span>
                              <span className="truncate text-[12px] text-[#444]">
                                {channels.map((c) => `#${c.name}`).join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 shrink-0 text-[#222] transition-all group-hover:translate-x-0.5 group-hover:text-[#555]" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent DMs */}
          {recentDMs.length > 0 && (
            <div>
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Recent Messages
              </h3>

              <div className="space-y-1">
                {recentDMs.map((dm) => {
                  const other = dm.participants.find((p) => p.user_id !== user.id);
                  const displayName = dm.isGroup
                    ? dm.name || dm.participants.map((p) => p.full_name.split(" ")[0]).join(", ")
                    : other?.full_name || "Unknown";
                  const avatarUrl = !dm.isGroup ? other?.avatar_url : null;
                  const unread = dmUnreadCounts[dm.id] ?? 0;
                  const lastMsg = lastMessages[dm.id];
                  const lastMsgSender = lastMsg
                    ? dm.participants.find((p) => p.user_id === lastMsg.senderId)
                    : null;
                  const lastMsgPreview = lastMsg
                    ? `${lastMsg.senderId === user.id ? "You" : lastMsgSender?.full_name?.split(" ")[0] || "Someone"}: ${truncatePreview(lastMsg.content)}`
                    : null;

                  return (
                    <Link
                      key={dm.id}
                      href={`/dm/${dm.shortId}`}
                      className="group flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[#111]"
                    >
                      <div className="relative">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] text-[11px] font-bold text-white">
                            {dm.isGroup ? (
                              <Users className="h-3.5 w-3.5" />
                            ) : (
                              getInitials(other?.full_name || "", other?.email || "")
                            )}
                          </div>
                        )}
                        {unread > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-white px-0.5 text-[8px] font-bold text-black">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`truncate text-[14px] ${unread > 0 ? "font-semibold text-white" : "font-medium text-white"}`}>
                            {displayName}
                          </span>
                        </div>
                        {lastMsgPreview && (
                          <p className={`truncate text-[12px] ${unread > 0 ? "text-[#888]" : "text-[#444]"}`}>
                            {lastMsgPreview}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-[#444]">
                        {timeAgo(dm.updatedAt)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state — no boxes AND no DMs */}
          {boxes.length === 0 && recentDMs.length === 0 && (
            <div className="rounded-[12px] border border-dashed border-[#1a1a1a] p-10 text-center">
              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-[#333]" />
              <p className="text-[14px] text-[#555]">
                No workspaces yet. Create a Box or join one with an invite link to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
