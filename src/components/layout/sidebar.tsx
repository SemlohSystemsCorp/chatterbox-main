"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommentDiscussionIcon as MessageSquare, PlusIcon as Plus, SearchIcon as Search, HashIcon as Hash, PeopleIcon as Users, LinkIcon, ShieldIcon as Shield } from "@primer/octicons-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Tooltip } from "@/components/ui/tooltip";
import { isSuperAdmin } from "@/lib/super-admin";

interface SidebarBox {
  id: string;
  short_id: string;
  name: string;
  slug: string;
  role: string;
  icon_url?: string | null;
}

interface SidebarUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

interface SidebarProps {
  user: SidebarUser;
  boxes: SidebarBox[];
  activeBoxId?: string;
}

export function Sidebar({ user, boxes, activeBoxId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-[#1a1a1a] bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-[#1a1a1a] px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="logo-glass flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <MessageSquare className="h-4 w-4 text-black" />
          </div>
          <span className="text-[15px] font-bold text-white">Chatterbox</span>
        </Link>
        <NotificationBell userId={user.id} />
      </div>

      {/* Search / Command Palette trigger */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          }}
          className="flex h-9 w-full items-center gap-2 rounded-[8px] bg-[#141414] px-3 text-[13px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-[#888]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#444]">⌘K</kbd>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 pt-3">
        <div className="flex gap-1.5">
          <Link
            href="/create/box"
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-white text-[12px] font-semibold text-black transition-colors hover:bg-[#e0e0e0]"
          >
            <Plus className="h-3.5 w-3.5" />
            New Box
          </Link>
          <Link
            href="/join"
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-[#141414] text-[12px] font-semibold text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Join Box
          </Link>
        </div>
      </div>

      {/* Boxes */}
      <div className="flex-1 overflow-auto px-3 pt-4">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
            Your Boxes
          </span>
          <Tooltip label="Create new box">
            <Link
              href="/create/box"
              className="flex h-5 w-5 items-center justify-center rounded text-[#444] hover:bg-[#1a1a1a] hover:text-white"
            >
              <Plus className="h-3 w-3" />
            </Link>
          </Tooltip>
        </div>

        {boxes.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#141414]">
              <MessageSquare className="h-5 w-5 text-[#444]" />
            </div>
            <p className="mb-1 text-[13px] font-medium text-[#666]">
              No boxes yet
            </p>
            <p className="mb-4 text-[12px] text-[#444]">
              Create or join a workspace
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {boxes.map((box) => {
              const isActive = box.short_id === activeBoxId;
              const initials = box.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <Link
                  key={box.id}
                  href={`/box/${box.short_id}`}
                  className={`flex w-full items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-left transition-colors ${
                    isActive
                      ? "bg-[#1a1a1a] text-white"
                      : "text-[#aaa] hover:bg-[#111] hover:text-white"
                  }`}
                >
                  {box.icon_url ? (
                    <img
                      src={box.icon_url}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-[6px]"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-white text-[11px] font-bold text-black">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">
                      {box.name}
                    </div>
                    <div className="text-[11px] capitalize text-[#555]">
                      {box.role}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Nav links */}
        <div className="mt-5 space-y-0.5">
          <Link
            href="/dashboard"
            className={`flex w-full items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-[13px] transition-colors ${
              pathname === "/dashboard"
                ? "bg-[#1a1a1a] text-white"
                : "text-[#666] hover:bg-[#111] hover:text-white"
            }`}
          >
            <Hash className="h-4 w-4" />
            Channels
          </Link>
          <Link
            href="/dashboard/messages"
            className={`flex w-full items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-[13px] transition-colors ${
              pathname === "/dashboard/messages"
                ? "bg-[#1a1a1a] text-white"
                : "text-[#666] hover:bg-[#111] hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            Direct Messages
          </Link>
          {isSuperAdmin(user.email) && (
            <Link
              href="/super-admin"
              className={`flex w-full items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-[13px] transition-colors ${
                pathname === "/super-admin"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666] hover:bg-[#111] hover:text-white"
              }`}
            >
              <Shield className="h-4 w-4" />
              Super Admin
            </Link>
          )}
        </div>
      </div>

    </aside>
  );
}
