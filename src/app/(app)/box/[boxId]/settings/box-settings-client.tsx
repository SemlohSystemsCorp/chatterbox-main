"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon as ArrowLeft, GearIcon as Settings, HashIcon as Hash, LockIcon as Lock, PeopleIcon as Users, CreditCardIcon as CreditCard, ShieldIcon as Shield, TrophyIcon as Crown, TrashIcon as Trash2, PencilIcon as Pencil, ArchiveIcon as Archive, PlusIcon as Plus, AlertFillIcon as AlertTriangle, CheckIcon as Check, XIcon as X, EyeIcon as Eye, LinkExternalIcon as ExternalLink, ZapIcon as Zap, GlobeIcon as Globe, BellIcon as Bell, LinkIcon } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";

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
}

interface BoxSettingsClientProps {
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

type Section = "general" | "channels" | "members" | "billing" | "danger";

function SectionDivider() {
  return <div className="my-1 border-t border-[#1a1a1a]" />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
      {title}
    </div>
  );
}

// ── Channel Edit Modal ──
function EditChannelModal({
  channel,
  onClose,
  onSave,
  onDelete,
}: {
  channel: ChannelData;
  onClose: () => void;
  onSave: (id: string, updates: { name: string; description: string; is_private: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [isPrivate, setIsPrivate] = useState(channel.is_private);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-[480px] rounded-[16px] border border-[#1a1a1a] bg-[#111] p-6 shadow-[0_16px_64px_rgba(0,0,0,0.6)]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-white">Edit Channel</h3>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[14px] text-white">Channel name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 text-[14px] text-white placeholder:text-[#444] focus:border-[#276ef1] focus:outline-none"
              placeholder="channel-name"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[14px] text-white">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-2 text-[14px] text-white placeholder:text-[#444] focus:border-[#276ef1] focus:outline-none"
              placeholder="What's this channel about?"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[14px] text-white">Private channel</div>
              <div className="mt-0.5 text-[12px] text-[#555]">
                Only invited members can see this channel
              </div>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                isPrivate ? "bg-[#276ef1]" : "bg-[#333]"
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  isPrivate ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <SectionDivider />

        {/* Delete zone */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-3 flex items-center gap-2 text-[13px] text-[#de1135] transition-colors hover:text-[#ff2244]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete this channel
          </button>
        ) : (
          <div className="mt-3 rounded-[10px] border border-[#2a1520] bg-[#1a0f14] p-3">
            <p className="mb-3 text-[13px] text-[#de1135]">
              This will permanently delete <strong>#{channel.name}</strong> and all its messages. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(channel.id)}
                className="h-8 rounded-[8px] bg-[#de1135] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#ff2244]"
              >
                Delete permanently
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-8 rounded-[8px] bg-[#1a1a1a] px-4 text-[13px] text-[#888] transition-colors hover:bg-[#252525]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-[8px] bg-[#1a1a1a] px-4 text-[13px] font-medium text-[#888] transition-colors hover:bg-[#252525] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(channel.id, { name, description, is_private: isPrivate })}
            className="h-9 rounded-[8px] bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-[#e0e0e0]"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan cards ──
const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Up to 5 channels",
      "10 members",
      "1 GB storage",
      "7-day message history",
      "Basic integrations",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$8",
    period: "per member/month",
    features: [
      "Unlimited channels",
      "Unlimited members",
      "50 GB storage",
      "Unlimited message history",
      "All integrations",
      "AI-powered features",
      "Priority support",
      "Custom branding",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Audit logs",
      "99.99% SLA",
      "Dedicated support",
      "Custom contracts",
      "Data residency",
      "Advanced compliance",
    ],
  },
];

// ── Main component ──

export function BoxSettingsClient({
  user,
  boxes,
  box,
  channels: initialChannels,
  members: initialMembers,
}: BoxSettingsClientProps) {
  const router = useRouter();
  const isOwner = box.role === "owner";
  const isAdmin = box.role === "owner" || box.role === "admin";
  const isMember = box.role === "member";
  const isGuest = box.role === "guest";

  const [members, setMembers] = useState(initialMembers);
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // General settings state
  const [boxName, setBoxName] = useState(box.name);
  const [boxDescription, setBoxDescription] = useState(box.description || "");

  // Channel state
  const [channels, setChannels] = useState(initialChannels);
  const [editingChannel, setEditingChannel] = useState<ChannelData | null>(null);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Build sections based on role
  const getSections = () => {
    const base: { id: Section; label: string; icon: typeof Settings }[] = [
      { id: "general", label: "General", icon: Settings },
    ];

    if (isAdmin || isOwner || isMember) {
      base.push({ id: "channels", label: "Channels", icon: Hash });
    }

    if (isAdmin || isOwner) {
      base.push({ id: "members", label: "Members", icon: Users });
      base.push({ id: "billing", label: "Billing", icon: CreditCard });
    }

    if (isOwner) {
      base.push({ id: "danger", label: "Danger Zone", icon: AlertTriangle });
    }

    return base;
  };

  const sections = getSections();

  async function saveBoxSettings() {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/boxes/${box.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boxName, description: boxDescription }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveChannel(
    channelId: string,
    updates: { name: string; description: string; is_private: boolean }
  ) {
    const res = await fetch(`/api/channels/${channelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const { channel } = await res.json();
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, ...channel } : c))
      );
      setEditingChannel(null);
    }
  }

  async function handleDeleteChannel(channelId: string) {
    const res = await fetch(`/api/channels/${channelId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setEditingChannel(null);
    }
  }

  async function handleArchiveChannel(channelId: string, archive: boolean) {
    const res = await fetch(`/api/channels/${channelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: archive }),
    });
    if (res.ok) {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId ? { ...c, is_archived: archive } : c
        )
      );
    }
  }

  async function handleDeleteBox() {
    if (deleteConfirm !== box.name) return;
    const res = await fetch(`/api/boxes/${box.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Remove this member from the Box?")) return;

    const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to remove member");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  function getRoleIcon(role: string) {
    if (role === "owner") return Crown;
    if (role === "admin") return Shield;
    return null;
  }

  return (
    <AppShell user={user} boxes={boxes} activeBoxId={box.short_id}>
      <TopBar
        title="Box Settings"
        actions={
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-[12px] text-[#22c55e]">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {saving && (
              <span className="text-[12px] text-[#555]">Saving...</span>
            )}
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
        {/* Settings Nav */}
        <nav className="w-[220px] shrink-0 overflow-auto border-r border-[#1a1a1a] py-4 px-3">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] transition-colors ${
                activeSection === s.id
                  ? "bg-[#1a1a1a] font-medium text-white"
                  : s.id === "danger"
                    ? "text-[#de1135]/60 hover:bg-[#1a0f14] hover:text-[#de1135]"
                    : "text-[#666] hover:bg-[#111] hover:text-white"
              }`}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[640px] px-8 py-6">
            {/* ── GENERAL ── */}
            {activeSection === "general" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">General</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  {isAdmin
                    ? "Manage your Box identity and settings."
                    : "View your Box details."}
                </p>

                {/* Box Identity Card */}
                <div className="mb-6 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                  <div className="flex items-center gap-4">
                    {box.icon_url ? (
                      <img src={box.icon_url} alt="" className="h-14 w-14 rounded-xl" />
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
                        <span className="text-[16px] font-bold text-white">{box.name}</span>
                        <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#666]">
                          {box.plan}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#444]">
                        getchatterbox.app/{box.slug}
                      </div>
                    </div>
                    <div className="text-right text-[12px] text-[#444]">
                      <div>Your role: <span className="capitalize text-[#888]">{box.role}</span></div>
                      <div>{members.length} members</div>
                    </div>
                  </div>
                </div>

                {isAdmin ? (
                  <>
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
                      <div className="mb-1.5 text-[14px] text-white">Description</div>
                      <textarea
                        value={boxDescription}
                        onChange={(e) => setBoxDescription(e.target.value)}
                        rows={3}
                        placeholder="What's this Box about?"
                        className="w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-2 text-[14px] text-white placeholder:text-[#444] focus:border-[#276ef1] focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={saveBoxSettings}
                      disabled={saving}
                      className="mt-2 h-9 rounded-[8px] bg-white px-5 text-[13px] font-semibold text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>

                    <SectionDivider />
                    <SectionHeader title="Quick Info" />
                    <div className="space-y-2 py-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#555]">Created</span>
                        <span className="text-white">
                          {new Date(box.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#555]">Channels</span>
                        <span className="text-white">{channels.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#555]">Members</span>
                        <span className="text-white">{members.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#555]">Plan</span>
                        <span className="capitalize text-white">{box.plan}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Read-only view for members/guests */
                  <>
                    <SectionHeader title="Box Info" />
                    <div className="space-y-2 py-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#555]">Name</span>
                        <span className="text-white">{box.name}</span>
                      </div>
                      {box.description && (
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-[#555]">Description</span>
                          <span className="text-white">{box.description}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#555]">Channels</span>
                        <span className="text-white">{channels.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#555]">Members</span>
                        <span className="text-white">{members.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#555]">Plan</span>
                        <span className="capitalize text-white">{box.plan}</span>
                      </div>
                    </div>

                    {isGuest && (
                      <div className="mt-6 rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 text-center">
                        <Eye className="mx-auto mb-2 h-5 w-5 text-[#444]" />
                        <p className="text-[13px] text-[#555]">
                          You have view-only access as a guest.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── CHANNELS ── */}
            {activeSection === "channels" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Channels</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  {isAdmin
                    ? "Create, edit, and manage channels in this Box."
                    : "Browse channels in this Box."}
                </p>

                {isAdmin && (
                  <button
                    onClick={() => setCreateChannelOpen(true)}
                    className="mb-4 flex h-9 items-center gap-2 rounded-[8px] bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-[#e0e0e0]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New channel
                  </button>
                )}

                <div className="space-y-1.5">
                  {channels.length === 0 ? (
                    <div className="rounded-[12px] border border-dashed border-[#222] py-8 text-center">
                      <Hash className="mx-auto mb-2 h-6 w-6 text-[#444]" />
                      <p className="text-[13px] text-[#666]">No channels yet</p>
                    </div>
                  ) : (
                    channels.map((channel) => (
                      <div
                        key={channel.id}
                        className="group flex items-center gap-3 rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3 transition-colors hover:border-[#2a2a2a]"
                      >
                        {channel.is_private ? (
                          <Lock className="h-4 w-4 shrink-0 text-[#555]" />
                        ) : (
                          <Hash className="h-4 w-4 shrink-0 text-[#555]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-medium text-white">
                              {channel.name}
                            </span>
                            {channel.is_archived && (
                              <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] text-[#666]">
                                Archived
                              </span>
                            )}
                          </div>
                          {channel.description && (
                            <p className="truncate text-[12px] text-[#555]">
                              {channel.description}
                            </p>
                          )}
                        </div>

                        {/* Channel actions — admin only */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Tooltip label="View channel">
                              <Link
                                href={`/box/${box.short_id}/c/${channel.short_id}`}
                                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Tooltip>
                            <Tooltip label="Edit channel">
                              <button
                                onClick={() => setEditingChannel(channel)}
                                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip label={channel.is_archived ? "Unarchive" : "Archive"}>
                              <button
                                onClick={() => handleArchiveChannel(channel.id, !channel.is_archived)}
                                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ── MEMBERS ── (admin/owner only) */}
            {activeSection === "members" && isAdmin && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Members</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Manage who has access to this Box.
                </p>

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-[8px] bg-[#0f0f0f] border border-[#1a1a1a] px-3 text-[13px]">
                    <Users className="h-3.5 w-3.5 text-[#555]" />
                    <span className="text-white font-medium">{members.length}</span>
                    <span className="text-[#555]">members</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {members.map((member) => {
                    const RoleIcon = getRoleIcon(member.role);
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
                        className="group flex items-center gap-3 rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3"
                      >
                        <div className="relative">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="h-9 w-9 rounded-full" />
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
                              <span className="text-[11px] text-[#555]">(you)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-[#555]">
                            <span className="flex items-center gap-1 capitalize">
                              {RoleIcon && <RoleIcon className="h-3 w-3" />}
                              {member.role}
                            </span>
                            <span className="text-[#333]">·</span>
                            <span>{member.email}</span>
                          </div>
                        </div>

                        {/* Admin actions */}
                        {isOwner && member.user_id !== user.id && (
                          <Tooltip label="Remove member">
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] text-[#555] opacity-0 transition-all hover:bg-[#2a1520] hover:text-[#de1135] group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                              Remove
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── BILLING ── (admin/owner only) */}
            {activeSection === "billing" && isAdmin && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Billing</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Manage your subscription and billing details.
                </p>

                {/* Current plan */}
                <div className="mb-6 rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                        Current Plan
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[22px] font-bold capitalize text-white">
                          {box.plan}
                        </span>
                        {box.plan === "free" && (
                          <span className="rounded bg-[#1a1a1a] px-2 py-0.5 text-[11px] text-[#666]">
                            Limited
                          </span>
                        )}
                        {box.plan === "pro" && (
                          <span className="rounded bg-[#276ef1]/10 px-2 py-0.5 text-[11px] text-[#276ef1]">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    {box.plan !== "enterprise" && (
                      <Link
                        href={`/checkout?box=${box.short_id}&plan=${box.plan === "free" ? "pro" : "enterprise"}`}
                        className="flex h-9 items-center gap-1.5 rounded-[8px] bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-[#e0e0e0]"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Upgrade
                      </Link>
                    )}
                  </div>
                </div>

                {/* Plan comparison */}
                <SectionHeader title="Plans" />
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {plans.map((plan) => {
                    const isCurrent = box.plan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-[12px] border p-4 ${
                          isCurrent
                            ? "border-[#276ef1] bg-[#276ef1]/5"
                            : "border-[#1a1a1a] bg-[#0f0f0f]"
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#276ef1] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                            Popular
                          </div>
                        )}
                        <div className="mb-3">
                          <div className="text-[14px] font-bold text-white">{plan.name}</div>
                          <div className="mt-1">
                            <span className="text-[20px] font-bold text-white">{plan.price}</span>
                            <span className="ml-1 text-[12px] text-[#555]">{plan.period}</span>
                          </div>
                        </div>
                        <ul className="space-y-1.5">
                          {plan.features.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-1.5 text-[12px] text-[#888]"
                            >
                              <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#22c55e]" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4">
                          {isCurrent ? (
                            <div className="flex h-8 items-center justify-center rounded-[8px] bg-[#1a1a1a] text-[12px] font-medium text-[#666]">
                              Current plan
                            </div>
                          ) : plan.id === "enterprise" ? (
                            <a
                              href="mailto:sales@getchatterbox.app"
                              className="flex h-8 items-center justify-center rounded-[8px] bg-[#1a1a1a] text-[12px] font-medium text-[#888] transition-colors hover:bg-[#252525] hover:text-white"
                            >
                              Contact sales
                            </a>
                          ) : (
                            <Link
                              href={`/checkout?box=${box.short_id}&plan=${plan.id}`}
                              className="flex h-8 items-center justify-center rounded-[8px] bg-white text-[12px] font-semibold text-black transition-colors hover:bg-[#e0e0e0]"
                            >
                              {box.plan === "free" ? "Upgrade" : "Change plan"}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <SectionDivider />
                <SectionHeader title="Billing Info" />
                <div className="space-y-2 py-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#555]">Members</span>
                    <span className="text-white">{members.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#555]">Monthly estimate</span>
                    <span className="text-white">
                      {box.plan === "free"
                        ? "$0.00"
                        : box.plan === "pro"
                          ? `$${(members.length * 8).toFixed(2)}`
                          : "Custom"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#555]">Billing cycle</span>
                    <span className="text-white">Monthly</span>
                  </div>
                </div>

                <SectionDivider />
                <SectionHeader title="Payment Method" />
                <div className="mt-2 rounded-[10px] border border-dashed border-[#222] p-5 text-center">
                  <CreditCard className="mx-auto mb-2 h-6 w-6 text-[#444]" />
                  <p className="mb-1 text-[13px] text-[#666]">No payment method on file</p>
                  <p className="mb-3 text-[12px] text-[#444]">
                    Add a payment method to upgrade your plan
                  </p>
                  <Link
                    href={`/checkout?box=${box.short_id}&plan=pro`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-white px-4 text-[12px] font-semibold text-black transition-colors hover:bg-[#e0e0e0]"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Add payment method
                  </Link>
                </div>

                <SectionDivider />
                <SectionHeader title="Polar.sh Integration" />
                <div className="mt-2 rounded-[10px] border border-[#1a1a1a] bg-[#0f0f0f] p-4">
                  <p className="text-[13px] text-[#888]">
                    Chatterbox uses Polar.sh for subscription billing. Payments and invoicing are handled automatically through your connected Polar.sh account.
                  </p>
                </div>
              </>
            )}

            {/* ── DANGER ZONE ── (owner only) */}
            {activeSection === "danger" && isOwner && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-[#de1135]">Danger Zone</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Irreversible actions. Proceed with caution.
                </p>

                <div className="rounded-[12px] border border-[#2a1520] bg-[#1a0f14]/50 p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#de1135]" />
                    <div>
                      <h3 className="text-[15px] font-bold text-white">Delete this Box</h3>
                      <p className="mt-1 text-[13px] text-[#888]">
                        This will permanently delete <strong>{box.name}</strong>, including all channels, messages, files, and member data. This action is immediate and cannot be undone.
                      </p>
                    </div>
                  </div>

                  <SectionDivider />

                  <div className="mt-4">
                    <label className="mb-1.5 block text-[13px] text-[#888]">
                      Type <strong className="text-white">{box.name}</strong> to confirm
                    </label>
                    <input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={box.name}
                      className="mb-3 h-10 w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 text-[14px] text-white placeholder:text-[#333] focus:border-[#de1135] focus:outline-none"
                    />
                    <button
                      onClick={handleDeleteBox}
                      disabled={deleteConfirm !== box.name}
                      className="h-9 rounded-[8px] bg-[#de1135] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#ff2244] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Delete Box forever
                    </button>
                  </div>
                </div>
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

      {/* Modals */}
      {editingChannel && (
        <EditChannelModal
          channel={editingChannel}
          onClose={() => setEditingChannel(null)}
          onSave={handleSaveChannel}
          onDelete={handleDeleteChannel}
        />
      )}

      <CreateChannelModal
        open={createChannelOpen}
        onClose={() => {
          setCreateChannelOpen(false);
          router.refresh();
        }}
        boxId={box.id}
        boxShortId={box.short_id}
      />
    </AppShell>
  );
}
