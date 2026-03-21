"use client";

import { Sidebar } from "./sidebar";
import { useBanCheck } from "@/hooks/use-ban-check";
import { BannedScreen } from "@/components/banned-screen";

interface AppShellUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

interface AppShellBox {
  id: string;
  short_id: string;
  name: string;
  slug: string;
  role: string;
  icon_url?: string | null;
}

interface AppShellProps {
  user: AppShellUser;
  boxes: AppShellBox[];
  activeBoxId?: string;
  hideSidebar?: boolean;
  children: React.ReactNode;
}

export function AppShell({ user, boxes, activeBoxId, hideSidebar, children }: AppShellProps) {
  const banStatus = useBanCheck();

  if (banStatus.banned) {
    return (
      <BannedScreen
        reason={banStatus.ban_reason}
        bannedUntil={banStatus.banned_until}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {!hideSidebar && <Sidebar user={user} boxes={boxes} activeBoxId={activeBoxId} />}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
