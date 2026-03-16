"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Link as LinkIcon,
  Hash,
  Users,
  ArrowRight,
  Crown,
  Shield,
  MessageSquare,
  Settings,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/stores/settings-store";
import { createClient } from "@/lib/supabase/client";
import { getInitials, type BoxData, type UserData } from "@/lib/chat-helpers";

interface DMData {
  id: string;
  shortId: string;
  isGroup: boolean;
  name: string | null;
  updatedAt: string;
  participants: { user_id: string; full_name: string; email: string; avatar_url: string | null }[];
}

interface DashboardClientProps {
  user: UserData;
  boxes: BoxData[];
  boxStats: Record<string, { channels: number; members: number }>;
  recentChannels: Record<string, { short_id: string; name: string }[]>;
  recentDMs: DMData[];
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

export function DashboardClient({ user, boxes, boxStats, recentChannels, recentDMs }: DashboardClientProps) {
  const router = useRouter();
  const firstName = user.fullName?.split(" ")[0] || "there";
  const { loaded, loadFromServer } = useSettingsStore();

  useEffect(() => {
    if (!loaded) loadFromServer();
  }, [loaded, loadFromServer]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <MessageSquare className="h-4 w-4 text-black" />
          </div>
          <span className="text-[15px] font-bold text-white">Chatterbox</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <div className="mx-1 h-5 w-px bg-[#1a1a1a]" />
          <button
            onClick={handleSignOut}
            className="flex h-8 items-center gap-2 rounded-[8px] px-2.5 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black">
                {getInitials(user.fullName, user.email)}
              </div>
            )}
            <LogOut className="h-3.5 w-3.5" />
          </button>
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
            <div>
              <h2 className="text-[22px] font-bold tracking-tight text-white">
                {getGreeting()}, {firstName}
              </h2>
              <p className="mt-0.5 text-[14px] text-[#555]">
                {boxes.length === 0
                  ? "Get started by creating or joining a workspace."
                  : `You're in ${boxes.length} workspace${boxes.length !== 1 ? "s" : ""}.`}
              </p>
            </div>
          </div>

          {/* Quick actions — always visible */}
          <div className="mb-8 flex gap-3">
            <Link
              href="/create/box"
              className="group flex flex-1 items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
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
              className="group flex flex-1 items-center gap-3 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-colors hover:border-[#2a2a2a] hover:bg-[#111]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#1a1a1a] text-white">
                <LinkIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-white">Join a Box</div>
                <div className="mt-0.5 text-[12px] text-[#555]">Invite code or link</div>
              </div>
            </Link>
          </div>

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

                  return (
                    <Link
                      key={box.id}
                      href={`/box/${box.short_id}`}
                      className="group relative flex items-center gap-4 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-all hover:border-[#2a2a2a] hover:bg-[#111]"
                    >
                      {/* Icon */}
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
                          <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-medium uppercase text-[#555]">
                            {box.plan}
                          </span>
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
                              <span className="text-[10px] text-[#333]">·</span>
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

                  return (
                    <Link
                      key={dm.id}
                      href={`/dm/${dm.shortId}`}
                      className="group flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[#111]"
                    >
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
                      <div className="min-w-0 flex-1">
                        <span className="truncate text-[14px] font-medium text-white">
                          {displayName}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#444]">
                        {timeAgo(dm.updatedAt)}
                      </span>
                      <MessageCircle className="h-3.5 w-3.5 text-[#222] transition-colors group-hover:text-[#555]" />
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
