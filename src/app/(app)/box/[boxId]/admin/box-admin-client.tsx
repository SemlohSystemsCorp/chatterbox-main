"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon as ArrowLeft,
  ShieldIcon as Shield,
  LogIcon as ScrollText,
  GearIcon as Settings,
  GraphIcon as BarChart3,
  TrophyIcon as Crown,
  PeopleIcon as Users,
  PersonIcon as User,
  EyeIcon as Eye,
  ChevronDownIcon as ChevronDown,
  CheckIcon as Check,
  HashIcon as Hash,
  ClockIcon as Clock,
  AlertFillIcon as AlertTriangle,
  ArrowSwitchIcon as ArrowUpDown,
} from "@primer/octicons-react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { Tooltip } from "@/components/ui/tooltip";

// ── Types ──

interface BoxData {
  id: string;
  short_id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  plan: string;
  role: string;
}

interface ChannelData {
  id: string;
  short_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  is_archived: boolean;
  created_at: string;
}

interface MemberData {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  status: string;
  username: string;
}

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface Stats {
  memberCount: number;
  channelCount: number;
  messageCount: number;
  dailyMessages: Record<string, number>;
  memberGrowth: { joined_at: string }[];
  channelBreakdown: { name: string; count: number }[];
}

interface BoxAdminClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  boxes: BoxData[];
  box: {
    id: string;
    short_id: string;
    name: string;
    slug: string;
    description: string | null;
    icon_url: string | null;
    plan: string;
    role: string;
    owner_id: string;
    created_at: string;
  };
  channels: ChannelData[];
  members: MemberData[];
}

type Section = "permissions" | "logs" | "settings" | "analytics";

// ── Helpers ──

function SectionDivider() {
  return <div className="my-4 border-t border-[#1a1a1a]" />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
      {title}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
        {label}
      </div>
      <div className="mt-1 text-[24px] font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-[#555]">{sub}</div>}
    </div>
  );
}

function MiniBarChart({ data, maxBars = 14 }: { data: Record<string, number>; maxBars?: number }) {
  const entries = Object.entries(data).slice(-maxBars);
  if (entries.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center text-[13px] text-[#555]">
        No message data yet
      </div>
    );
  }
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex h-[120px] items-end gap-1">
      {entries.map(([day, count]) => (
        <Tooltip key={day} label={`${day}: ${count} messages`}>
          <div className="group flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full min-w-[4px] rounded-t-[3px] bg-[#276ef1] transition-colors group-hover:bg-[#4a8af5]"
              style={{ height: `${Math.max((count / max) * 100, 4)}%` }}
            />
            <span className="text-[9px] text-[#444]">
              {day.split("-").slice(1).join("/")}
            </span>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

function getRoleColor(role: string) {
  switch (role) {
    case "owner":
      return "text-yellow-500";
    case "admin":
      return "text-[#276ef1]";
    case "member":
      return "text-[#888]";
    case "guest":
      return "text-[#555]";
    default:
      return "text-[#888]";
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case "owner":
      return Crown;
    case "admin":
      return Shield;
    case "member":
      return User;
    case "guest":
      return Eye;
    default:
      return User;
  }
}

function formatLogAction(log: AuditLog): string {
  switch (log.action) {
    case "role_changed":
      return `changed a member's role from ${log.metadata.from_role} to ${log.metadata.to_role}`;
    case "settings_updated":
      return `updated box settings (${(log.metadata.fields as string[])?.join(", ") ?? "unknown"})`;
    case "member_removed":
      return "removed a member from the box";
    case "member_invited":
      return "invited a new member";
    case "channel_created":
      return "created a new channel";
    case "channel_deleted":
      return "deleted a channel";
    case "channel_archived":
      return "archived a channel";
    default:
      return log.action.replace(/_/g, " ");
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Role picker dropdown ──

function RolePicker({
  currentRole,
  isOwner,
  onSelect,
  disabled,
}: {
  currentRole: string;
  isOwner: boolean;
  onSelect: (role: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const roles = isOwner
    ? ["admin", "member", "guest"]
    : ["member", "guest"];

  if (currentRole === "owner") {
    return (
      <span className="flex items-center gap-1 rounded-[6px] bg-yellow-500/10 px-2 py-1 text-[12px] font-medium text-yellow-500">
        <Crown className="h-3 w-3" />
        Owner
      </span>
    );
  }

  const RoleIcon = getRoleIcon(currentRole);

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-1.5 rounded-[6px] border border-[#1a1a1a] px-2.5 py-1 text-[12px] font-medium capitalize transition-colors hover:border-[#2a2a2a] disabled:opacity-50 ${getRoleColor(currentRole)}`}
      >
        <RoleIcon className="h-3 w-3" />
        {currentRole}
        <ChevronDown className="ml-0.5 h-3 w-3 text-[#555]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[140px] rounded-[8px] border border-[#1a1a1a] bg-[#111] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {roles.map((role) => {
            const Icon = getRoleIcon(role);
            return (
              <button
                key={role}
                onClick={() => {
                  onSelect(role);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] capitalize transition-colors hover:bg-[#1a1a1a] ${
                  role === currentRole ? "text-white" : "text-[#888]"
                }`}
              >
                <Icon className="h-3 w-3" />
                {role}
                {role === currentRole && (
                  <Check className="ml-auto h-3 w-3 text-[#276ef1]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ──

export function BoxAdminClient({
  user,
  boxes,
  box,
  channels,
  members: initialMembers,
}: BoxAdminClientProps) {
  const isOwner = box.role === "owner";
  const [activeSection, setActiveSection] = useState<Section>("permissions");
  const [members, setMembers] = useState(initialMembers);

  // Logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);

  // Stats state
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Settings state
  const [boxName, setBoxName] = useState(box.name);
  const [boxDescription, setBoxDescription] = useState(box.description || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Role update state
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Filter/search state for permissions
  const [memberSearch, setMemberSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const fetchLogs = useCallback(
    async (page: number) => {
      setLogsLoading(true);
      try {
        const res = await fetch(
          `/api/boxes/${box.id}/admin?section=logs&page=${page}`
        );
        const data = await res.json();
        if (page === 0) {
          setLogs(data.logs);
        } else {
          setLogs((prev) => [...prev, ...data.logs]);
        }
        setHasMoreLogs(data.hasMore);
        setLogsTotal(data.total);
        setLogsPage(page);
      } finally {
        setLogsLoading(false);
      }
    },
    [box.id]
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/boxes/${box.id}/admin?section=stats`);
      const data = await res.json();
      setStats(data);
    } finally {
      setStatsLoading(false);
    }
  }, [box.id]);

  useEffect(() => {
    if (activeSection === "logs" && logs.length === 0) {
      fetchLogs(0);
    }
    if (activeSection === "analytics" && !stats) {
      fetchStats();
    }
  }, [activeSection, logs.length, stats, fetchLogs, fetchStats]);

  async function handleRoleChange(memberId: string, newRole: string) {
    setUpdatingRole(memberId);
    try {
      const res = await fetch(`/api/boxes/${box.id}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_role", memberId, newRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update role");
      }
    } finally {
      setUpdatingRole(null);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch(`/api/boxes/${box.id}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          settings: { name: boxName, description: boxDescription },
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } finally {
      setSaving(false);
    }
  }

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !memberSearch ||
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.username.toLowerCase().includes(memberSearch.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Role counts
  const roleCounts = members.reduce(
    (acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sections: { id: Section; label: string; icon: typeof Shield }[] = [
    { id: "permissions", label: "Permissions", icon: Shield },
    { id: "logs", label: "Audit Logs", icon: ScrollText },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <AppShell user={user} boxes={boxes} activeBoxId={box.short_id}>
      <TopBar
        title="Admin Dashboard"
        actions={
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-[12px] text-[#22c55e]">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <Link
              href={`/box/${box.short_id}/settings`}
              className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
            <Link
              href={`/box/${box.short_id}`}
              className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Nav */}
        <nav className="w-[220px] shrink-0 overflow-auto border-r border-[#1a1a1a] px-3 py-4">
          <div className="mb-3 px-3">
            <div className="flex items-center gap-2">
              {box.icon_url ? (
                <img
                  src={box.icon_url}
                  alt=""
                  className="h-6 w-6 rounded-[6px]"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white text-[10px] font-bold text-black">
                  {box.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate text-[13px] font-semibold text-white">
                {box.name}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#555]">
              <Shield className="h-3 w-3" />
              Admin Panel
            </div>
          </div>

          <div className="my-2 border-t border-[#1a1a1a]" />

          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] transition-colors ${
                activeSection === s.id
                  ? "bg-[#1a1a1a] font-medium text-white"
                  : "text-[#666] hover:bg-[#111] hover:text-white"
              }`}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[720px] px-8 py-6">
            {/* ── PERMISSIONS ── */}
            {activeSection === "permissions" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">
                  Permissions
                </h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Manage member roles and access levels.
                </p>

                {/* Role summary */}
                <div className="mb-5 flex flex-wrap gap-2">
                  {[
                    { role: "all", label: "All", count: members.length },
                    { role: "owner", label: "Owners", count: roleCounts.owner || 0 },
                    { role: "admin", label: "Admins", count: roleCounts.admin || 0 },
                    { role: "member", label: "Members", count: roleCounts.member || 0 },
                    { role: "guest", label: "Guests", count: roleCounts.guest || 0 },
                  ].map((f) => (
                    <button
                      key={f.role}
                      onClick={() => setRoleFilter(f.role)}
                      className={`flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        roleFilter === f.role
                          ? "border-[#276ef1]/30 bg-[#276ef1]/10 text-[#276ef1]"
                          : "border-[#1a1a1a] text-[#666] hover:border-[#2a2a2a] hover:text-white"
                      }`}
                    >
                      {f.label}
                      <span
                        className={`rounded-[4px] px-1.5 py-0.5 text-[10px] ${
                          roleFilter === f.role
                            ? "bg-[#276ef1]/20 text-[#276ef1]"
                            : "bg-[#1a1a1a] text-[#555]"
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="mb-4">
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="h-9 w-full rounded-[8px] border border-[#1a1a1a] bg-[#0a0a0a] px-3 text-[13px] text-white placeholder:text-[#444] focus:border-[#276ef1] focus:outline-none"
                  />
                </div>

                {/* Member list */}
                <div className="space-y-1.5">
                  {filteredMembers.length === 0 ? (
                    <div className="rounded-[12px] border border-dashed border-[#222] py-8 text-center">
                      <Users className="mx-auto mb-2 h-6 w-6 text-[#444]" />
                      <p className="text-[13px] text-[#666]">
                        No members match your filters
                      </p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const initials = member.full_name
                        ? member.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : member.email[0].toUpperCase();

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3 transition-colors hover:border-[#2a2a2a]"
                        >
                          <div className="relative">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt=""
                                className="h-9 w-9 rounded-full"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
                                {initials}
                              </div>
                            )}
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0f0f0f] ${
                                member.status === "online"
                                  ? "bg-green-500"
                                  : member.status === "away"
                                    ? "bg-yellow-500"
                                    : member.status === "dnd"
                                      ? "bg-red-500"
                                      : "bg-[#555]"
                              }`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[14px] font-medium text-white">
                                {member.full_name || member.email}
                              </span>
                              {member.user_id === user.id && (
                                <span className="text-[11px] text-[#555]">
                                  (you)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[12px] text-[#555]">
                              <span>@{member.username}</span>
                              <span className="text-[#333]">·</span>
                              <span>{member.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right text-[11px] text-[#444]">
                              Joined{" "}
                              {new Date(member.joined_at).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric", year: "numeric" }
                              )}
                            </div>
                            <RolePicker
                              currentRole={member.role}
                              isOwner={isOwner}
                              onSelect={(role) =>
                                handleRoleChange(member.id, role)
                              }
                              disabled={
                                member.user_id === user.id ||
                                updatingRole === member.id
                              }
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Role descriptions */}
                <SectionDivider />
                <SectionHeader title="Role Descriptions" />
                <div className="mt-2 space-y-2">
                  {[
                    {
                      role: "Owner",
                      desc: "Full control. Can delete the box, manage billing, and promote/demote admins.",
                      color: "text-yellow-500",
                    },
                    {
                      role: "Admin",
                      desc: "Can manage channels, members, settings, and view audit logs.",
                      color: "text-[#276ef1]",
                    },
                    {
                      role: "Member",
                      desc: "Can send messages, create channels, and participate in all public channels.",
                      color: "text-[#888]",
                    },
                    {
                      role: "Guest",
                      desc: "Limited access. Can only see and post in channels they are invited to.",
                      color: "text-[#555]",
                    },
                  ].map((r) => (
                    <div
                      key={r.role}
                      className="flex items-start gap-3 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3"
                    >
                      <span
                        className={`mt-0.5 text-[13px] font-semibold ${r.color}`}
                      >
                        {r.role}
                      </span>
                      <span className="text-[13px] text-[#888]">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── AUDIT LOGS ── */}
            {activeSection === "logs" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">
                  Audit Logs
                </h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Track all admin actions in this box.
                  {logsTotal > 0 && (
                    <span className="ml-2 text-[#444]">
                      ({logsTotal} total events)
                    </span>
                  )}
                </p>

                {logsLoading && logs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#276ef1] border-t-transparent" />
                    <span className="text-[13px] text-[#555]">
                      Loading audit logs...
                    </span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="rounded-[12px] border border-dashed border-[#222] py-12 text-center">
                    <ScrollText className="mx-auto mb-3 h-8 w-8 text-[#333]" />
                    <p className="text-[14px] font-medium text-[#666]">
                      No audit logs yet
                    </p>
                    <p className="mt-1 text-[13px] text-[#444]">
                      Admin actions will be recorded here as they happen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a]">
                          <ArrowUpDown className="h-3.5 w-3.5 text-[#555]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px]">
                            <span className="font-medium text-white">
                              {log.profiles?.full_name ||
                                log.profiles?.email ||
                                "Unknown"}
                            </span>{" "}
                            <span className="text-[#888]">
                              {formatLogAction(log)}
                            </span>
                          </div>
                          {log.metadata &&
                            Object.keys(log.metadata).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {Object.entries(log.metadata).map(
                                  ([key, val]) => (
                                    <span
                                      key={key}
                                      className="rounded-[4px] bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] text-[#666]"
                                    >
                                      {key}: {String(val)}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                        <Tooltip label={new Date(log.created_at).toLocaleString()}>
                          <span className="shrink-0 text-[11px] text-[#444]">
                            {timeAgo(log.created_at)}
                          </span>
                        </Tooltip>
                      </div>
                    ))}

                    {hasMoreLogs && (
                      <button
                        onClick={() => fetchLogs(logsPage + 1)}
                        disabled={logsLoading}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#1a1a1a] py-2.5 text-[13px] text-[#666] transition-colors hover:border-[#2a2a2a] hover:text-white disabled:opacity-50"
                      >
                        {logsLoading ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          "Load more"
                        )}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── SETTINGS ── */}
            {activeSection === "settings" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">
                  Settings
                </h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Manage box identity and configuration.
                </p>

                {/* Box Identity Card */}
                <div className="mb-6 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                  <div className="flex items-center gap-4">
                    {box.icon_url ? (
                      <img
                        src={box.icon_url}
                        alt=""
                        className="h-14 w-14 rounded-xl"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-[18px] font-bold text-black">
                        {box.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold text-white">
                          {box.name}
                        </span>
                        <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#666]">
                          {box.plan}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#444]">
                        Created{" "}
                        {new Date(box.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <SectionHeader title="Box Identity" />
                <div className="py-3">
                  <div className="mb-1.5 text-[14px] text-white">Box name</div>
                  <input
                    value={boxName}
                    onChange={(e) => setBoxName(e.target.value)}
                    className="h-10 w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 text-[14px] text-white placeholder:text-[#444] focus:border-[#276ef1] focus:outline-none"
                  />
                </div>
                <div className="py-3">
                  <div className="mb-1.5 text-[14px] text-white">
                    Description
                  </div>
                  <textarea
                    value={boxDescription}
                    onChange={(e) => setBoxDescription(e.target.value)}
                    rows={3}
                    placeholder="What's this Box about?"
                    className="w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-2 text-[14px] text-white placeholder:text-[#444] focus:border-[#276ef1] focus:outline-none"
                  />
                </div>

                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="mt-2 h-9 rounded-[8px] bg-white px-5 text-[13px] font-semibold text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <SectionDivider />
                <SectionHeader title="Quick Info" />
                <div className="space-y-2 py-2">
                  {[
                    {
                      label: "Box ID",
                      value: box.short_id,
                    },
                    {
                      label: "Slug",
                      value: box.slug,
                    },
                    {
                      label: "Plan",
                      value: box.plan,
                    },
                    {
                      label: "Channels",
                      value: String(channels.length),
                    },
                    {
                      label: "Members",
                      value: String(members.length),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-[#555]">{item.label}</span>
                      <span className="capitalize text-white">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <SectionDivider />
                <div className="rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#555]" />
                    <div>
                      <p className="text-[13px] text-[#888]">
                        For advanced settings like billing, danger zone, and
                        plan management, visit the{" "}
                        <Link
                          href={`/box/${box.short_id}/settings`}
                          className="text-[#276ef1] hover:underline"
                        >
                          Box Settings
                        </Link>{" "}
                        page.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── ANALYTICS ── */}
            {activeSection === "analytics" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">
                  Analytics
                </h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Activity overview and trends for this box.
                </p>

                {statsLoading ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#276ef1] border-t-transparent" />
                    <span className="text-[13px] text-[#555]">
                      Loading analytics...
                    </span>
                  </div>
                ) : stats ? (
                  <>
                    {/* Stat cards */}
                    <div className="mb-6 grid grid-cols-3 gap-3">
                      <StatCard
                        label="Total Members"
                        value={stats.memberCount}
                      />
                      <StatCard
                        label="Active Channels"
                        value={stats.channelCount}
                      />
                      <StatCard
                        label="Total Messages"
                        value={stats.messageCount.toLocaleString()}
                      />
                    </div>

                    {/* Message activity chart */}
                    <SectionHeader title="Message Activity (Last 14 Days)" />
                    <div className="mt-2 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                      <MiniBarChart data={stats.dailyMessages} />
                    </div>

                    {/* Channel breakdown */}
                    <SectionHeader title="Most Active Channels" />
                    <div className="mt-2 space-y-1.5">
                      {stats.channelBreakdown.length === 0 ? (
                        <div className="rounded-[10px] border border-dashed border-[#222] py-6 text-center text-[13px] text-[#555]">
                          No channel activity in the last 14 days
                        </div>
                      ) : (
                        stats.channelBreakdown.map((ch, i) => {
                          const maxCount = stats.channelBreakdown[0]?.count ?? 1;
                          return (
                            <div
                              key={ch.name}
                              className="flex items-center gap-3 rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-2.5"
                            >
                              <span className="w-5 text-right text-[12px] font-medium text-[#444]">
                                {i + 1}
                              </span>
                              <Hash className="h-3.5 w-3.5 text-[#555]" />
                              <span className="min-w-[100px] text-[13px] font-medium text-white">
                                {ch.name}
                              </span>
                              <div className="flex-1">
                                <div className="h-2 rounded-full bg-[#1a1a1a]">
                                  <div
                                    className="h-full rounded-full bg-[#276ef1]"
                                    style={{
                                      width: `${(ch.count / maxCount) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="min-w-[60px] text-right text-[12px] text-[#666]">
                                {ch.count} msgs
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Member growth */}
                    <SectionHeader title="Member Growth" />
                    <div className="mt-2 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                      {stats.memberGrowth.length === 0 ? (
                        <div className="flex h-[80px] items-center justify-center text-[13px] text-[#555]">
                          No member data
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {(() => {
                            // Group by month
                            const byMonth: Record<string, number> = {};
                            for (const m of stats.memberGrowth) {
                              const month = m.joined_at
                                .split("T")[0]
                                .slice(0, 7);
                              byMonth[month] = (byMonth[month] || 0) + 1;
                            }
                            // Show cumulative
                            let cumulative = 0;
                            return Object.entries(byMonth).map(
                              ([month, count]) => {
                                cumulative += count;
                                return (
                                  <div
                                    key={month}
                                    className="flex items-center justify-between text-[13px]"
                                  >
                                    <span className="text-[#888]">
                                      {new Date(month + "-01").toLocaleDateString(
                                        "en-US",
                                        { month: "short", year: "numeric" }
                                      )}
                                    </span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[#555]">
                                        +{count} joined
                                      </span>
                                      <span className="font-medium text-white">
                                        {cumulative} total
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-[12px] border border-dashed border-[#222] py-12 text-center">
                    <BarChart3 className="mx-auto mb-3 h-8 w-8 text-[#333]" />
                    <p className="text-[14px] font-medium text-[#666]">
                      Failed to load analytics
                    </p>
                    <button
                      onClick={fetchStats}
                      className="mt-3 text-[13px] text-[#276ef1] hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Bottom spacer */}
            <div className="mt-12 border-t border-[#1a1a1a] pt-6 pb-10">
              <div className="flex items-center justify-between text-[12px] text-[#333]">
                <span>Box ID: {box.short_id}</span>
                <Link
                  href={`/box/${box.short_id}`}
                  className="transition-colors hover:text-[#555]"
                >
                  Back to Box
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
