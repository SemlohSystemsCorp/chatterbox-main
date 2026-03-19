"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CommentDiscussionIcon as MessageSquare, XIcon as X, LocationIcon as MapPin, BriefcaseIcon as Briefcase, GlobeIcon as Globe, ClockIcon as Clock, CalendarIcon as Calendar, CircleIcon as Circle, PersonIcon as User, DeviceMobileIcon as Phone, MailIcon as Mail } from "@primer/octicons-react";
import { useRouter } from "next/navigation";
import { getInitials, type SenderData } from "@/lib/chat-helpers";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

// ── Full profile data fetched from DB ──

interface FullProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  username: string;
  status: "online" | "away" | "dnd" | "offline";
  status_message: string | null;
  created_at: string;
  // From user_settings
  display_name: string;
  bio: string;
  pronouns: string;
  phone: string;
  location: string;
  website: string;
  birthday: string;
  company: string;
  job_title: string;
  timezone: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  online: { color: "bg-[#22c55e]", label: "Online" },
  away: { color: "bg-[#f59e0b]", label: "Away" },
  dnd: { color: "bg-[#de1135]", label: "Do Not Disturb" },
  offline: { color: "bg-[#555]", label: "Offline" },
};

// ── Profile Card (popover on name click) ──

interface MemberProfileCardProps {
  sender: SenderData;
  currentUserId: string;
  boxShortId?: string;
  children: React.ReactNode;
}

export function MemberProfileCard({
  sender,
  currentUserId,
  boxShortId,
  children,
}: MemberProfileCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [quickProfile, setQuickProfile] = useState<{
    status: string;
    status_message: string | null;
    display_name: string;
    bio: string;
    pronouns: string;
    job_title: string;
    company: string;
    location: string;
    phone: string;
    website: string;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isOwnMessage = sender.id === currentUserId;

  // Fetch quick profile data when card opens
  useEffect(() => {
    if (!open) return;
    fetch(`/api/profile/${sender.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) setQuickProfile(data.profile);
      })
      .catch(() => {});
  }, [open, sender.id]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleDm() {
    if (starting || isOwnMessage) return;
    setStarting(true);
    try {
      const res = await fetch("/api/conversations/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: sender.id }),
      });
      if (res.ok) {
        const { short_id } = await res.json();
        const boxParam = boxShortId ? `?box=${boxShortId}` : "";
        router.push(`/dm/${short_id}${boxParam}`);
      }
    } catch (err) {
      console.error("Failed to start DM:", err);
    } finally {
      setStarting(false);
      setOpen(false);
    }
  }

  const statusCfg = STATUS_CONFIG[quickProfile?.status ?? "offline"] ?? STATUS_CONFIG.offline;

  return (
    <>
      <div className="relative inline" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="cursor-pointer text-left hover:underline"
        >
          {children}
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-[10px] border border-[#1a1a1a] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Avatar + Name */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <div className="relative shrink-0">
                {sender.avatar_url ? (
                  <img
                    src={sender.avatar_url}
                    alt=""
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a] text-[14px] font-bold text-white">
                    {getInitials(sender.full_name, sender.email)}
                  </div>
                )}
                {quickProfile && (
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[2.5px] border-[#111] ${statusCfg.color}`}
                    title={statusCfg.label}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-white">
                {quickProfile?.display_name || sender.full_name || sender.email}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {sender.username && (
                  <span className="text-[12px] text-[#666]">@{sender.username}</span>
                )}
                {quickProfile?.pronouns && (
                  <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] text-[#888]">{quickProfile.pronouns}</span>
                )}
                {quickProfile?.status && (
                  <span className="flex items-center gap-1 text-[11px] text-[#555]">
                    <Circle className={`h-2 w-2 fill-current ${
                      quickProfile.status === "online" ? "text-[#22c55e]" :
                      quickProfile.status === "away" ? "text-[#f59e0b]" :
                      quickProfile.status === "dnd" ? "text-[#de1135]" : "text-[#555]"
                    }`} />
                    {statusCfg.label}
                  </span>
                )}
              </div>
              {quickProfile?.status_message && (
                <p className="mt-1 text-[12px] text-[#888]">
                  {quickProfile.status_message}
                </p>
              )}
            </div>
            </div>

            {/* Quick info — only rows the user has filled out */}
            {quickProfile && (quickProfile.job_title || quickProfile.company || quickProfile.location || quickProfile.website || quickProfile.phone) && (
              <div className="border-t border-[#1a1a1a] px-4 py-2.5 space-y-1.5">
                {(quickProfile.job_title || quickProfile.company) && (
                  <div className="flex items-center gap-2 text-[12px] text-[#888]">
                    <Briefcase className="h-3 w-3 shrink-0 text-[#555]" />
                    <span className="truncate">
                      {quickProfile.job_title}
                      {quickProfile.job_title && quickProfile.company && " at "}
                      {quickProfile.company}
                    </span>
                  </div>
                )}
                {quickProfile.location && (
                  <div className="flex items-center gap-2 text-[12px] text-[#888]">
                    <MapPin className="h-3 w-3 shrink-0 text-[#555]" />
                    <span className="truncate">{quickProfile.location}</span>
                  </div>
                )}
                {quickProfile.website && (
                  <div className="flex items-center gap-2 text-[12px] text-[#888]">
                    <Globe className="h-3 w-3 shrink-0 text-[#555]" />
                    <a
                      href={quickProfile.website.startsWith("http") ? quickProfile.website : `https://${quickProfile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[#6b8afd] hover:underline"
                    >
                      {quickProfile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {quickProfile.phone && (
                  <div className="flex items-center gap-2 text-[12px] text-[#888]">
                    <Phone className="h-3 w-3 shrink-0 text-[#555]" />
                    <span className="truncate">{quickProfile.phone}</span>
                  </div>
                )}
              </div>
            )}

            {quickProfile?.bio && (
              <div className="border-t border-[#1a1a1a] px-4 py-2.5">
                <p className="line-clamp-2 text-[12px] leading-[18px] text-[#888]">
                  {quickProfile.bio}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-[#1a1a1a] p-2 flex gap-1">
              {!isOwnMessage && (
                <button
                  onClick={handleDm}
                  disabled={starting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[6px] bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#222] disabled:opacity-50"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {starting ? "Opening..." : "Message"}
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <User className="h-3.5 w-3.5" />
                View Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full profile modal */}
      {modalOpen && (
        <UserProfileModal
          userId={sender.id}
          currentUserId={currentUserId}
          boxShortId={boxShortId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── Full Profile Modal ──

function UserProfileModal({
  userId,
  currentUserId,
  boxShortId,
  onClose,
}: {
  userId: string;
  currentUserId: string;
  boxShortId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isOwnProfile = userId === currentUserId;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}`);
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleDm() {
    if (starting || isOwnProfile) return;
    setStarting(true);
    try {
      const res = await fetch("/api/conversations/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: userId }),
      });
      if (res.ok) {
        const { short_id } = await res.json();
        const boxParam = boxShortId ? `?box=${boxShortId}` : "";
        router.push(`/dm/${short_id}${boxParam}`);
        onClose();
      }
    } catch {
      // ignore
    } finally {
      setStarting(false);
    }
  }

  const statusCfg = STATUS_CONFIG[profile?.status ?? "offline"] ?? STATUS_CONFIG.offline;

  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[440px] rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="text-[#555]" />
          </div>
        ) : !profile ? (
          <div className="py-20 text-center text-[13px] text-[#555]">
            Profile not found
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className="relative">
              <div className="h-24 rounded-t-[12px] bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
              <Tooltip label="Close">
                <button
                  onClick={onClose}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 transition-colors hover:bg-black/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </Tooltip>
              <div className="absolute -bottom-8 left-6">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-[72px] w-[72px] rounded-full border-4 border-[#111]"
                    />
                  ) : (
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-[#111] bg-[#1a1a1a] text-[22px] font-bold text-white">
                      {getInitials(profile.full_name, profile.email)}
                    </div>
                  )}
                  <div
                    className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-[3px] border-[#111] ${statusCfg.color}`}
                    title={statusCfg.label}
                  />
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="px-6 pb-4 pt-11">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-white">
                    {profile.display_name || profile.full_name || profile.email}
                  </h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {profile.username && (
                      <span className="text-[13px] text-[#666]">@{profile.username}</span>
                    )}
                    {profile.pronouns && (
                      <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] text-[#888]">{profile.pronouns}</span>
                    )}
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-[#1a1a1a] px-2.5 py-1 text-[11px] font-medium">
                  <Circle className={`h-2.5 w-2.5 fill-current ${
                    profile.status === "online" ? "text-[#22c55e]" :
                    profile.status === "away" ? "text-[#f59e0b]" :
                    profile.status === "dnd" ? "text-[#de1135]" : "text-[#555]"
                  }`} />
                  <span className="text-[#999]">{statusCfg.label}</span>
                </span>
              </div>

              {profile.status_message && (
                <p className="mt-2 text-[13px] text-[#888]">
                  &ldquo;{profile.status_message}&rdquo;
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="border-t border-[#1a1a1a] px-6 py-4">
                <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                  About
                </h3>
                <p className="whitespace-pre-wrap text-[13px] leading-[20px] text-[#ccc]">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Details — only render rows the user has filled in */}
            {(profile.job_title || profile.company || profile.location || profile.timezone || profile.website || profile.phone || profile.email || profile.birthday) && (
              <div className="border-t border-[#1a1a1a] px-6 py-4">
                <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                  Details
                </h3>
                <div className="space-y-2.5">
                  {(profile.job_title || profile.company) && (
                    <ProfileRow icon={Briefcase}>
                      {profile.job_title}
                      {profile.job_title && profile.company && " at "}
                      {profile.company && (
                        <span className="font-medium text-[#ccc]">{profile.company}</span>
                      )}
                    </ProfileRow>
                  )}
                  {profile.location && (
                    <ProfileRow icon={MapPin}>{profile.location}</ProfileRow>
                  )}
                  {profile.timezone && (
                    <ProfileRow icon={Clock}>
                      {profile.timezone}
                      <span className="ml-1.5 text-[#555]">
                        ({new Date().toLocaleTimeString("en-US", {
                          timeZone: profile.timezone,
                          hour: "numeric",
                          minute: "2-digit",
                        })})
                      </span>
                    </ProfileRow>
                  )}
                  {profile.website && (
                    <ProfileRow icon={Globe}>
                      <a
                        href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6b8afd] hover:underline"
                      >
                        {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    </ProfileRow>
                  )}
                  {profile.email && (
                    <ProfileRow icon={Mail}>{profile.email}</ProfileRow>
                  )}
                  {profile.phone && (
                    <ProfileRow icon={Phone}>{profile.phone}</ProfileRow>
                  )}
                  {profile.birthday && (
                    <ProfileRow icon={Calendar}>{profile.birthday}</ProfileRow>
                  )}
                </div>
              </div>
            )}

            {/* Member since */}
            <div className="border-t border-[#1a1a1a] px-6 py-3">
              <div className="text-[12px] text-[#555]">
                Member since <span className="text-[#888]">{memberSince}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[#1a1a1a] p-4">
              {isOwnProfile ? (
                <button
                  onClick={() => {
                    router.push("/settings");
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#222]"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleDm}
                  disabled={starting}
                  className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-[#e5e5e5] disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  {starting ? "Opening..." : "Send Message"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Reusable detail row ──

function ProfileRow({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-[#999]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#555]" />
      <span className="truncate">{children}</span>
    </div>
  );
}
