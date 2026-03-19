"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "@/components/command-palette";
import { SearchModal } from "@/components/modals/search-modal";

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
  activeBoxUUID?: string;
  hideSidebar?: boolean;
  children: React.ReactNode;
}

export function AppShell({ user, boxes, activeBoxId, activeBoxUUID, hideSidebar, children }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {!hideSidebar && <Sidebar user={user} boxes={boxes} activeBoxId={activeBoxId} />}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <CommandPalette
        boxes={boxes}
        activeBoxId={activeBoxId}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        boxShortId={activeBoxId}
        boxId={activeBoxUUID}
      />
    </div>
  );
}
