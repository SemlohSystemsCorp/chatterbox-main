"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  NoEntryIcon as BanIcon,
  CommentDiscussionIcon as MessageSquare,
  SignOutIcon,
} from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface BannedScreenProps {
  reason?: string | null;
  bannedUntil?: string | null;
}

function formatBanExpiry(bannedUntil: string): string {
  const date = new Date(bannedUntil);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return "expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 365) return "permanently";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  if (hours > 0) return `in ${hours} hour${hours === 1 ? "" : "s"}`;

  const mins = Math.floor(diff / (1000 * 60));
  return `in ${mins} minute${mins === 1 ? "" : "s"}`;
}

export function BannedScreen({ reason, bannedUntil }: BannedScreenProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isPermanent =
    !bannedUntil ||
    new Date(bannedUntil).getTime() - Date.now() > 365 * 24 * 60 * 60 * 1000;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-[440px] px-6">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="logo-glass flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <MessageSquare className="h-4 w-4 text-black" />
          </div>
          <span className="text-[15px] font-bold text-white">Chatterbox</span>
        </div>

        {/* Ban icon */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
          <BanIcon className="h-7 w-7 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-[28px] font-bold leading-tight tracking-tight text-white">
          Account Suspended
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-[#888]">
          Your account has been suspended by a platform administrator.
          You are unable to access Chatterbox while this suspension is active.
        </p>

        {/* Details card */}
        <div className="mb-6 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4">
          {reason && (
            <div className="mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                Reason
              </div>
              <p className="mt-1 text-[14px] leading-relaxed text-[#ccc]">
                {reason}
              </p>
            </div>
          )}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
              Duration
            </div>
            <p className="mt-1 text-[14px] text-[#ccc]">
              {isPermanent ? (
                <span className="text-red-400">Permanent suspension</span>
              ) : (
                <>
                  Expires{" "}
                  <span className="text-white">
                    {formatBanExpiry(bannedUntil!)}
                  </span>
                  <span className="ml-2 text-[12px] text-[#555]">
                    ({new Date(bannedUntil!).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })})
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Contact note */}
        <div className="mb-6 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] p-3">
          <p className="text-[12px] leading-relaxed text-[#555]">
            If you believe this was a mistake, please contact the platform
            administrator for assistance.
          </p>
        </div>

        {/* Sign out */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleSignOut}
          loading={signingOut}
        >
          <SignOutIcon className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
