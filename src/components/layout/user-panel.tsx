"use client";

import { useRouter } from "next/navigation";
import { GearIcon as Settings, SignOutIcon as LogOut } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";

interface UserPanelProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export function UserPanel({ user }: UserPanelProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="border-t border-[#1a1a1a] p-2">
      <div className="flex items-center gap-2.5 rounded-[8px] px-2 py-1.5">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-white">
            {user.fullName || user.email}
          </div>
          <div className="truncate text-[11px] text-[#555]">{user.email}</div>
        </div>
        <div className="flex gap-0.5">
          <Tooltip label="Settings">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#444] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <Tooltip label="Sign out">
            <button
              onClick={handleSignOut}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#444] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
