"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight, AtSign, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Step = "loading" | "welcome" | "confirm" | "username" | "create-box" | "invite";

interface Box {
  id: string;
  short_id: string;
  name: string;
  slug: string;
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
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [boxName, setBoxName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdBox, setCreatedBox] = useState<Box | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

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
      const fullName = (user.user_metadata?.full_name as string) || "";
      const avatarUrl = (user.user_metadata?.avatar_url as string) || null;

      setUserInfo({
        fullName,
        email: user.email ?? "",
        avatarUrl,
        isOAuth,
      });
      setDisplayName(fullName);

      // OAuth users go to confirm step, email users go to welcome
      setStep(isOAuth ? "confirm" : "welcome");
    }
    loadUser();
  }, [router]);

  async function handleConfirm() {
    setError("");
    setLoading(true);

    try {
      // Update display name if changed
      if (displayName.trim() && displayName.trim() !== userInfo?.fullName) {
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { full_name: displayName.trim() },
        });
      }

      setLoading(false);
      setStep("create-box");
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
      setStep("create-box");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleSendInvites() {
    if (!inviteEmails.trim() || !createdBox) return;
    setError("");
    setInviteLoading(true);

    const emails = inviteEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (emails.length === 0) {
      setError("Enter at least one email address");
      setInviteLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box_id: createdBox.id, emails }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send invites");
        setInviteLoading(false);
        return;
      }

      setInviteSuccess(true);
      setInviteLoading(false);

      // Auto-navigate after a short delay
      setTimeout(handleFinish, 1500);
    } catch {
      setError("Something went wrong");
      setInviteLoading(false);
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

      setCreatedBox(data.box);
      setLoading(false);
      setStep("invite");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  function handleFinish() {
    if (createdBox) {
      router.push(`/box/${createdBox.short_id}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  const isValidUsername = /^[a-zA-Z0-9._-]{2,30}$/.test(username.trim());

  // ── Loading ──
  if (step === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // ── Welcome (email signup users) ──
  if (step === "welcome") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
          <MessageSquare className="h-8 w-8 text-black" />
        </div>
        <h1 className="mb-3 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Welcome to Chatterbox
        </h1>
        <p className="mx-auto mb-10 max-w-sm text-[16px] leading-[24px] text-[#888]">
          Let&apos;s set up your workspace. It only takes a minute.
        </p>
        <Button onClick={() => setStep("username")} className="w-full">
          Get started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <button
          onClick={handleFinish}
          className="mt-4 text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
        >
          Skip for now
        </button>
      </div>
    );
  }

  // ── Confirm Info (OAuth users) ──
  if (step === "confirm") {
    return (
      <div>
        {/* Progress */}
        <div className="mb-8 flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-white" />
          <div className="h-1 flex-1 rounded-full bg-[#2a2a2a]" />
        </div>

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
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
              disabled={!displayName.trim()}
              className="w-full"
            >
              Looks good, continue
            </Button>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="mt-6 text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
        >
          Skip for now
        </button>
      </div>
    );
  }

  // ── Choose Username (email signup users) ──
  if (step === "username") {
    return (
      <div>
        {/* Progress */}
        <div className="mb-8 flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-white" />
          <div className="h-1 flex-1 rounded-full bg-[#2a2a2a]" />
          <div className="h-1 flex-1 rounded-full bg-[#2a2a2a]" />
        </div>

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
          onClick={() => setStep("create-box")}
          className="mt-6 text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
        >
          Skip for now
        </button>
      </div>
    );
  }

  // ── Create Box ──
  if (step === "create-box") {
    const totalSteps = userInfo?.isOAuth ? 2 : 3;
    return (
      <div>
        {/* Progress */}
        <div className="mb-8 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i < totalSteps - 1 ? "bg-white" : "bg-[#2a2a2a]"}`}
            />
          ))}
        </div>

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

        <button
          onClick={handleFinish}
          className="mt-6 text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
        >
          Skip for now
        </button>
      </div>
    );
  }

  // ── Invite ──
  return (
    <div>
      {/* Progress */}
      <div className="mb-8 flex gap-2">
        {Array.from({ length: userInfo?.isOAuth ? 2 : 3 }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-white" />
        ))}
      </div>

      <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
        Invite your team
      </h1>
      <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
        Chatterbox is better with others. Add teammates by email.
      </p>

      {inviteSuccess ? (
        <div className="rounded-[12px] border border-[#2a2a2a] bg-[#0a0a0a] p-6 text-center">
          <p className="text-[16px] font-medium text-white">
            Invites sent!
          </p>
          <p className="mt-1 text-[14px] text-[#888]">
            Redirecting to your workspace...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            id="inviteEmails"
            label="Email addresses"
            placeholder="name@company.com, name@company.com"
            value={inviteEmails}
            onChange={(e) => setInviteEmails(e.target.value)}
            autoFocus
          />

          {error && (
            <p className="text-[14px] text-[#de1135]">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={handleFinish}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSendInvites}
              loading={inviteLoading}
              disabled={!inviteEmails.trim()}
              className="flex-1"
            >
              Send invites
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
