"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon as ArrowRight, MentionIcon as AtSign, CheckIcon as Check, PencilIcon as Pencil, MailIcon as Mail, PeopleIcon as Users } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

type Step = "loading" | "full-name" | "confirm" | "username" | "invites" | "create-box";

interface Box {
  id: string;
  short_id: string;
  name: string;
  slug: string;
}

interface PendingInvite {
  code: string;
  box_name: string;
  box_icon_url: string | null;
  role: string;
  inviter_name: string | null;
  member_count: number;
}

interface UserInfo {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  isOAuth: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [boxName, setBoxName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

  // Fetch user info on mount
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const provider = user.app_metadata?.provider;
      const isOAuth = provider === "google" || provider === "github" || provider === "apple";
      const name = (user.user_metadata?.full_name as string) || "";
      const avatarUrl = (user.user_metadata?.avatar_url as string) || null;

      setUserInfo({
        fullName: name,
        email: user.email ?? "",
        avatarUrl,
        isOAuth,
      });
      setFullName(name);

      // OAuth users already have a name from the provider → go to confirm step
      // Email users need to enter their name first
      setStep(isOAuth ? "confirm" : "full-name");
    }
    loadUser();
  }, [router]);

  async function handleSetFullName() {
    if (!fullName.trim()) return;
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Also update the profile table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName.trim() })
          .eq("id", user.id);
      }

      setLoading(false);
      setStep("username");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setError("");
    setLoading(true);

    try {
      if (fullName.trim() && fullName.trim() !== userInfo?.fullName) {
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { full_name: fullName.trim() },
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({ full_name: fullName.trim() })
            .eq("id", user.id);
        }
      }

      setLoading(false);
      setStep("username");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleSetUsername() {
    if (!username.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/profile/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set username");
        setLoading(false);
        return;
      }

      setLoading(false);

      // Check for pending invites for this email
      await checkPendingInvites();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function checkPendingInvites() {
    if (!userInfo?.email) {
      setStep("create-box");
      return;
    }

    try {
      const res = await fetch(`/api/invites/pending?email=${encodeURIComponent(userInfo.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.invites && data.invites.length > 0) {
          setPendingInvites(data.invites);
          setStep("invites");
          return;
        }
      }
    } catch {
      // If check fails, just go to create box
    }

    setStep("create-box");
  }

  async function handleJoinInvite(code: string) {
    setError("");
    setJoiningCode(code);

    try {
      const res = await fetch("/api/invites/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join");
        setJoiningCode(null);
        return;
      }

      // Go to the box
      router.push(`/box/${data.box.short_id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setJoiningCode(null);
    }
  }

  async function handleCreateBox() {
    if (!boxName.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/boxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boxName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create workspace");
        setLoading(false);
        return;
      }

      setLoading(false);
      // Go right to the box
      router.push(`/box/${data.box.short_id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  function goToDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  const isValidUsername = /^[a-zA-Z0-9._-]{2,30}$/.test(username.trim());
  const totalSteps = 4;

  function ProgressBar({ current }: { current: number }) {
    return (
      <div className="mb-8 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < current ? "bg-white" : "bg-[#2a2a2a]"}`}
          />
        ))}
      </div>
    );
  }

  // ── Loading ──
  if (step === "loading") {
    return (
      <div className="py-20">
        <Spinner size="lg" center />
      </div>
    );
  }

  // ── Full Name (email signup users) ──
  if (step === "full-name") {
    return (
      <div>
        <ProgressBar current={1} />

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          What&apos;s your name?
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          This is how you&apos;ll appear to others in Chatterbox.
        </p>

        <div className="space-y-4">
          <Input
            id="fullName"
            label="Full name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError("");
            }}
            autoFocus
          />

          {error && (
            <p className="text-[14px] text-[#de1135]">{error}</p>
          )}

          <div className="pt-2">
            <Button
              onClick={handleSetFullName}
              loading={loading}
              disabled={!fullName.trim()}
              className="w-full"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm Info (OAuth users) ──
  if (step === "confirm") {
    return (
      <div>
        <ProgressBar current={1} />

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Confirm your info
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          We got these details from your account. Make sure everything looks right.
        </p>

        {/* Profile card */}
        <div className="mb-6 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-5">
          <div className="flex items-center gap-4">
            {userInfo?.avatarUrl ? (
              <img
                src={userInfo.avatarUrl}
                alt=""
                className="h-14 w-14 rounded-full"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[18px] font-bold text-black">
                {userInfo?.fullName?.[0]?.toUpperCase() || userInfo?.email?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-semibold text-white">
                {userInfo?.fullName || "—"}
              </div>
              <div className="truncate text-[14px] text-[#888]">
                {userInfo?.email}
              </div>
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e]/10">
              <Check className="h-3.5 w-3.5 text-[#22c55e]" />
            </div>
          </div>
        </div>

        {/* Editable display name */}
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1.5 block text-[13px] font-medium text-[#888]">
              Display name
            </label>
            <div className="relative">
              <input
                id="displayName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-[#2a2a2a] bg-[#111] px-3 pr-9 text-[14px] text-white placeholder:text-[#555] focus:border-[#444] focus:outline-none"
              />
              <Pencil className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555]" />
            </div>
          </div>

          {error && <p className="text-[14px] text-[#de1135]">{error}</p>}

          <div className="pt-2">
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={!fullName.trim()}
              className="w-full"
            >
              Looks good, continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Choose Username ──
  if (step === "username") {
    return (
      <div>
        <ProgressBar current={2} />

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Choose a username
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          This is how others will @mention you in conversations.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-[13px] font-medium text-[#888]"
            >
              Username
            </label>
            <div className="flex items-center gap-0 rounded-[8px] border border-[#2a2a2a] bg-[#111] focus-within:border-[#444]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center text-[#555]">
                <AtSign className="h-4 w-4" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""));
                  setError("");
                }}
                placeholder="e.g. george, jane.doe"
                autoFocus
                className="h-10 flex-1 bg-transparent pr-3 text-[14px] text-white placeholder:text-[#555] focus:outline-none"
                maxLength={30}
              />
            </div>
            {username.trim() && !isValidUsername && (
              <p className="mt-1.5 text-[12px] text-[#666]">
                Must be 2-30 characters: letters, numbers, dots, hyphens, underscores
              </p>
            )}
          </div>

          {error && (
            <p className="text-[14px] text-[#de1135]">{error}</p>
          )}

          <div className="pt-2">
            <Button
              onClick={handleSetUsername}
              loading={loading}
              disabled={!isValidUsername}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        </div>

        <button
          onClick={goToDashboard}
          className="mt-6 text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
        >
          Skip, go to dashboard
        </button>
      </div>
    );
  }

  // ── Pending Invites ──
  if (step === "invites") {
    return (
      <div>
        <ProgressBar current={3} />

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          You&apos;ve been invited
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          You have pending invites to join these workspaces.
        </p>

        <div className="space-y-3">
          {pendingInvites.map((invite) => {
            const initials = invite.box_name
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
                {invite.box_icon_url ? (
                  <img
                    src={invite.box_icon_url}
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
                    {invite.box_name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#555]">
                    <Users className="h-3 w-3" />
                    {invite.member_count} member{invite.member_count !== 1 ? "s" : ""}
                    {invite.inviter_name && (
                      <>
                        <span className="text-[#333]">·</span>
                        <span>Invited by {invite.inviter_name}</span>
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

        {error && (
          <p className="mt-4 text-[14px] text-[#de1135]">{error}</p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setStep("create-box")}
            className="text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
          >
            Create a new Box instead
          </button>
          <span className="text-[#333]">·</span>
          <button
            onClick={goToDashboard}
            className="text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Create Box ──
  return (
    <div>
      <ProgressBar current={3} />

      <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
        Create your first Box
      </h1>
      <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
        Boxes are workspaces for your team. You can create more later.
      </p>

      <div className="space-y-4">
        <Input
          id="boxName"
          label="Workspace name"
          placeholder="e.g. Acme Corp, Design Team"
          value={boxName}
          onChange={(e) => setBoxName(e.target.value)}
          autoFocus
        />

        {error && (
          <p className="text-[14px] text-[#de1135]">{error}</p>
        )}

        <div className="pt-2">
          <Button
            onClick={handleCreateBox}
            loading={loading}
            disabled={!boxName.trim()}
            className="w-full"
          >
            Create Box
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/join"
          className="text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
        >
          Join an existing Box
        </Link>
        <span className="text-[#333]">·</span>
        <button
          onClick={goToDashboard}
          className="text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
        >
          Skip, go to dashboard
        </button>
      </div>
    </div>
  );
}
