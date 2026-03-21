"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  MentionIcon as AtSign,
  PencilIcon as Pencil,
  PeopleIcon as Users,
} from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

type Step =
  | "loading"
  | "full-name"
  | "confirm"
  | "username"
  | "invites"
  | "create-box"
  | "invite-team";

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

const BOX_TEMPLATES = [
  { id: "team", label: "Team / Company", description: "#general, #random, #announcements, #watercooler" },
  { id: "engineering", label: "Engineering", description: "#general, #engineering, #devops, #incidents, #random" },
  { id: "community", label: "Community", description: "#general, #introductions, #off-topic, #feedback" },
  { id: "friends", label: "Friends / Gaming", description: "#general, #random, #memes" },
  { id: "personal", label: "Just me", description: "#general, #notes" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [step, setStep] = useState<Step>("loading");
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [boxName, setBoxName] = useState("");
  const [boxTemplate, setBoxTemplate] = useState("team");
  const [createdBoxId, setCreatedBoxId] = useState<string | null>(null);
  const [createdBoxShortId, setCreatedBoxShortId] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResults, setInviteResults] = useState<{ email: string; success: boolean }[] | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  function goToStep(nextStep: Step) {
    setStepHistory((prev) => [...prev, step]);
    setStep(nextStep);
    setError("");
  }

  function goBack() {
    const prev = stepHistory[stepHistory.length - 1];
    if (prev) {
      setStepHistory((h) => h.slice(0, -1));
      setStep(prev);
      setError("");
    }
  }

  // Fetch user info on mount
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const provider = user.app_metadata?.provider;
      const isOAuth =
        provider === "google" ||
        provider === "github" ||
        provider === "apple";
      const name = (user.user_metadata?.full_name as string) || "";
      const avatarUrl =
        (user.user_metadata?.avatar_url as string) || null;

      setUserInfo({
        fullName: name,
        email: user.email ?? "",
        avatarUrl,
        isOAuth,
      });
      setFullName(name);

      // OAuth users already have a name from the provider
      setStep(isOAuth ? "confirm" : "full-name");
    }
    loadUser();
  }, [router]);

  // Real-time username availability check
  const isValidUsername = /^[a-zA-Z0-9._-]{2,30}$/.test(username.trim());

  useEffect(() => {
    if (!isValidUsername) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/username/check?username=${encodeURIComponent(
            username.trim().toLowerCase()
          )}`
        );
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [username, isValidUsername]);

  async function completeOnboarding() {
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });
  }

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

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName.trim() })
          .eq("id", user.id);
      }

      setLoading(false);
      goToStep("username");
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection."
      );
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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({ full_name: fullName.trim() })
            .eq("id", user.id);
        }
      }

      setLoading(false);
      goToStep("username");
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection."
      );
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
      await checkPendingInvites();
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection."
      );
      setLoading(false);
    }
  }

  async function checkPendingInvites() {
    // If there's an invite code from URL, try to join it directly
    if (inviteCode) {
      try {
        const res = await fetch("/api/invites/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode }),
        });
        const data = await res.json();
        if (res.ok) {
          await completeOnboarding();
          router.push(`/box/${data.box.short_id}`);
          router.refresh();
          return;
        }
      } catch {
        // Fall through to normal flow
      }
    }

    // Check for email-based pending invites
    if (userInfo?.email) {
      try {
        const res = await fetch(
          `/api/invites/pending?email=${encodeURIComponent(userInfo.email)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.invites?.length > 0) {
            setPendingInvites(data.invites);
            goToStep("invites");
            return;
          }
        }
      } catch {
        // Fall through to create box
      }
    }

    goToStep("create-box");
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
        setError(data.error || "Failed to join workspace");
        setJoiningCode(null);
        return;
      }

      await completeOnboarding();
      router.push(`/box/${data.box.short_id}`);
      router.refresh();
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection."
      );
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
        body: JSON.stringify({ name: boxName.trim(), template: boxTemplate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create workspace");
        setLoading(false);
        return;
      }

      setCreatedBoxId(data.box.id);
      setCreatedBoxShortId(data.box.short_id);
      setLoading(false);

      // Generate a shareable invite link
      try {
        const linkRes = await fetch("/api/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ box_id: data.box.id, expires_in_hours: 168 }),
        });
        if (linkRes.ok) {
          const linkData = await linkRes.json();
          const baseUrl = window.location.origin;
          setInviteLink(`${baseUrl}/invite/${linkData.invite.code}`);
        }
      } catch {
        // Non-critical — invite link just won't show
      }

      goToStep("invite-team");
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection."
      );
      setLoading(false);
    }
  }

  function addInviteEmail() {
    const trimmed = inviteInput.trim().toLowerCase();
    if (!trimmed) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Invalid email address");
      return;
    }
    if (inviteEmails.includes(trimmed)) {
      setError("Email already added");
      return;
    }
    setInviteEmails((prev) => [...prev, trimmed]);
    setInviteInput("");
    setError("");
  }

  function removeInviteEmail(email: string) {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  }

  async function handleSendInvites() {
    if (inviteEmails.length === 0 || !createdBoxId) return;
    setError("");
    setInviteSending(true);

    try {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box_id: createdBoxId, emails: inviteEmails }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send invites");
        setInviteSending(false);
        return;
      }

      setInviteResults(data.results);
      setInviteSending(false);
    } catch {
      setError("Could not connect to the server. Check your internet connection.");
      setInviteSending(false);
    }
  }

  async function handleFinishOnboarding() {
    await completeOnboarding();
    if (createdBoxShortId) {
      router.push(`/box/${createdBoxShortId}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function goToDashboard() {
    await completeOnboarding();
    router.push("/dashboard");
    router.refresh();
  }

  // ── Progress bar: 4 steps (name → username → workspace → invite) ──
  function getStepNumber(): number {
    if (step === "full-name" || step === "confirm") return 1;
    if (step === "username") return 2;
    if (step === "invites" || step === "create-box") return 3;
    return 4;
  }

  const totalSteps = 4;

  function ProgressBar() {
    const current = getStepNumber();
    return (
      <div className="mb-8 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < current ? "bg-white" : "bg-[#2a2a2a]"
            }`}
          />
        ))}
      </div>
    );
  }

  function BackButton() {
    if (stepHistory.length === 0) return null;
    return (
      <button
        onClick={goBack}
        className="mb-6 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#1a1a1a]"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>
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
        <BackButton />
        <ProgressBar />

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          What&apos;s your name?
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          This is how you&apos;ll appear to others in Chatterbox.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSetFullName();
          }}
          className="space-y-4"
        >
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
              type="submit"
              loading={loading}
              disabled={!fullName.trim()}
              className="w-full"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── Confirm Info (OAuth users) ──
  if (step === "confirm") {
    return (
      <div>
        <BackButton />
        <ProgressBar />

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Confirm your info
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          We got these details from your account. Make sure everything
          looks right.
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
                {userInfo?.fullName?.[0]?.toUpperCase() ||
                  userInfo?.email?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-semibold text-white">
                {userInfo?.fullName || "\u2014"}
              </div>
              <div className="truncate text-[14px] text-[#888]">
                {userInfo?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Editable display name */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="displayName"
              className="mb-1.5 block text-[13px] font-medium text-[#888]"
            >
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

          {error && (
            <p className="text-[14px] text-[#de1135]">{error}</p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              disabled={!fullName.trim()}
              className="w-full"
            >
              Looks good, continue
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── Choose Username ──
  if (step === "username") {
    return (
      <div>
        <BackButton />
        <ProgressBar />

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Choose a username
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          This is how others will @mention you in conversations.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSetUsername();
          }}
          className="space-y-4"
        >
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
                  setUsername(
                    e.target.value.replace(/[^a-zA-Z0-9._-]/g, "")
                  );
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
                Must be 2-30 characters: letters, numbers, dots, hyphens,
                underscores
              </p>
            )}
            {usernameStatus === "checking" && (
              <p className="mt-1.5 text-[12px] text-[#555]">
                Checking availability...
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="mt-1.5 text-[12px] text-[#22c55e]">
                Username is available
              </p>
            )}
            {usernameStatus === "taken" && (
              <p className="mt-1.5 text-[12px] text-[#de1135]">
                Username is already taken
              </p>
            )}
          </div>

          {error && (
            <p className="text-[14px] text-[#de1135]">{error}</p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              disabled={
                !isValidUsername ||
                usernameStatus === "taken" ||
                usernameStatus === "checking"
              }
              className="w-full"
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── Pending Invites ──
  if (step === "invites") {
    return (
      <div>
        <BackButton />
        <ProgressBar />

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
                    {invite.member_count} member
                    {invite.member_count !== 1 ? "s" : ""}
                    {invite.inviter_name && (
                      <>
                        <span className="text-[#333]">&middot;</span>
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
            onClick={() => goToStep("create-box")}
            className="text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
          >
            Create a new Box instead
          </button>
          <span className="text-[#333]">&middot;</span>
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

  // ── Invite Team ──
  if (step === "invite-team") {
    const allSent = inviteResults && inviteResults.length > 0;

    return (
      <div>
        <ProgressBar />

        <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
          Invite your team
        </h1>
        <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
          Chatterbox is better with others. Invite people by email or share a link.
        </p>

        {/* Email invites */}
        {!allSent && (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#888]">
                Email addresses
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteInput}
                  onChange={(e) => { setInviteInput(e.target.value); setError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addInviteEmail();
                    }
                  }}
                  placeholder="name@company.com"
                  className="h-10 flex-1 rounded-[8px] border border-[#2a2a2a] bg-[#111] px-3 text-[14px] text-white placeholder:text-[#555] focus:border-[#444] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addInviteEmail}
                  className="h-10 rounded-[8px] bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#222]"
                >
                  Add
                </button>
              </div>
              <p className="mt-1.5 text-[12px] text-[#555]">
                Press Enter or comma to add multiple emails
              </p>
            </div>

            {inviteEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {inviteEmails.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1.5 rounded-full bg-[#1a1a1a] py-1 pl-3 pr-2 text-[13px] text-white"
                  >
                    {email}
                    <button
                      onClick={() => removeInviteEmail(email)}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-[#666] transition-colors hover:bg-[#333] hover:text-white"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            {inviteEmails.length > 0 && (
              <Button
                onClick={handleSendInvites}
                loading={inviteSending}
                className="w-full"
              >
                Send {inviteEmails.length} invite{inviteEmails.length !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        )}

        {/* Invite results */}
        {allSent && (
          <div className="space-y-2">
            {inviteResults.map((r) => (
              <div
                key={r.email}
                className="flex items-center justify-between rounded-[8px] bg-[#111] px-3 py-2"
              >
                <span className="text-[13px] text-white">{r.email}</span>
                <span className={`text-[12px] ${r.success ? "text-[#22c55e]" : "text-[#de1135]"}`}>
                  {r.success ? "Sent" : "Failed"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Shareable link */}
        {inviteLink && (
          <div className="mt-6">
            <label className="mb-1.5 block text-[13px] font-medium text-[#888]">
              Or share an invite link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="h-10 flex-1 truncate rounded-[8px] border border-[#2a2a2a] bg-[#111] px-3 text-[13px] text-[#888] focus:outline-none"
              />
              <button
                onClick={copyInviteLink}
                className="h-10 shrink-0 rounded-[8px] bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#222]"
              >
                {linkCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-[14px] text-[#de1135]">{error}</p>
        )}

        <div className="mt-8">
          <Button onClick={handleFinishOnboarding} className="w-full">
            {allSent || inviteEmails.length === 0 ? "Continue to Chatterbox" : "Skip for now"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Create Box ──
  return (
    <div>
      <BackButton />
      <ProgressBar />

      <h1 className="mb-2 text-[36px] font-bold leading-[44px] tracking-tight text-white">
        Create your first Box
      </h1>
      <p className="mb-8 text-[16px] leading-[24px] text-[#888]">
        Boxes are workspaces for your team. You can create more later.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateBox();
        }}
        className="space-y-5"
      >
        <Input
          id="boxName"
          label="Workspace name"
          placeholder="e.g. Acme Corp, Design Team"
          value={boxName}
          onChange={(e) => setBoxName(e.target.value)}
          autoFocus
        />

        {/* Template selection */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-white">
            What kind of workspace?
          </label>
          <div className="space-y-2">
            {BOX_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setBoxTemplate(t.id)}
                className={`w-full rounded-[10px] border-2 px-4 py-3 text-left transition-colors ${
                  boxTemplate === t.id
                    ? "border-white bg-[#1a1a1a]"
                    : "border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#333]"
                }`}
              >
                <div className="text-[14px] font-medium text-white">{t.label}</div>
                <div className="mt-0.5 text-[12px] text-[#666]">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[14px] text-[#de1135]">{error}</p>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            loading={loading}
            disabled={!boxName.trim()}
            className="w-full"
          >
            Create Box
          </Button>
        </div>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/join"
          className="text-[14px] text-[#888] underline underline-offset-2 hover:text-white"
        >
          Join an existing Box
        </Link>
        <span className="text-[#333]">&middot;</span>
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
