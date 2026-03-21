"use client";

import Link from "next/link";
import { CommentDiscussionIcon as MessageSquare, AlertIcon as AlertCircle, PeopleIcon as Users, HashIcon as Hash } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";

interface InviteLandingClientProps {
  box?: {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
  };
  role?: string;
  code?: string;
  memberCount?: number;
  channelCount?: number;
  inviterName?: string | null;
  inviterAvatar?: string | null;
  error?: string;
}

export function InviteLandingClient({
  box,
  role,
  code,
  memberCount,
  channelCount,
  inviterName,
  inviterAvatar,
  error,
}: InviteLandingClientProps) {
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6">
        <div className="w-full max-w-[420px] text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a0f14]">
            <AlertCircle className="h-7 w-7 text-[#de1135]" />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-white">
            Invalid Invite
          </h1>
          <p className="mt-2 text-[14px] text-[#de1135]">{error}</p>
          <div className="mt-8">
            <Link href="/login">
              <Button className="w-full">Go to Chatterbox</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!box) return null;

  const initials = box.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-[#1a1a1a] px-6">
        <div className="flex items-center gap-2">
          <div className="logo-glass flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <MessageSquare className="h-4 w-4 text-black" />
          </div>
          <span className="text-[15px] font-bold text-white">Chatterbox</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          {/* Inviter context */}
          {inviterName && (
            <div className="mb-6 flex items-center justify-center gap-2">
              {inviterAvatar ? (
                <img
                  src={inviterAvatar}
                  alt=""
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-[8px] font-bold text-white">
                  {inviterName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              <span className="text-[13px] text-[#888]">
                <span className="font-medium text-white">{inviterName}</span>{" "}
                invited you to join
              </span>
            </div>
          )}

          {/* Box card */}
          <div className="rounded-[16px] border border-[#1a1a1a] bg-[#0f0f0f] p-8">
            <div className="text-center">
              {box.icon_url ? (
                <img
                  src={box.icon_url}
                  alt=""
                  className="mx-auto mb-4 h-20 w-20 rounded-2xl"
                />
              ) : (
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-[24px] font-bold text-black">
                  {initials}
                </div>
              )}

              <h1 className="text-[24px] font-bold tracking-tight text-white">
                {box.name}
              </h1>

              <div className="mt-1 text-[13px] text-[#444]">
                getchatterbox.app/{box.slug}
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-center gap-4">
                {memberCount !== undefined && memberCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[13px] text-[#666]">
                    <Users className="h-3.5 w-3.5" />
                    {memberCount} member{memberCount !== 1 ? "s" : ""}
                  </span>
                )}
                {memberCount !== undefined &&
                  memberCount > 0 &&
                  channelCount !== undefined &&
                  channelCount > 0 && (
                    <span className="text-[#333]">·</span>
                  )}
                {channelCount !== undefined && channelCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[13px] text-[#666]">
                    <Hash className="h-3.5 w-3.5" />
                    {channelCount} channel{channelCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Role badge */}
              {role && (
                <div className="mt-3 flex justify-center">
                  <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-[12px] capitalize text-[#888]">
                    Join as {role}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <Link href={`/login?redirect=${encodeURIComponent(`/join?code=${code}`)}`}>
              <Button className="w-full">Sign in to join</Button>
            </Link>
            <Link href={`/signup?redirect=${encodeURIComponent(`/join?code=${code}`)}`}>
              <Button variant="secondary" className="w-full">
                Create an account
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-[12px] text-[#444]">
            Already have an account? Sign in above to accept this invite.
          </p>
        </div>
      </div>
    </div>
  );
}
