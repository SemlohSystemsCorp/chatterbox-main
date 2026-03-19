"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon as ArrowLeft, PersonIcon as User, ShieldIcon as Shield, PaintbrushIcon as Palette, BellIcon as Bell, CommentDiscussionIcon as MessageSquare, LockIcon as Lock, AccessibilityIcon as Accessibility, GlobeIcon as Globe, DeviceCameraVideoIcon as Video, ToolsIcon as Wrench, CheckCircleIcon as Save, CheckIcon as Check, DeviceCameraIcon as Camera, LoopIcon as Loader2, TrashIcon as Trash2 } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { useSettingsStore, type Settings } from "@/stores/settings-store";
import { createClient } from "@/lib/supabase/client";

interface BoxData {
  id: string;
  short_id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  plan: string;
  role: string;
}

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  boxes: BoxData[];
}

type Section =
  | "profile"
  | "account"
  | "appearance"
  | "notifications"
  | "chat"
  | "privacy"
  | "accessibility"
  | "language"
  | "audio_video"
  | "advanced";

const sections: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "chat", label: "Chat & Messaging", icon: MessageSquare },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "language", label: "Language & Region", icon: Globe },
  { id: "audio_video", label: "Audio & Video", icon: Video },
  { id: "advanced", label: "Advanced", icon: Wrench },
];

// ── Reusable setting controls ──

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-[14px] text-white">{label}</div>
        {description && (
          <div className="mt-0.5 text-[12px] text-[#555]">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? "bg-[#276ef1]" : "bg-[#333]"
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function TextInput({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="py-3">
      <div className="mb-1.5 text-[14px] text-white">{label}</div>
      {description && (
        <div className="mb-2 text-[12px] text-[#555]">{description}</div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 text-[14px] text-white placeholder:text-[#444] focus:border-[#276ef1] focus:outline-none"
      />
    </div>
  );
}

function TextArea({
  label,
  description,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="py-3">
      <div className="mb-1.5 text-[14px] text-white">{label}</div>
      {description && (
        <div className="mb-2 text-[12px] text-[#555]">{description}</div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-2 text-[14px] text-white placeholder:text-[#444] focus:border-[#276ef1] focus:outline-none"
      />
    </div>
  );
}

function Select({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-[14px] text-white">{label}</div>
        {description && (
          <div className="mt-0.5 text-[12px] text-[#555]">{description}</div>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 shrink-0 rounded-[8px] border-0 bg-[#1a1a1a] px-3 pr-8 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[#276ef1]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Slider({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div className="text-[14px] text-white">{label}</div>
        <div className="text-[13px] text-[#666]">
          {value}
          {suffix}
        </div>
      </div>
      {description && (
        <div className="mt-0.5 text-[12px] text-[#555]">{description}</div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#333] accent-[#276ef1]"
      />
    </div>
  );
}

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

// ── Main component ──

export function SettingsClient({ user, boxes }: SettingsClientProps) {
  const router = useRouter();
  const { settings, loaded, saving, loadFromServer, updateSetting, setSettings } =
    useSettingsStore();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [saved, setSaved] = useState(false);

  // Avatar upload
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleAvatarRemove() {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) {
        setAvatarUrl(null);
      }
    } finally {
      setAvatarUploading(false);
    }
  }

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  function update(key: keyof Settings, value: unknown) {
    updateSetting(key, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem("chatterbox_settings");
    router.push("/login");
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure? This permanently deletes your account and all data.")) return;
    if (!confirm("This cannot be undone. Are you absolutely sure?")) return;

    try {
      const res = await fetch("/api/profile/delete", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete account");
        return;
      }
      localStorage.removeItem("chatterbox_settings");
      router.push("/login");
      router.refresh();
    } catch {
      alert("Failed to delete account. Please try again.");
    }
  }

  return (
    <AppShell user={user} boxes={boxes}>
      <TopBar
        title="Settings"
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
              href="/dashboard"
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
            {/* ── PROFILE ── */}
            {activeSection === "profile" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Profile</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Manage how others see you on Chatterbox.
                </p>

                {/* Avatar upload */}
                <div className="mb-6 flex items-center gap-5">
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a1a1a] text-[24px] font-bold text-white">
                        {(user.fullName || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="flex h-8 items-center gap-1.5 rounded-[8px] bg-[#1a1a1a] px-3 text-[13px] text-white transition-colors hover:bg-[#252525] disabled:opacity-50"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {avatarUrl ? "Change avatar" : "Upload avatar"}
                    </button>
                    {avatarUrl && (
                      <button
                        onClick={handleAvatarRemove}
                        disabled={avatarUploading}
                        className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-[#de1135] disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <TextInput label="Display name" value={settings.display_name} onChange={(v) => update("display_name", v)} placeholder={user.fullName || "Your name"} />
                <TextArea label="Bio" value={settings.bio} onChange={(v) => update("bio", v)} placeholder="Tell people about yourself" />
                <TextInput label="Pronouns" value={settings.pronouns} onChange={(v) => update("pronouns", v)} placeholder="e.g. they/them" />
                <SectionDivider />
                <SectionHeader title="Contact" />
                <TextInput label="Phone number" value={settings.phone} onChange={(v) => update("phone", v)} placeholder="+1 (555) 000-0000" type="tel" />
                <TextInput label="Location" value={settings.location} onChange={(v) => update("location", v)} placeholder="City, Country" />
                <TextInput label="Website" value={settings.website} onChange={(v) => update("website", v)} placeholder="https://example.com" type="url" />
                <SectionDivider />
                <SectionHeader title="Work" />
                <TextInput label="Company" value={settings.company} onChange={(v) => update("company", v)} placeholder="Where you work" />
                <TextInput label="Job title" value={settings.job_title} onChange={(v) => update("job_title", v)} placeholder="What you do" />
                <TextInput label="Birthday" value={settings.birthday} onChange={(v) => update("birthday", v)} type="date" />
              </>
            )}

            {/* ── ACCOUNT ── */}
            {activeSection === "account" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Account</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Manage your account security and preferences.
                </p>

                <div className="rounded-[12px] border border-[#1a1a1a] bg-[#0f0f0f] p-4 mb-4">
                  <div className="text-[13px] text-[#555]">Email</div>
                  <div className="text-[14px] text-white">{user.email}</div>
                </div>

                <SectionHeader title="Security" />
                <Toggle label="Two-factor authentication" description="Add an extra layer of security to your account" value={settings.two_factor_enabled} onChange={(v) => update("two_factor_enabled", v)} />
                <Toggle label="Login notifications" description="Get notified when someone logs into your account" value={settings.login_notifications} onChange={(v) => update("login_notifications", v)} />
                <Slider label="Session timeout" description="Auto-logout after inactivity (0 = never)" value={settings.session_timeout_minutes} onChange={(v) => update("session_timeout_minutes", v)} min={0} max={480} step={15} suffix=" min" />
                <Slider label="Active sessions limit" description="Maximum concurrent login sessions" value={settings.active_sessions_limit} onChange={(v) => update("active_sessions_limit", v)} min={1} max={20} suffix="" />

                <SectionDivider />
                <SectionHeader title="Data" />
                <Toggle label="Allow data export" description="Enable downloading a copy of your data" value={settings.allow_data_export} onChange={(v) => update("allow_data_export", v)} />
                <Toggle label="Sync across devices" description="Keep your settings synchronized on all devices" value={settings.sync_across_devices} onChange={(v) => update("sync_across_devices", v)} />

                <SectionDivider />
                <SectionHeader title="Danger zone" />
                <div className="mt-2 flex gap-3">
                  <button onClick={handleSignOut} className="h-9 rounded-[8px] bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#252525]">
                    Sign out
                  </button>
                  <button onClick={handleDeleteAccount} className="h-9 rounded-[8px] bg-[#2a0f14] px-4 text-[13px] font-medium text-[#de1135] transition-colors hover:bg-[#3a1520]">
                    Delete account
                  </button>
                </div>
              </>
            )}

            {/* ── APPEARANCE ── */}
            {activeSection === "appearance" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Appearance</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Customize how Chatterbox looks.
                </p>

                <Select label="Theme" value={settings.theme} onChange={(v) => update("theme", v)} options={[
                  { value: "dark", label: "Dark" },
                  { value: "light", label: "Light" },
                  { value: "system", label: "System" },
                ]} />
                <TextInput label="Accent color" value={settings.accent_color} onChange={(v) => update("accent_color", v)} placeholder="#276ef1" />
                <Select label="Font size" value={settings.font_size} onChange={(v) => update("font_size", v)} options={[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" },
                ]} />
                <Select label="Message density" value={settings.message_density} onChange={(v) => update("message_density", v)} options={[
                  { value: "compact", label: "Compact" },
                  { value: "default", label: "Default" },
                  { value: "comfortable", label: "Comfortable" },
                ]} />
                <Select label="Sidebar width" value={settings.sidebar_width} onChange={(v) => update("sidebar_width", v)} options={[
                  { value: "narrow", label: "Narrow" },
                  { value: "default", label: "Default" },
                  { value: "wide", label: "Wide" },
                ]} />

                <SectionDivider />
                <SectionHeader title="Display" />
                <Toggle label="Compact mode" description="Reduce spacing between messages" value={settings.compact_mode} onChange={(v) => update("compact_mode", v)} />
                <Toggle label="Show avatars" description="Display user avatars next to messages" value={settings.show_avatars} onChange={(v) => update("show_avatars", v)} />
                <Toggle label="Animate emoji" description="Play emoji animations in messages" value={settings.animate_emoji} onChange={(v) => update("animate_emoji", v)} />
                <Toggle label="Show color gradients" description="Use gradient backgrounds in UI elements" value={settings.show_color_gradients} onChange={(v) => update("show_color_gradients", v)} />
                <Toggle label="Show user status" description="Display online/away/DND indicators" value={settings.show_user_status} onChange={(v) => update("show_user_status", v)} />
                <Toggle label="Show clock" description="Display a clock in the sidebar" value={settings.show_clock} onChange={(v) => update("show_clock", v)} />
                <Toggle label="Use 24-hour time" value={settings.use_24h_time} onChange={(v) => update("use_24h_time", v)} />
                <Toggle label="Reduce motion" description="Minimize animations for comfort" value={settings.reduce_motion} onChange={(v) => update("reduce_motion", v)} />
                <Toggle label="High contrast" description="Increase contrast for better readability" value={settings.high_contrast} onChange={(v) => update("high_contrast", v)} />
              </>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeSection === "notifications" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Notifications</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Control when and how you get notified.
                </p>

                <Toggle label="Enable notifications" description="Master toggle for all notifications" value={settings.notifications_enabled} onChange={(v) => update("notifications_enabled", v)} />
                <Toggle label="Mute all sounds" description="Silence all notification and message sounds" value={settings.mute_all_sounds} onChange={(v) => update("mute_all_sounds", v)} />

                <SectionDivider />
                <SectionHeader title="Channels" />
                <Toggle label="Desktop notifications" value={settings.desktop_notifications} onChange={(v) => update("desktop_notifications", v)} />
                <Toggle label="Mobile push notifications" value={settings.mobile_push_notifications} onChange={(v) => update("mobile_push_notifications", v)} />
                <Toggle label="Email notifications" description="Receive email for missed messages" value={settings.email_notifications} onChange={(v) => update("email_notifications", v)} />

                <SectionDivider />
                <SectionHeader title="Triggers" />
                <Toggle label="Mentions" description="When someone @mentions you" value={settings.notify_on_mention} onChange={(v) => update("notify_on_mention", v)} />
                <Toggle label="Direct messages" value={settings.notify_on_dm} onChange={(v) => update("notify_on_dm", v)} />
                <Toggle label="Replies" description="When someone replies to your message" value={settings.notify_on_reply} onChange={(v) => update("notify_on_reply", v)} />
                <Toggle label="Reactions" description="When someone reacts to your message" value={settings.notify_on_reaction} onChange={(v) => update("notify_on_reaction", v)} />
                <Toggle label="Channel activity" description="All new messages in channels" value={settings.notify_on_channel_activity} onChange={(v) => update("notify_on_channel_activity", v)} />
                <Toggle label="Member joins" value={settings.notify_on_member_join} onChange={(v) => update("notify_on_member_join", v)} />
                <Toggle label="Member leaves" value={settings.notify_on_member_leave} onChange={(v) => update("notify_on_member_leave", v)} />
                <Toggle label="Incoming calls" value={settings.notify_on_call} onChange={(v) => update("notify_on_call", v)} />

                <SectionDivider />
                <SectionHeader title="Sound & Badge" />
                <Select label="Notification sound" value={settings.notification_sound} onChange={(v) => update("notification_sound", v)} options={[
                  { value: "default", label: "Default" },
                  { value: "chime", label: "Chime" },
                  { value: "ding", label: "Ding" },
                  { value: "pop", label: "Pop" },
                  { value: "none", label: "None" },
                ]} />
                <Slider label="Notification volume" value={settings.notification_volume} onChange={(v) => update("notification_volume", v)} suffix="%" />
                <Toggle label="Badge count" description="Show unread count on the app icon" value={settings.badge_count_enabled} onChange={(v) => update("badge_count_enabled", v)} />
                <Toggle label="Flash taskbar" description="Flash taskbar on new notifications" value={settings.flash_taskbar} onChange={(v) => update("flash_taskbar", v)} />
                <Toggle label="Notification preview" description="Show message content in notifications" value={settings.notification_preview} onChange={(v) => update("notification_preview", v)} />

                <SectionDivider />
                <SectionHeader title="Schedule" />
                <Toggle label="Notification schedule" description="Only receive notifications during set hours" value={settings.notification_schedule_enabled} onChange={(v) => update("notification_schedule_enabled", v)} />
                {settings.notification_schedule_enabled && (
                  <>
                    <TextInput label="Start time" value={settings.notification_schedule_start} onChange={(v) => update("notification_schedule_start", v)} type="time" />
                    <TextInput label="End time" value={settings.notification_schedule_end} onChange={(v) => update("notification_schedule_end", v)} type="time" />
                    <TextInput label="Timezone" value={settings.notification_schedule_timezone} onChange={(v) => update("notification_schedule_timezone", v)} placeholder="UTC" />
                    <TextInput label="Days" description="Comma-separated: mon,tue,wed,thu,fri" value={settings.notification_schedule_days} onChange={(v) => update("notification_schedule_days", v)} />
                  </>
                )}
              </>
            )}

            {/* ── CHAT & MESSAGING ── */}
            {activeSection === "chat" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Chat & Messaging</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Customize your messaging experience.
                </p>

                <SectionHeader title="Composing" />
                <Toggle label="Send on Enter" description="Press Enter to send, Shift+Enter for new line" value={settings.send_on_enter} onChange={(v) => update("send_on_enter", v)} />
                <Toggle label="Enable spellcheck" value={settings.enable_spellcheck} onChange={(v) => update("enable_spellcheck", v)} />
                <Toggle label="Enable autocorrect" value={settings.enable_autocorrect} onChange={(v) => update("enable_autocorrect", v)} />
                <Toggle label="Enable markdown" description="Format text with **bold**, *italic*, etc." value={settings.enable_markdown} onChange={(v) => update("enable_markdown", v)} />
                <Toggle label="Enable code blocks" description="Support ```code``` syntax in messages" value={settings.enable_code_blocks} onChange={(v) => update("enable_code_blocks", v)} />

                <SectionDivider />
                <SectionHeader title="Emoji" />
                <Toggle label="Convert emoticons" description="Turn :) into a real emoji" value={settings.convert_emoticons} onChange={(v) => update("convert_emoticons", v)} />
                <Toggle label="Suggest emoji" description="Show emoji suggestions as you type" value={settings.suggest_emoji} onChange={(v) => update("suggest_emoji", v)} />
                <Toggle label="Large emoji" description="Display single emoji messages at a larger size" value={settings.large_emoji} onChange={(v) => update("large_emoji", v)} />
                <Slider label="Default skin tone" description="Choose your preferred emoji skin tone (0 = default)" value={settings.default_emoji_skin_tone} onChange={(v) => update("default_emoji_skin_tone", v)} min={0} max={5} />

                <SectionDivider />
                <SectionHeader title="Media" />
                <Toggle label="Show link previews" description="Preview URLs shared in messages" value={settings.show_link_previews} onChange={(v) => update("show_link_previews", v)} />
                <Toggle label="Show media inline" description="Display images and videos directly in chat" value={settings.show_media_inline} onChange={(v) => update("show_media_inline", v)} />
                <Toggle label="Auto-play videos" value={settings.auto_play_videos} onChange={(v) => update("auto_play_videos", v)} />
                <Toggle label="Auto-play GIFs" value={settings.auto_play_gifs} onChange={(v) => update("auto_play_gifs", v)} />

                <SectionDivider />
                <SectionHeader title="Display" />
                <Toggle label="Show typing indicator" description="See when others are typing" value={settings.show_typing_indicator} onChange={(v) => update("show_typing_indicator", v)} />
                <Toggle label="Show read receipts" description="See when messages have been read" value={settings.show_read_receipts} onChange={(v) => update("show_read_receipts", v)} />
                <Slider label="Message grouping" description="Group messages sent within this window (minutes)" value={settings.message_grouping_minutes} onChange={(v) => update("message_grouping_minutes", v)} min={1} max={30} suffix=" min" />
                <Select label="Chat bubble style" value={settings.chat_bubble_style} onChange={(v) => update("chat_bubble_style", v)} options={[
                  { value: "default", label: "Default" },
                  { value: "minimal", label: "Minimal" },
                  { value: "bubble", label: "Bubble" },
                ]} />
              </>
            )}

            {/* ── PRIVACY ── */}
            {activeSection === "privacy" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Privacy</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Control what others can see about you.
                </p>

                <SectionHeader title="Visibility" />
                <Toggle label="Show online status" description="Let others see when you're online" value={settings.show_online_status} onChange={(v) => update("show_online_status", v)} />
                <Toggle label="Show last seen" description="Let others see when you were last active" value={settings.show_last_seen} onChange={(v) => update("show_last_seen", v)} />
                <Toggle label="Show current activity" description="Display what you're currently doing" value={settings.show_current_activity} onChange={(v) => update("show_current_activity", v)} />
                <Toggle label="Discoverable" description="Allow people to find you by name or email" value={settings.discoverable} onChange={(v) => update("discoverable", v)} />
                <Select label="Show profile photo to" value={settings.show_profile_photo_to} onChange={(v) => update("show_profile_photo_to", v)} options={[
                  { value: "everyone", label: "Everyone" },
                  { value: "box_members", label: "Box members only" },
                  { value: "none", label: "Nobody" },
                ]} />

                <SectionDivider />
                <SectionHeader title="Contact" />
                <Toggle label="Hide email" description="Don't show your email to other users" value={settings.hide_email} onChange={(v) => update("hide_email", v)} />
                <Toggle label="Hide phone" description="Don't show your phone number to other users" value={settings.hide_phone} onChange={(v) => update("hide_phone", v)} />

                <SectionDivider />
                <SectionHeader title="Messaging" />
                <Select label="Allow DMs from" value={settings.allow_dms_from} onChange={(v) => update("allow_dms_from", v)} options={[
                  { value: "everyone", label: "Everyone" },
                  { value: "box_members", label: "Box members only" },
                  { value: "none", label: "Nobody" },
                ]} />
                <Toggle label="Allow friend requests" value={settings.allow_friend_requests} onChange={(v) => update("allow_friend_requests", v)} />
                <Toggle label="Allow message requests" description="Let non-contacts send you messages" value={settings.allow_message_requests} onChange={(v) => update("allow_message_requests", v)} />
                <Toggle label="Block invites" description="Don't receive workspace invites" value={settings.block_invites} onChange={(v) => update("block_invites", v)} />

                <SectionDivider />
                <SectionHeader title="Data sharing" />
                <Toggle label="Allow read receipts" description="Let others know when you've read messages" value={settings.allow_read_receipts} onChange={(v) => update("allow_read_receipts", v)} />
                <Toggle label="Allow typing indicator" description="Let others see when you're typing" value={settings.allow_typing_indicator} onChange={(v) => update("allow_typing_indicator", v)} />
              </>
            )}

            {/* ── ACCESSIBILITY ── */}
            {activeSection === "accessibility" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Accessibility</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Make Chatterbox work better for you.
                </p>

                <Toggle label="Screen reader optimized" description="Improve compatibility with screen readers" value={settings.screen_reader_optimized} onChange={(v) => update("screen_reader_optimized", v)} />
                <Toggle label="Keyboard navigation" description="Enhanced keyboard navigation support" value={settings.keyboard_navigation} onChange={(v) => update("keyboard_navigation", v)} />
                <Toggle label="Focus indicators" description="Show clear outlines on focused elements" value={settings.focus_indicators} onChange={(v) => update("focus_indicators", v)} />
                <Toggle label="Captions" description="Enable closed captions in calls" value={settings.caption_enabled} onChange={(v) => update("caption_enabled", v)} />
                <Toggle label="Dyslexia-friendly font" description="Use OpenDyslexic font throughout the app" value={settings.dyslexia_font} onChange={(v) => update("dyslexia_font", v)} />
                <Toggle label="Underline links" description="Always underline clickable links" value={settings.underline_links} onChange={(v) => update("underline_links", v)} />
                <Select label="Text spacing" value={settings.text_spacing} onChange={(v) => update("text_spacing", v)} options={[
                  { value: "default", label: "Default" },
                  { value: "wide", label: "Wide" },
                  { value: "wider", label: "Wider" },
                ]} />
                <Select label="Color saturation" value={settings.saturation} onChange={(v) => update("saturation", v)} options={[
                  { value: "low", label: "Low" },
                  { value: "default", label: "Default" },
                  { value: "high", label: "High" },
                ]} />
              </>
            )}

            {/* ── LANGUAGE & REGION ── */}
            {activeSection === "language" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Language & Region</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Localization and formatting preferences.
                </p>

                <Select label="Language" value={settings.language} onChange={(v) => update("language", v)} options={[
                  { value: "en", label: "English" },
                  { value: "es", label: "Espa\u00f1ol" },
                  { value: "fr", label: "Fran\u00e7ais" },
                  { value: "de", label: "Deutsch" },
                  { value: "pt", label: "Portugu\u00eas" },
                  { value: "ja", label: "\u65e5\u672c\u8a9e" },
                  { value: "ko", label: "\ud55c\uad6d\uc5b4" },
                  { value: "zh", label: "\u4e2d\u6587" },
                  { value: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
                  { value: "hi", label: "\u0939\u093f\u0928\u094d\u0926\u0940" },
                  { value: "ru", label: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "sv", label: "Svenska" },
                  { value: "pl", label: "Polski" },
                  { value: "tr", label: "T\u00fcrk\u00e7e" },
                ]} />
                <TextInput label="Timezone" value={settings.timezone} onChange={(v) => update("timezone", v)} placeholder="UTC" />
                <Select label="Date format" value={settings.date_format} onChange={(v) => update("date_format", v)} options={[
                  { value: "MMM d, yyyy", label: "Jan 1, 2025" },
                  { value: "d MMM yyyy", label: "1 Jan 2025" },
                  { value: "yyyy-MM-dd", label: "2025-01-01" },
                  { value: "MM/dd/yyyy", label: "01/01/2025" },
                  { value: "dd/MM/yyyy", label: "01/01/2025 (DD/MM)" },
                ]} />
                <Select label="Time format" value={settings.time_format} onChange={(v) => update("time_format", v)} options={[
                  { value: "h:mm a", label: "1:30 PM" },
                  { value: "HH:mm", label: "13:30" },
                ]} />
                <Select label="First day of week" value={settings.first_day_of_week} onChange={(v) => update("first_day_of_week", v)} options={[
                  { value: "sunday", label: "Sunday" },
                  { value: "monday", label: "Monday" },
                  { value: "saturday", label: "Saturday" },
                ]} />
                <TextInput label="Number format" value={settings.number_format} onChange={(v) => update("number_format", v)} placeholder="en-US" />
                <TextInput label="Spellcheck language" value={settings.spell_check_language} onChange={(v) => update("spell_check_language", v)} placeholder="en" />
                <Toggle label="Translate messages" description="Auto-translate messages in other languages" value={settings.translate_messages} onChange={(v) => update("translate_messages", v)} />
                <Toggle label="Auto-detect language" description="Detect the language of incoming messages" value={settings.auto_detect_language} onChange={(v) => update("auto_detect_language", v)} />
              </>
            )}

            {/* ── AUDIO & VIDEO ── */}
            {activeSection === "audio_video" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Audio & Video</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Configure your call and media settings.
                </p>

                <SectionHeader title="Devices" />
                <TextInput label="Default microphone" value={settings.default_mic} onChange={(v) => update("default_mic", v)} placeholder="System default" />
                <TextInput label="Default speaker" value={settings.default_speaker} onChange={(v) => update("default_speaker", v)} placeholder="System default" />
                <TextInput label="Default camera" value={settings.default_camera} onChange={(v) => update("default_camera", v)} placeholder="System default" />

                <SectionDivider />
                <SectionHeader title="Audio" />
                <Toggle label="Auto-adjust microphone" description="Automatically adjust input volume" value={settings.auto_adjust_mic} onChange={(v) => update("auto_adjust_mic", v)} />
                <Toggle label="Noise suppression" description="Reduce background noise during calls" value={settings.noise_suppression} onChange={(v) => update("noise_suppression", v)} />
                <Toggle label="Echo cancellation" value={settings.echo_cancellation} onChange={(v) => update("echo_cancellation", v)} />
                <Toggle label="Auto gain control" value={settings.auto_gain_control} onChange={(v) => update("auto_gain_control", v)} />
                <Select label="Call ringtone" value={settings.call_ringtone} onChange={(v) => update("call_ringtone", v)} options={[
                  { value: "default", label: "Default" },
                  { value: "classic", label: "Classic" },
                  { value: "digital", label: "Digital" },
                  { value: "none", label: "None" },
                ]} />

                <SectionDivider />
                <SectionHeader title="Video" />
                <Toggle label="Mirror camera" description="Flip your video preview horizontally" value={settings.camera_mirror} onChange={(v) => update("camera_mirror", v)} />
                <Toggle label="HD video" description="Use high-definition video when available" value={settings.camera_hd} onChange={(v) => update("camera_hd", v)} />
                <Toggle label="Blur background" description="Blur your background in video calls" value={settings.blur_background} onChange={(v) => update("blur_background", v)} />

                <SectionDivider />
                <SectionHeader title="Call defaults" />
                <Toggle label="Start calls muted" value={settings.start_calls_muted} onChange={(v) => update("start_calls_muted", v)} />
                <Toggle label="Start calls with camera off" value={settings.start_calls_camera_off} onChange={(v) => update("start_calls_camera_off", v)} />
                <Toggle label="Auto-join audio" description="Automatically connect to call audio" value={settings.auto_join_audio} onChange={(v) => update("auto_join_audio", v)} />
              </>
            )}

            {/* ── ADVANCED ── */}
            {activeSection === "advanced" && (
              <>
                <h2 className="mb-1 text-[20px] font-bold text-white">Advanced</h2>
                <p className="mb-6 text-[13px] text-[#555]">
                  Power user settings and developer tools.
                </p>

                <SectionHeader title="Developer" />
                <Toggle label="Developer mode" description="Enable developer tools and extra logging" value={settings.developer_mode} onChange={(v) => update("developer_mode", v)} />
                <Toggle label="Debug logging" description="Log detailed debug info to the console" value={settings.debug_logging} onChange={(v) => update("debug_logging", v)} />
                <Toggle label="Experimental features" description="Try new features before they're released" value={settings.experimental_features} onChange={(v) => update("experimental_features", v)} />

                <SectionDivider />
                <SectionHeader title="Performance" />
                <Toggle label="Hardware acceleration" description="Use GPU for rendering (may cause issues on some systems)" value={settings.hardware_acceleration} onChange={(v) => update("hardware_acceleration", v)} />
                <Toggle label="Data saver mode" description="Reduce data usage by compressing media" value={settings.data_saver_mode} onChange={(v) => update("data_saver_mode", v)} />
                <Toggle label="Preload media" description="Pre-download images and files for faster viewing" value={settings.preload_media} onChange={(v) => update("preload_media", v)} />
                <Slider label="Cache size" description="Maximum local cache size" value={settings.cache_size_mb} onChange={(v) => update("cache_size_mb", v)} min={100} max={2000} step={100} suffix=" MB" />

                <SectionDivider />
                <SectionHeader title="Logging & Updates" />
                <Toggle label="Auto-update" description="Automatically install updates" value={settings.auto_update} onChange={(v) => update("auto_update", v)} />
                <Toggle label="Crash reports" description="Send anonymous crash reports to improve Chatterbox" value={settings.crash_reports} onChange={(v) => update("crash_reports", v)} />
                <Toggle label="Usage analytics" description="Share anonymous usage data" value={settings.usage_analytics} onChange={(v) => update("usage_analytics", v)} />
                <Slider label="Log retention" description="Days to keep local logs" value={settings.log_retention_days} onChange={(v) => update("log_retention_days", v)} min={1} max={90} suffix=" days" />

                <SectionDivider />
                <SectionHeader title="Shortcuts & Startup" />
                <Toggle label="Keyboard shortcuts" description="Enable global keyboard shortcuts" value={settings.keyboard_shortcuts_enabled} onChange={(v) => update("keyboard_shortcuts_enabled", v)} />
                <Select label="Startup page" value={settings.startup_page} onChange={(v) => update("startup_page", v)} options={[
                  { value: "dashboard", label: "Dashboard" },
                  { value: "last_visited", label: "Last visited page" },
                  { value: "specific_box", label: "Specific Box" },
                ]} />

                <SectionDivider />
                <SectionHeader title="Custom CSS" />
                <TextArea label="Custom CSS" description="Inject custom CSS styles (advanced users only)" value={settings.custom_css} onChange={(v) => update("custom_css", v)} placeholder=".my-class { color: red; }" rows={5} />
              </>
            )}

            {/* Bottom spacer + footer */}
            <div className="mt-12 border-t border-[#1a1a1a] pt-6 pb-10">
              <div className="flex items-center justify-between text-[12px] text-[#333]">
                <span>Chatterbox v1.0.0</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => { navigator.clipboard.writeText(user.id); }} className="transition-colors hover:text-[#555]">
                    Copy user ID
                  </button>
                  <span className="text-[#1a1a1a]">·</span>
                  <Link href="/dashboard" className="transition-colors hover:text-[#555]">
                    Back to dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
