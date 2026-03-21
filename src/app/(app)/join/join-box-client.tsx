"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon as ArrowLeft, LinkIcon, AlertIcon as AlertCircle, HashIcon as Hash, PeopleIcon as Users, CommentDiscussionIcon as MessageSquare } from "@primer/octicons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface InviteInfo {
  code: string;
  role: string;
  member_count: number;
  channel_count: number;
  boxes: {
    id: string;
    short_id: string;
    name: string;
    slug: string;
    icon_url: string | null;
  } | null;
}

type ViewState = "input" | "preview" | "error";

function extractCode(input: string): string {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed, "https://placeholder.com");
    const codeParam = url.searchParams.get("code");
    if (codeParam) return codeParam;
  } catch {
    // not a URL
  }

  const inviteMatch = trimmed.match(/\/invite\/([a-zA-Z0-9]+)/);
  if (inviteMatch) return inviteMatch[1];

  return trimmed;
}

export function JoinBoxClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewState>("input");
  const [invite, setInvite] = useState<InviteInfo | null>(null);

  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode);
      lookupCode(urlCode);
    }
  }, []);

  async function lookupCode(rawCode: string) {
    const extracted = extractCode(rawCode);
    if (!extracted) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/invites/join?code=${encodeURIComponent(extracted)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid invite code");
        setView("error");
        setLoading(false);
        return;
      }

      setInvite(data.invite);
      setView("preview");
    } catch {
      setError("Something went wrong");
      setView("error");
    }
    setLoading(false);
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    await lookupCode(code);
  }

  async function handleJoin() {
    if (!invite) return;

    setJoining(true);
    setError("");

    try {
      const res = await fetch("/api/invites/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: invite.code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.box) {
          router.refresh();
          router.push(
            data.box.short_id
              ? `/box/${data.box.short_id}`
              : "/dashboard"
          );
          return;
        }
        setError(data.error || "Could not join");
        setView("error");
        setJoining(false);
        return;
      }

      router.refresh();
      router.push(
        data.box?.short_id
          ? `/box/${data.box.short_id}`
          : "/dashboard"
      );
      return;
    } catch {
      setError("Something went wrong");
      setView("error");
    }
    setJoining(false);
  }

  function handleReset() {
    setCode("");
    setError("");
    setInvite(null);
    setView("input");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="logo-glass flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <MessageSquare className="h-4 w-4 text-black" />
          </div>
          <span className="text-[15px] font-bold text-white">Chatterbox</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[480px]">
          {/* Input View */}
          {view === "input" && (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a1a1a]">
                  <LinkIcon className="h-7 w-7 text-[#888]" />
                </div>
                <h2 className="text-[24px] font-bold tracking-tight text-white">
                  Join a Box
                </h2>
                <p className="mt-1 text-[14px] text-[#666]">
                  Enter an invite code to join an existing workspace.
                </p>
              </div>

              <form onSubmit={handleLookup} className="space-y-5">
                <Input
                  id="code"
                  label="Invite code"
                  placeholder="Paste an invite link or code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError("");
                  }}
                  error={error && view === "input" ? error : undefined}
                  autoFocus
                />

                <p className="text-[12px] text-[#555]">
                  Ask a workspace admin for an invite code, or paste an invite
                  link.
                </p>

                <div className="pt-2">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!code.trim()}
                    className="w-full"
                  >
                    Look up invite
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Loading View */}
          {view === "input" && loading && (
            <div className="mt-6 flex items-center justify-center">
              <Spinner />
            </div>
          )}

          {/* Preview View */}
          {view === "preview" && invite && invite.boxes && (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-[24px] font-bold tracking-tight text-white">
                  You&apos;ve been invited
                </h2>
                <p className="mt-1 text-[14px] text-[#666]">
                  You&apos;re about to join this workspace.
                </p>
              </div>

              <div className="mb-6 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-6">
                <div className="text-center">
                  {invite.boxes.icon_url ? (
                    <img
                      src={invite.boxes.icon_url}
                      alt=""
                      className="mx-auto mb-3 h-16 w-16 rounded-xl"
                    />
                  ) : (
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-white text-[20px] font-bold text-black">
                      {invite.boxes.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="text-[20px] font-bold text-white">
                    {invite.boxes.name}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#444]">
                    getchatterbox.app/{invite.boxes.slug}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-4 border-t border-[#1a1a1a] pt-4">
                  <span className="flex items-center gap-1.5 text-[13px] text-[#666]">
                    <Users className="h-3.5 w-3.5" />
                    {invite.member_count} member{invite.member_count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[#333]">·</span>
                  <span className="flex items-center gap-1.5 text-[13px] text-[#666]">
                    <Hash className="h-3.5 w-3.5" />
                    {invite.channel_count} channel{invite.channel_count !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-3 flex justify-center">
                  <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-[12px] capitalize text-[#888]">
                    Joining as {invite.role}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleJoin}
                  loading={joining}
                  className="flex-1"
                >
                  Join Box
                </Button>
              </div>
            </>
          )}

          {/* Error View */}
          {view === "error" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a0f14]">
                <AlertCircle className="h-7 w-7 text-[#de1135]" />
              </div>
              <h2 className="text-[24px] font-bold tracking-tight text-white">
                Couldn&apos;t join
              </h2>
              <p className="mt-1 text-[14px] text-[#de1135]">{error}</p>

              <div className="mt-8">
                <Button onClick={handleReset} className="w-full">
                  Try another code
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
