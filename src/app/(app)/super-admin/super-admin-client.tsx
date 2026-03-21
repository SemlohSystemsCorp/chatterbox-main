"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon as ArrowLeft,
  ShieldIcon as Shield,
  GraphIcon as BarChart3,
  PeopleIcon as Users,
  HashIcon as Hash,
  CommentDiscussionIcon as MessageSquare,
  NoteIcon as FileText,
  PlusIcon as Plus,
  SearchIcon as Search,
  TrashIcon as Trash,
  EyeIcon as Eye,
  EyeClosedIcon as EyeClosed,
  StarIcon as Star,
  StarFillIcon as StarFill,
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
  CheckIcon as Check,
  PencilIcon as Pencil,
  XIcon as X,
  NoEntryIcon as Ban,
  SignOutIcon as SignOut,
  KeyIcon as Key,
  MailIcon as Mail,
} from "@primer/octicons-react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

// ── Types ──

interface OverviewStats {
  totalUsers: number;
  totalBoxes: number;
  totalMessages: number;
  totalCalls: number;
  activeUsersToday: number;
  newSignupsThisWeek: number;
  dailyMessages: Record<string, number>;
  dailySignups: Record<string, number>;
}

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  username: string;
  status: string;
  created_at: string;
  boxCount: number;
  banned: boolean;
  ban_reason: string | null;
  banned_until: string | null;
}

interface BoxRecord {
  id: string;
  short_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  owner_id: string;
  plan: string;
  created_at: string;
  memberCount: number;
  channelCount: number;
  ownerName: string;
  ownerEmail: string;
}

interface FeedbackRecord {
  id: string;
  user_id: string;
  type: string;
  message: string;
  email: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface SuperAdminClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  boxes: {
    id: string;
    short_id: string;
    name: string;
    slug: string;
    role: string;
    icon_url?: string | null;
  }[];
  initialCounts: {
    totalUsers: number;
    totalBoxes: number;
  };
}

interface BlogPostRecord {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_role: string;
  read_time: string;
  published: boolean;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

type Section = "overview" | "users" | "boxes" | "feedback" | "blog";

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">{label}</div>
      <div className="mt-1 text-[24px] font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-[#555]">{sub}</div>}
    </div>
  );
}

function MiniBarChart({ data, maxBars = 14, tooltipSuffix = "messages" }: { data: Record<string, number>; maxBars?: number; tooltipSuffix?: string }) {
  const entries = Object.entries(data).slice(-maxBars);
  if (entries.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center text-[13px] text-[#555]">
        No data yet
      </div>
    );
  }
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex h-[120px] items-end gap-1">
      {entries.map(([day, count]) => (
        <Tooltip key={day} label={`${day}: ${count} ${tooltipSuffix}`}>
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusColor(status: string) {
  switch (status) {
    case "online": return "bg-green-500";
    case "away": return "bg-yellow-500";
    case "dnd": return "bg-red-500";
    default: return "bg-[#555]";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "online": return "Online";
    case "away": return "Away";
    case "dnd": return "Do Not Disturb";
    default: return "Offline";
  }
}

function getPlanBadgeVariant(plan: string): "default" | "info" | "warning" {
  switch (plan) {
    case "pro": return "info";
    case "enterprise": return "warning";
    default: return "default";
  }
}

// ── Inline edit field ──

function EditableField({
  label,
  value,
  onSave,
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (val: string) => Promise<boolean>;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (editValue.trim() === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    const ok = await onSave(editValue.trim());
    setSaving(false);
    if (ok) {
      setEditing(false);
    } else {
      setError("Failed to save");
    }
  }

  if (!editing) {
    return (
      <div className="group flex items-center gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-[#444]">{label}</div>
          <div className="text-[13px] text-white">{value || <span className="text-[#555]">Not set</span>}</div>
        </div>
        <button
          onClick={() => {
            setEditValue(value);
            setEditing(true);
            setError("");
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#444] opacity-0 transition-all hover:bg-[#1a1a1a] hover:text-white group-hover:opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] text-[#444]">{label}</div>
      <div className="mt-1 flex items-center gap-1.5">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-7 flex-1 rounded-[6px] border border-[#2a2a2a] bg-[#1a1a1a] px-2 text-[13px] text-white outline-none focus:border-[#276ef1]"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#276ef1] text-white transition-colors hover:bg-[#1e5fd1] disabled:opacity-50"
        >
          {saving ? <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" /> : <Check className="h-3 w-3" />}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {error && <div className="mt-1 text-[11px] text-[#de1135]">{error}</div>}
    </div>
  );
}

// ── Plan picker ──

function PlanPicker({ currentPlan, onSelect, disabled }: { currentPlan: string; onSelect: (plan: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const plans = ["free", "pro", "enterprise"];

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen(!open);
        }}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-[6px] border border-[#1a1a1a] px-2.5 py-1 text-[12px] font-medium capitalize transition-colors hover:border-[#2a2a2a] disabled:opacity-50 text-[#888]"
      >
        {currentPlan}
        <ChevronDown className="ml-0.5 h-3 w-3 text-[#555]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[140px] rounded-[8px] border border-[#1a1a1a] bg-[#111] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {plans.map((plan) => (
            <button
              key={plan}
              onClick={(e) => {
                e.stopPropagation();
                if (plan !== currentPlan) onSelect(plan);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] capitalize transition-colors hover:bg-[#1a1a1a] ${
                plan === currentPlan ? "text-white" : "text-[#888]"
              }`}
            >
              {plan}
              {plan === currentPlan && <Check className="ml-auto h-3 w-3 text-[#276ef1]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── User Card ──

function UserCard({
  user: u,
  isExpanded,
  onToggle,
  onEditUser,
  onBanUser,
  onUnbanUser,
  onResetPassword,
  onForceSignout,
  onDeleteUser,
}: {
  user: UserRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onEditUser: (userId: string, fields: { full_name?: string; username?: string; email?: string }) => Promise<boolean>;
  onBanUser: (userId: string, userName: string, reason: string, duration: string) => void;
  onUnbanUser: (userId: string, userName: string) => void;
  onResetPassword: (userId: string, userName: string, newPassword: string) => void;
  onForceSignout: (userId: string, userName: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
}) {
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("24h");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);

  return (
    <div
      className={`rounded-[12px] border transition-colors ${
        isExpanded ? "border-[#276ef1]/30 bg-[#0f0f0f]" : "border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#2a2a2a]"
      }`}
    >
      {/* Clickable row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        {/* Avatar */}
        {u.avatar_url ? (
          <img src={u.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#276ef1]/20 text-[12px] font-bold text-[#276ef1]">
            {(u.full_name || u.email).charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-medium text-white">{u.full_name || "Unnamed"}</span>
            <div className={`h-2 w-2 shrink-0 rounded-full ${getStatusColor(u.status)}`} />
            {u.banned && <Badge variant="error">Banned</Badge>}
          </div>
          <div className="flex items-center gap-3 text-[12px] text-[#555]">
            <span>@{u.username}</span>
            <span>{u.email}</span>
            <span>{u.boxCount} {u.boxCount === 1 ? "box" : "boxes"}</span>
            <span>{timeAgo(u.created_at)}</span>
          </div>
        </div>

        {/* Expand indicator */}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#555]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#333]" />
        )}
      </button>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="border-t border-[#1a1a1a] px-4 py-4">
          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Full Name"
              value={u.full_name || ""}
              placeholder="Full name"
              onSave={async (val) => onEditUser(u.id, { full_name: val })}
            />
            <EditableField
              label="Username"
              value={u.username || ""}
              placeholder="Username"
              onSave={async (val) => onEditUser(u.id, { username: val })}
            />
            <div className="group flex items-center gap-2">
              <div className="min-w-0">
                <div className="text-[11px] text-[#444]">Email</div>
                <div className="flex items-center gap-1.5 text-[13px] text-white">
                  <Mail className="h-3 w-3 text-[#444]" />
                  {u.email}
                </div>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#444]">Status</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(u.status)}`} />
                <span className="text-[13px] text-white">{getStatusLabel(u.status)}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#444]">Boxes</div>
              <div className="text-[13px] text-white">{u.boxCount}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#444]">Joined</div>
              <div className="text-[13px] text-white">
                {new Date(u.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-[11px] text-[#444]">User ID</div>
              <div className="font-mono text-[12px] text-[#555]">{u.id}</div>
            </div>
          </div>

          {/* Ban section */}
          <div className="mt-4 rounded-[8px] border border-[#1a1a1a] bg-[#0a0a0a] p-3">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444]">
              <Ban className="h-3.5 w-3.5" />
              Ban Management
            </div>

            {u.banned ? (
              <div className="mt-3">
                <div className="rounded-[6px] bg-red-500/10 px-3 py-2">
                  <div className="text-[13px] font-medium text-red-400">User is currently banned</div>
                  {u.ban_reason && (
                    <div className="mt-1 text-[12px] text-[#888]">Reason: {u.ban_reason}</div>
                  )}
                  {u.banned_until && (
                    <div className="mt-0.5 text-[12px] text-[#888]">
                      Until: {new Date(u.banned_until).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => onUnbanUser(u.id, u.full_name)}
                >
                  Unban User
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ban reason (optional)"
                  className="h-8 w-full rounded-[6px] border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 text-[13px] text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="h-8 rounded-[6px] border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 text-[13px] text-white outline-none focus:border-[#276ef1]"
                  >
                    <option value="1h">1 hour</option>
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="permanent">Permanent</option>
                  </select>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      onBanUser(u.id, u.full_name, banReason, banDuration);
                      setBanReason("");
                    }}
                  >
                    <Ban className="mr-1.5 h-3 w-3" />
                    Ban User
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#1a1a1a] pt-3">
            {/* Reset Password */}
            {showPasswordField ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="h-8 w-[200px] rounded-[6px] border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 text-[13px] text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPassword.length >= 6) {
                      onResetPassword(u.id, u.full_name, newPassword);
                      setNewPassword("");
                      setShowPasswordField(false);
                    }
                    if (e.key === "Escape") {
                      setShowPasswordField(false);
                      setNewPassword("");
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  disabled={newPassword.length < 6}
                  onClick={() => {
                    onResetPassword(u.id, u.full_name, newPassword);
                    setNewPassword("");
                    setShowPasswordField(false);
                  }}
                >
                  <Key className="mr-1.5 h-3 w-3" />
                  Set
                </Button>
                <button
                  onClick={() => {
                    setShowPasswordField(false);
                    setNewPassword("");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#555] hover:bg-[#1a1a1a] hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordField(true)}
              >
                <Key className="mr-1.5 h-3 w-3" />
                Reset Password
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onForceSignout(u.id, u.full_name)}
            >
              <SignOut className="mr-1.5 h-3 w-3" />
              Force Sign Out
            </Button>

            <div className="flex-1" />

            <Button
              variant="danger"
              size="sm"
              onClick={() => onDeleteUser(u.id, u.full_name)}
            >
              <Trash className="mr-1.5 h-3 w-3" />
              Delete User
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ──

export function SuperAdminClient({ user, boxes, initialCounts }: SuperAdminClientProps) {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  // Overview state
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Boxes state
  const [boxList, setBoxList] = useState<BoxRecord[]>([]);
  const [boxesTotal, setBoxesTotal] = useState(0);
  const [boxesPage, setBoxesPage] = useState(0);
  const [hasMoreBoxes, setHasMoreBoxes] = useState(false);
  const [boxesLoading, setBoxesLoading] = useState(false);
  const [boxSearch, setBoxSearch] = useState("");
  const [boxSearchInput, setBoxSearchInput] = useState("");
  const [expandedBox, setExpandedBox] = useState<string | null>(null);

  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackPage, setFeedbackPage] = useState(0);
  const [hasMoreFeedback, setHasMoreFeedback] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  // Blog state
  const [blogPosts, setBlogPosts] = useState<BlogPostRecord[]>([]);
  const [blogTotal, setBlogTotal] = useState(0);
  const [blogPage, setBlogPage] = useState(0);
  const [hasMoreBlog, setHasMoreBlog] = useState(false);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogEditor, setBlogEditor] = useState<Partial<BlogPostRecord> | null>(null);
  const [blogEditorLoading, setBlogEditorLoading] = useState(false);
  const [blogEditorError, setBlogEditorError] = useState("");

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, title: "", description: "", onConfirm: async () => {} });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Data fetching ──

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await fetch("/api/super-admin?section=overview");
      const data = await res.json();
      setOverview(data);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (page: number, search: string) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ section: "users", page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/super-admin?${params}`);
      const data = await res.json();
      if (page === 0) {
        setUsers(data.users);
      } else {
        setUsers((prev) => [...prev, ...data.users]);
      }
      setUsersTotal(data.total);
      setHasMoreUsers(data.hasMore);
      setUsersPage(page);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchBoxes = useCallback(async (page: number, search: string) => {
    setBoxesLoading(true);
    try {
      const params = new URLSearchParams({ section: "boxes", page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/super-admin?${params}`);
      const data = await res.json();
      if (page === 0) {
        setBoxList(data.boxes);
      } else {
        setBoxList((prev) => [...prev, ...data.boxes]);
      }
      setBoxesTotal(data.total);
      setHasMoreBoxes(data.hasMore);
      setBoxesPage(page);
    } finally {
      setBoxesLoading(false);
    }
  }, []);

  const fetchFeedback = useCallback(async (page: number) => {
    setFeedbackLoading(true);
    try {
      const res = await fetch(`/api/super-admin?section=feedback&page=${page}`);
      const data = await res.json();
      if (page === 0) {
        setFeedback(data.feedback);
      } else {
        setFeedback((prev) => [...prev, ...data.feedback]);
      }
      setFeedbackTotal(data.total);
      setHasMoreFeedback(data.hasMore);
      setFeedbackPage(page);
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const fetchBlogPosts = useCallback(async (page: number) => {
    setBlogLoading(true);
    try {
      const res = await fetch(`/api/super-admin?section=blog&page=${page}`);
      const data = await res.json();
      if (page === 0) {
        setBlogPosts(data.posts);
      } else {
        setBlogPosts((prev) => [...prev, ...data.posts]);
      }
      setBlogTotal(data.total);
      setHasMoreBlog(data.hasMore);
      setBlogPage(page);
    } finally {
      setBlogLoading(false);
    }
  }, []);

  // Lazy load section data
  useEffect(() => {
    if (activeSection === "overview" && !overview) {
      fetchOverview();
    }
    if (activeSection === "users" && users.length === 0 && !usersLoading) {
      fetchUsers(0, userSearch);
    }
    if (activeSection === "boxes" && boxList.length === 0 && !boxesLoading) {
      fetchBoxes(0, boxSearch);
    }
    if (activeSection === "feedback" && feedback.length === 0 && !feedbackLoading) {
      fetchFeedback(0);
    }
    if (activeSection === "blog" && blogPosts.length === 0 && !blogLoading) {
      fetchBlogPosts(0);
    }
  }, [activeSection, overview, users.length, boxList.length, feedback.length, blogPosts.length, userSearch, boxSearch, usersLoading, boxesLoading, feedbackLoading, blogLoading, fetchOverview, fetchUsers, fetchBoxes, fetchFeedback, fetchBlogPosts]);

  // ── Actions ──

  function showConfirm(title: string, description: string, onConfirm: () => Promise<void>) {
    setConfirmModal({ open: true, title, description, onConfirm });
  }

  async function handleConfirm() {
    setConfirmLoading(true);
    try {
      await confirmModal.onConfirm();
    } finally {
      setConfirmLoading(false);
      setConfirmModal((prev) => ({ ...prev, open: false }));
    }
  }

  async function deleteUser(userId: string, userName: string) {
    showConfirm(
      "Delete User",
      `Are you sure you want to permanently delete "${userName}"? This will remove their account and all associated data. This action cannot be undone.`,
      async () => {
        const res = await fetch("/api/super-admin", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_user", userId }),
        });
        if (res.ok) {
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          setUsersTotal((prev) => prev - 1);
          setExpandedUser(null);
        }
      },
    );
  }

  async function deleteBox(boxId: string, boxName: string) {
    showConfirm(
      "Delete Box",
      `Are you sure you want to permanently delete "${boxName}"? This will remove all channels, messages, and members. This action cannot be undone.`,
      async () => {
        const res = await fetch("/api/super-admin", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_box", boxId }),
        });
        if (res.ok) {
          setBoxList((prev) => prev.filter((b) => b.id !== boxId));
          setBoxesTotal((prev) => prev - 1);
          setExpandedBox(null);
        }
      },
    );
  }

  async function deleteFeedback(feedbackId: string) {
    showConfirm(
      "Dismiss Feedback",
      "Are you sure you want to dismiss this feedback entry? This action cannot be undone.",
      async () => {
        const res = await fetch("/api/super-admin", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_feedback", feedbackId }),
        });
        if (res.ok) {
          setFeedback((prev) => prev.filter((f) => f.id !== feedbackId));
          setFeedbackTotal((prev) => prev - 1);
          setExpandedFeedback(null);
        }
      },
    );
  }

  async function changePlan(boxId: string, plan: string) {
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_plan", boxId, plan }),
    });
    if (res.ok) {
      setBoxList((prev) => prev.map((b) => (b.id === boxId ? { ...b, plan } : b)));
    }
  }

  async function editUser(userId: string, fields: { full_name?: string; username?: string; email?: string; status?: string }): Promise<boolean> {
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit_user", userId, ...fields }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...fields } : u)),
      );
      return true;
    }
    return false;
  }

  async function banUser(userId: string, userName: string, reason: string, duration: string) {
    showConfirm(
      "Ban User",
      `Are you sure you want to ban "${userName}"? They will be unable to log in${duration === "permanent" ? " permanently" : ` for ${duration}`}.`,
      async () => {
        const res = await fetch("/api/super-admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ban_user", userId, reason, duration }),
        });
        if (res.ok) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, banned: true, ban_reason: reason, status: "offline" } : u)),
          );
        }
      },
    );
  }

  async function unbanUser(userId: string, userName: string) {
    showConfirm(
      "Unban User",
      `Are you sure you want to unban "${userName}"? They will be able to log in again.`,
      async () => {
        const res = await fetch("/api/super-admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unban_user", userId }),
        });
        if (res.ok) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, banned: false, ban_reason: null, banned_until: null } : u)),
          );
        }
      },
    );
  }

  async function resetPassword(userId: string, userName: string, newPassword: string) {
    showConfirm(
      "Reset Password",
      `Are you sure you want to reset the password for "${userName}"? They will need to use the new password to log in.`,
      async () => {
        const res = await fetch("/api/super-admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset_password", userId, newPassword }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to reset password");
        }
      },
    );
  }

  async function forceSignout(userId: string, userName: string) {
    showConfirm(
      "Force Sign Out",
      `Are you sure you want to force sign out "${userName}"? All their active sessions will be invalidated.`,
      async () => {
        const res = await fetch("/api/super-admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "force_signout", userId }),
        });
        if (res.ok) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, status: "offline" } : u)),
          );
        }
      },
    );
  }

  async function saveBlogPost() {
    if (!blogEditor) return;
    setBlogEditorLoading(true);
    setBlogEditorError("");

    try {
      const isNew = !blogEditor.id;
      const res = await fetch("/api/super-admin", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isNew ? "create_blog_post" : "edit_blog_post",
          ...(isNew ? {} : { postId: blogEditor.id }),
          title: blogEditor.title,
          slug: blogEditor.slug,
          category: blogEditor.category,
          excerpt: blogEditor.excerpt,
          content: blogEditor.content,
          author_name: blogEditor.author_name,
          author_role: blogEditor.author_role,
          read_time: blogEditor.read_time,
          published: blogEditor.published,
          featured: blogEditor.featured,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setBlogEditorError(err.error || "Failed to save");
        return;
      }

      setBlogEditor(null);
      setBlogPosts([]);
      fetchBlogPosts(0);
    } finally {
      setBlogEditorLoading(false);
    }
  }

  async function deleteBlogPost(postId: string, title: string) {
    showConfirm(
      "Delete Blog Post",
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      async () => {
        const res = await fetch("/api/super-admin", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_blog_post", postId }),
        });
        if (res.ok) {
          setBlogPosts((prev) => prev.filter((p) => p.id !== postId));
          setBlogTotal((prev) => prev - 1);
        }
      },
    );
  }

  async function loadBlogPostForEdit(postId: string) {
    setBlogEditorLoading(true);
    setBlogEditorError("");
    try {
      const res = await fetch(`/api/super-admin?section=blog_post&postId=${postId}`);
      const data = await res.json();
      if (data.post) {
        setBlogEditor(data.post);
      }
    } finally {
      setBlogEditorLoading(false);
    }
  }

  async function toggleBlogPublished(postId: string, published: boolean) {
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit_blog_post", postId, published }),
    });
    if (res.ok) {
      setBlogPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, published, published_at: published ? (p.published_at || new Date().toISOString()) : p.published_at } : p)),
      );
    }
  }

  async function toggleBlogFeatured(postId: string, featured: boolean) {
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit_blog_post", postId, featured }),
    });
    if (res.ok) {
      setBlogPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, featured } : p)),
      );
    }
  }

  async function editBox(boxId: string, fields: { name?: string; description?: string }): Promise<boolean> {
    const res = await fetch("/api/super-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit_box", boxId, ...fields }),
    });
    if (res.ok) {
      setBoxList((prev) =>
        prev.map((b) => (b.id === boxId ? { ...b, ...fields } : b)),
      );
      return true;
    }
    return false;
  }

  // ── Search handlers ──

  function handleUserSearch(e: React.FormEvent) {
    e.preventDefault();
    setUserSearch(userSearchInput);
    setUsers([]);
    setExpandedUser(null);
    fetchUsers(0, userSearchInput);
  }

  function handleBoxSearch(e: React.FormEvent) {
    e.preventDefault();
    setBoxSearch(boxSearchInput);
    setBoxList([]);
    setExpandedBox(null);
    fetchBoxes(0, boxSearchInput);
  }

  // ── Navigation ──

  const sections: { id: Section; label: string; icon: typeof Shield }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "boxes", label: "Boxes", icon: Hash },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "blog", label: "Blog", icon: FileText },
  ];

  return (
    <AppShell user={user} boxes={boxes}>
      <TopBar
        title="Super Admin"
        actions={
          <Link
            href="/dashboard"
            className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Section Nav */}
        <nav className="w-[220px] shrink-0 overflow-auto border-r border-[#1a1a1a] px-3 py-4">
          <div className="mb-3 px-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-red-500/10">
                <Shield className="h-3.5 w-3.5 text-red-400" />
              </div>
              <span className="text-[14px] font-semibold text-white">Super Admin</span>
            </div>
            <p className="mt-1 text-[11px] text-[#555]">
              Platform management
            </p>
          </div>

          <div className="space-y-0.5">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-[8px] px-3 py-[7px] text-[13px] transition-colors ${
                    isActive
                      ? "bg-[#1a1a1a] text-white"
                      : "text-[#666] hover:bg-[#111] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[720px] px-8 py-6">

            {/* ── Overview ── */}
            {activeSection === "overview" && (
              <>
                <h2 className="text-[20px] font-bold text-white">Overview</h2>
                <p className="mt-1 text-[13px] text-[#555]">Platform-wide statistics</p>
                <SectionDivider />

                {overviewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : overview ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard label="Total Users" value={overview.totalUsers} />
                      <StatCard label="Total Boxes" value={overview.totalBoxes} />
                      <StatCard label="Total Messages" value={overview.totalMessages.toLocaleString()} />
                      <StatCard label="Total Calls" value={overview.totalCalls} />
                      <StatCard label="Active Today" value={overview.activeUsersToday} />
                      <StatCard label="New Signups (7d)" value={overview.newSignupsThisWeek} />
                    </div>

                    <SectionHeader title="Messages (Last 14 Days)" />
                    <div className="mt-2 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4">
                      <MiniBarChart data={overview.dailyMessages} />
                    </div>

                    <SectionHeader title="Signups (Last 14 Days)" />
                    <div className="mt-2 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4">
                      <MiniBarChart data={overview.dailySignups} tooltipSuffix="signups" />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Total Users" value={initialCounts.totalUsers} />
                    <StatCard label="Total Boxes" value={initialCounts.totalBoxes} />
                  </div>
                )}
              </>
            )}

            {/* ── Users ── */}
            {activeSection === "users" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-bold text-white">Users</h2>
                    <p className="mt-1 text-[13px] text-[#555]">
                      {usersTotal > 0 ? `${usersTotal} total users` : "All platform users"}
                    </p>
                  </div>
                </div>
                <SectionDivider />

                <form onSubmit={handleUserSearch} className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555]" />
                    <input
                      type="text"
                      value={userSearchInput}
                      onChange={(e) => setUserSearchInput(e.target.value)}
                      placeholder="Search by name, email, or username..."
                      className="h-9 w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] pl-9 pr-3 text-[13px] text-white placeholder-[#555] outline-none transition-colors focus:border-[#276ef1]"
                    />
                  </div>
                </form>

                {usersLoading && users.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {users.map((u) => {
                      const isExpanded = expandedUser === u.id;
                      return (
                        <UserCard
                          key={u.id}
                          user={u}
                          isExpanded={isExpanded}
                          onToggle={() => setExpandedUser(isExpanded ? null : u.id)}
                          onEditUser={editUser}
                          onBanUser={banUser}
                          onUnbanUser={unbanUser}
                          onResetPassword={resetPassword}
                          onForceSignout={forceSignout}
                          onDeleteUser={deleteUser}
                        />
                      );
                    })}

                    {users.length === 0 && !usersLoading && (
                      <div className="py-12 text-center text-[13px] text-[#555]">
                        {userSearch ? "No users match your search" : "No users found"}
                      </div>
                    )}

                    {hasMoreUsers && (
                      <button
                        onClick={() => fetchUsers(usersPage + 1, userSearch)}
                        disabled={usersLoading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#1a1a1a] py-2 text-[13px] text-[#666] transition-colors hover:border-[#2a2a2a] hover:text-white disabled:opacity-50"
                      >
                        {usersLoading ? <Spinner size="xs" /> : "Load more"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Boxes ── */}
            {activeSection === "boxes" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-bold text-white">Boxes</h2>
                    <p className="mt-1 text-[13px] text-[#555]">
                      {boxesTotal > 0 ? `${boxesTotal} total workspaces` : "All workspaces"}
                    </p>
                  </div>
                </div>
                <SectionDivider />

                <form onSubmit={handleBoxSearch} className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555]" />
                    <input
                      type="text"
                      value={boxSearchInput}
                      onChange={(e) => setBoxSearchInput(e.target.value)}
                      placeholder="Search by name..."
                      className="h-9 w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] pl-9 pr-3 text-[13px] text-white placeholder-[#555] outline-none transition-colors focus:border-[#276ef1]"
                    />
                  </div>
                </form>

                {boxesLoading && boxList.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {boxList.map((b) => {
                      const isExpanded = expandedBox === b.id;
                      const initials = b.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div
                          key={b.id}
                          className={`rounded-[12px] border transition-colors ${
                            isExpanded ? "border-[#276ef1]/30 bg-[#0f0f0f]" : "border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#2a2a2a]"
                          }`}
                        >
                          {/* Clickable row */}
                          <button
                            onClick={() => setExpandedBox(isExpanded ? null : b.id)}
                            className="flex w-full items-center gap-3 p-3 text-left"
                          >
                            {/* Icon */}
                            {b.icon_url ? (
                              <img src={b.icon_url} alt="" className="h-9 w-9 shrink-0 rounded-[8px]" />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-[11px] font-bold text-black">
                                {initials}
                              </div>
                            )}

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-[14px] font-medium text-white">{b.name}</span>
                                <Badge variant={getPlanBadgeVariant(b.plan)}>
                                  {b.plan}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-[12px] text-[#555]">
                                <span>Owner: {b.ownerName}</span>
                                <span>{b.memberCount} members</span>
                                <span>{b.channelCount} channels</span>
                                <span>{timeAgo(b.created_at)}</span>
                              </div>
                            </div>

                            {/* Expand indicator */}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 shrink-0 text-[#555]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 shrink-0 text-[#333]" />
                            )}
                          </button>

                          {/* Expanded detail panel */}
                          {isExpanded && (
                            <div className="border-t border-[#1a1a1a] px-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <EditableField
                                  label="Name"
                                  value={b.name}
                                  placeholder="Box name"
                                  onSave={async (val) => editBox(b.id, { name: val })}
                                />
                                <EditableField
                                  label="Description"
                                  value={b.description || ""}
                                  placeholder="Box description"
                                  onSave={async (val) => editBox(b.id, { description: val })}
                                />
                                <div>
                                  <div className="text-[11px] text-[#444]">Plan</div>
                                  <div className="mt-1">
                                    <PlanPicker
                                      currentPlan={b.plan}
                                      onSelect={(plan) => changePlan(b.id, plan)}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-[#444]">Owner</div>
                                  <div className="text-[13px] text-white">{b.ownerName}</div>
                                  <div className="text-[12px] text-[#555]">{b.ownerEmail}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-[#444]">Members</div>
                                  <div className="text-[13px] text-white">{b.memberCount}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-[#444]">Channels</div>
                                  <div className="text-[13px] text-white">{b.channelCount}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-[#444]">Created</div>
                                  <div className="text-[13px] text-white">
                                    {new Date(b.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-[#444]">Box ID</div>
                                  <div className="font-mono text-[12px] text-[#555]">{b.id}</div>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between border-t border-[#1a1a1a] pt-3">
                                <Link
                                  href={`/box/${b.short_id}`}
                                  className="text-[13px] text-[#276ef1] transition-colors hover:text-[#4a8af5]"
                                >
                                  Open in Chatterbox
                                </Link>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => deleteBox(b.id, b.name)}
                                >
                                  <Trash className="mr-1.5 h-3 w-3" />
                                  Delete Box
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {boxList.length === 0 && !boxesLoading && (
                      <div className="py-12 text-center text-[13px] text-[#555]">
                        {boxSearch ? "No boxes match your search" : "No boxes found"}
                      </div>
                    )}

                    {hasMoreBoxes && (
                      <button
                        onClick={() => fetchBoxes(boxesPage + 1, boxSearch)}
                        disabled={boxesLoading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#1a1a1a] py-2 text-[13px] text-[#666] transition-colors hover:border-[#2a2a2a] hover:text-white disabled:opacity-50"
                      >
                        {boxesLoading ? <Spinner size="xs" /> : "Load more"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Feedback ── */}
            {activeSection === "feedback" && (
              <>
                <h2 className="text-[20px] font-bold text-white">Feedback</h2>
                <p className="mt-1 text-[13px] text-[#555]">
                  {feedbackTotal > 0 ? `${feedbackTotal} entries` : "User feedback & bug reports"}
                </p>
                <SectionDivider />

                {feedbackLoading && feedback.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {feedback.map((f) => {
                      const isExpanded = expandedFeedback === f.id;
                      return (
                        <div
                          key={f.id}
                          className={`rounded-[12px] border transition-colors ${
                            isExpanded ? "border-[#276ef1]/30 bg-[#0f0f0f]" : "border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#2a2a2a]"
                          }`}
                        >
                          {/* Clickable row */}
                          <button
                            onClick={() => setExpandedFeedback(isExpanded ? null : f.id)}
                            className="flex w-full items-start gap-3 p-4 text-left"
                          >
                            {f.profiles?.avatar_url ? (
                              <img src={f.profiles.avatar_url} alt="" className="h-7 w-7 shrink-0 rounded-full" />
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#276ef1]/20 text-[10px] font-bold text-[#276ef1]">
                                {(f.profiles?.full_name || f.email || "?").charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-white">
                                  {f.profiles?.full_name || "Unknown"}
                                </span>
                                <Badge variant={f.type === "report" ? "error" : "info"}>
                                  {f.type}
                                </Badge>
                                <span className="text-[11px] text-[#444]">{timeAgo(f.created_at)}</span>
                              </div>
                              <p className={`mt-1 text-[13px] leading-relaxed text-[#aaa] ${!isExpanded ? "line-clamp-2" : ""}`}>
                                {f.message}
                              </p>
                            </div>

                            {isExpanded ? (
                              <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-[#555]" />
                            ) : (
                              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[#333]" />
                            )}
                          </button>

                          {/* Expanded detail panel */}
                          {isExpanded && (
                            <div className="border-t border-[#1a1a1a] px-4 py-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-[11px] text-[#444]">User Email</div>
                                  <div className="text-[13px] text-white">{f.profiles?.email || f.email || "N/A"}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-[#444]">Submitted</div>
                                  <div className="text-[13px] text-white">
                                    {new Date(f.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-[#444]">Type</div>
                                  <div className="text-[13px] capitalize text-white">{f.type}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-[#444]">Feedback ID</div>
                                  <div className="font-mono text-[12px] text-[#555]">{f.id}</div>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-end border-t border-[#1a1a1a] pt-3">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => deleteFeedback(f.id)}
                                >
                                  <Trash className="mr-1.5 h-3 w-3" />
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {feedback.length === 0 && !feedbackLoading && (
                      <div className="py-12 text-center text-[13px] text-[#555]">
                        No feedback yet
                      </div>
                    )}

                    {hasMoreFeedback && (
                      <button
                        onClick={() => fetchFeedback(feedbackPage + 1)}
                        disabled={feedbackLoading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#1a1a1a] py-2 text-[13px] text-[#666] transition-colors hover:border-[#2a2a2a] hover:text-white disabled:opacity-50"
                      >
                        {feedbackLoading ? <Spinner size="xs" /> : "Load more"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Blog ── */}
            {activeSection === "blog" && (
              <>
                {blogEditor ? (
                  /* ── Blog Editor ── */
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[20px] font-bold text-white">
                          {blogEditor.id ? "Edit Post" : "New Post"}
                        </h2>
                        <p className="mt-1 text-[13px] text-[#555]">
                          {blogEditor.id ? "Update your blog post" : "Create a new blog post"}
                        </p>
                      </div>
                      <button
                        onClick={() => { setBlogEditor(null); setBlogEditorError(""); }}
                        className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to posts
                      </button>
                    </div>
                    <SectionDivider />

                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444]">Title</label>
                        <input
                          type="text"
                          value={blogEditor.title || ""}
                          onChange={(e) => setBlogEditor((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Post title"
                          className="h-10 w-full rounded-[8px] border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-[14px] text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                        />
                      </div>

                      {/* Slug */}
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444]">Slug</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-[#555]">/blog/</span>
                          <input
                            type="text"
                            value={blogEditor.slug || ""}
                            onChange={(e) => setBlogEditor((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                            placeholder="post-slug"
                            className="h-10 flex-1 rounded-[8px] border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-[14px] text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                          />
                        </div>
                      </div>

                      {/* Category + Read time row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444]">Category</label>
                          <select
                            value={blogEditor.category || "Product"}
                            onChange={(e) => setBlogEditor((prev) => ({ ...prev, category: e.target.value }))}
                            className="h-10 w-full rounded-[8px] border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-[14px] text-white outline-none focus:border-[#276ef1]"
                          >
                            <option value="Product">Product</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Guide">Guide</option>
                            <option value="Culture">Culture</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444]">Read Time</label>
                          <input
                            type="text"
                            value={blogEditor.read_time || ""}
                            onChange={(e) => setBlogEditor((prev) => ({ ...prev, read_time: e.target.value }))}
                            placeholder="5 min read"
                            className="h-10 w-full rounded-[8px] border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-[14px] text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                          />
                        </div>
                      </div>

                      {/* Author row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444]">Author Name</label>
                          <input
                            type="text"
                            value={blogEditor.author_name || ""}
                            onChange={(e) => setBlogEditor((prev) => ({ ...prev, author_name: e.target.value }))}
                            placeholder="Author name"
                            className="h-10 w-full rounded-[8px] border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-[14px] text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444]">Author Role</label>
                          <input
                            type="text"
                            value={blogEditor.author_role || ""}
                            onChange={(e) => setBlogEditor((prev) => ({ ...prev, author_role: e.target.value }))}
                            placeholder="e.g. CEO & Co-founder"
                            className="h-10 w-full rounded-[8px] border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-[14px] text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                          />
                        </div>
                      </div>

                      {/* Excerpt */}
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444]">Excerpt</label>
                        <textarea
                          value={blogEditor.excerpt || ""}
                          onChange={(e) => setBlogEditor((prev) => ({ ...prev, excerpt: e.target.value }))}
                          placeholder="Brief description for blog index..."
                          rows={2}
                          className="w-full resize-none rounded-[8px] border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-[14px] leading-relaxed text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                        />
                      </div>

                      {/* Content (markdown) */}
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444]">
                          Content <span className="normal-case font-normal text-[#555]">(Markdown supported)</span>
                        </label>
                        <textarea
                          value={blogEditor.content || ""}
                          onChange={(e) => setBlogEditor((prev) => ({ ...prev, content: e.target.value }))}
                          placeholder="Write your article content in markdown..."
                          rows={16}
                          className="w-full resize-y rounded-[8px] border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 font-mono text-[13px] leading-relaxed text-white placeholder-[#555] outline-none focus:border-[#276ef1]"
                        />
                      </div>

                      {/* Toggles */}
                      <div className="flex items-center gap-6 rounded-[8px] border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                        <label className="flex cursor-pointer items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={!!blogEditor.published}
                            onChange={(e) => setBlogEditor((prev) => ({ ...prev, published: e.target.checked }))}
                            className="h-4 w-4 rounded border-[#2a2a2a] bg-[#1a1a1a] text-[#276ef1] accent-[#276ef1]"
                          />
                          <div className="flex items-center gap-1.5">
                            {blogEditor.published ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeClosed className="h-3.5 w-3.5 text-[#555]" />}
                            <span className="text-[13px] text-white">Published</span>
                          </div>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={!!blogEditor.featured}
                            onChange={(e) => setBlogEditor((prev) => ({ ...prev, featured: e.target.checked }))}
                            className="h-4 w-4 rounded border-[#2a2a2a] bg-[#1a1a1a] text-[#276ef1] accent-[#276ef1]"
                          />
                          <div className="flex items-center gap-1.5">
                            {blogEditor.featured ? <StarFill className="h-3.5 w-3.5 text-amber-400" /> : <Star className="h-3.5 w-3.5 text-[#555]" />}
                            <span className="text-[13px] text-white">Featured</span>
                          </div>
                        </label>
                      </div>

                      {/* Error */}
                      {blogEditorError && (
                        <div className="rounded-[8px] bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
                          {blogEditorError}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 border-t border-[#1a1a1a] pt-4">
                        <Button
                          onClick={saveBlogPost}
                          disabled={blogEditorLoading || !blogEditor.title || !blogEditor.slug}
                        >
                          {blogEditorLoading ? <Spinner size="xs" /> : blogEditor.id ? "Save Changes" : "Create Post"}
                        </Button>
                        <button
                          onClick={() => { setBlogEditor(null); setBlogEditorError(""); }}
                          className="rounded-[8px] px-4 py-2 text-[13px] text-[#666] transition-colors hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── Blog List ── */
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[20px] font-bold text-white">Blog</h2>
                        <p className="mt-1 text-[13px] text-[#555]">
                          {blogTotal > 0 ? `${blogTotal} posts` : "Manage blog articles"}
                        </p>
                      </div>
                      <Button
                        onClick={() => setBlogEditor({
                          title: "",
                          slug: "",
                          category: "Product",
                          excerpt: "",
                          content: "",
                          author_name: "",
                          author_role: "",
                          read_time: "5 min read",
                          published: false,
                          featured: false,
                        })}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        New Post
                      </Button>
                    </div>
                    <SectionDivider />

                    {blogLoading && blogPosts.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {blogPosts.map((post) => (
                          <div
                            key={post.id}
                            className="rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-colors hover:border-[#2a2a2a]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px] font-medium text-white">{post.title}</span>
                                  {post.featured && (
                                    <StarFill className="h-3 w-3 shrink-0 text-amber-400" />
                                  )}
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-[12px] text-[#555]">
                                  <Badge variant={post.published ? "info" : "default"}>
                                    {post.published ? "Published" : "Draft"}
                                  </Badge>
                                  <span>{post.category}</span>
                                  <span>/blog/{post.slug}</span>
                                  {post.author_name && <span>{post.author_name}</span>}
                                  <span>{timeAgo(post.created_at)}</span>
                                </div>
                                {post.excerpt && (
                                  <p className="mt-2 line-clamp-1 text-[13px] text-[#666]">{post.excerpt}</p>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-1">
                                <Tooltip label={post.published ? "Unpublish" : "Publish"}>
                                  <button
                                    onClick={() => toggleBlogPublished(post.id, !post.published)}
                                    className={`flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#1a1a1a] ${
                                      post.published ? "text-emerald-400" : "text-[#555]"
                                    }`}
                                  >
                                    {post.published ? <Eye className="h-3.5 w-3.5" /> : <EyeClosed className="h-3.5 w-3.5" />}
                                  </button>
                                </Tooltip>
                                <Tooltip label={post.featured ? "Unfeature" : "Feature"}>
                                  <button
                                    onClick={() => toggleBlogFeatured(post.id, !post.featured)}
                                    className={`flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#1a1a1a] ${
                                      post.featured ? "text-amber-400" : "text-[#555]"
                                    }`}
                                  >
                                    {post.featured ? <StarFill className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                                  </button>
                                </Tooltip>
                                <Tooltip label="Edit">
                                  <button
                                    onClick={() => loadBlogPostForEdit(post.id)}
                                    className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                </Tooltip>
                                <Tooltip label="Delete">
                                  <button
                                    onClick={() => deleteBlogPost(post.id, post.title)}
                                    className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-red-400"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        ))}

                        {blogPosts.length === 0 && !blogLoading && (
                          <div className="py-12 text-center">
                            <FileText className="mx-auto mb-3 h-8 w-8 text-[#333]" />
                            <div className="text-[13px] text-[#555]">No blog posts yet</div>
                            <button
                              onClick={() => setBlogEditor({
                                title: "",
                                slug: "",
                                category: "Product",
                                excerpt: "",
                                content: "",
                                author_name: "",
                                author_role: "",
                                read_time: "5 min read",
                                published: false,
                                featured: false,
                              })}
                              className="mt-2 text-[13px] text-[#276ef1] transition-colors hover:text-[#4a8af5]"
                            >
                              Create your first post
                            </button>
                          </div>
                        )}

                        {hasMoreBlog && (
                          <button
                            onClick={() => fetchBlogPosts(blogPage + 1)}
                            disabled={blogLoading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#1a1a1a] py-2 text-[13px] text-[#666] transition-colors hover:border-[#2a2a2a] hover:text-white disabled:opacity-50"
                          >
                            {blogLoading ? <Spinner size="xs" /> : "Load more"}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={confirmLoading}
      />
    </AppShell>
  );
}
