"use client";

import { useState, useRef } from "react";
import { DeviceCameraIcon as Camera, XIcon as X } from "@primer/octicons-react";
import { useSettingsStore } from "@/stores/settings-store";

interface ProfilePanelProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export function ProfilePanel({ user }: ProfilePanelProps) {
  const settings = useSettingsStore((s) => s.settings);
  const saveToServer = useSettingsStore((s) => s.saveToServer);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatar_url);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) setAvatarUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function handleSave(key: string, value: string) {
    saveToServer({ [key]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-[560px] px-6 py-8">
        <h2 className="text-[18px] font-bold text-white">My Profile</h2>
        <p className="mt-1 text-[13px] text-[#555]">
          Edit how others see you
        </p>

        {/* Avatar */}
        <div className="mt-6 flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a] text-[20px] font-bold text-white">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-[#222] text-[#888] transition-colors hover:bg-[#333] hover:text-white disabled:opacity-50"
              title="Upload avatar"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white">{user.fullName || user.email}</p>
            <p className="text-[12px] text-[#555]">{user.email}</p>
            {avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="mt-1 text-[11px] text-[#555] transition-colors hover:text-[#de1135]"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="mt-8 space-y-4">
          <ProfileField
            label="Display name"
            value={settings.display_name}
            placeholder={user.fullName}
            onSave={(v) => handleSave("display_name", v)}
          />
          <ProfileField
            label="Bio"
            value={settings.bio}
            placeholder="Tell people about yourself"
            onSave={(v) => handleSave("bio", v)}
            multiline
          />
          <ProfileField
            label="Pronouns"
            value={settings.pronouns}
            placeholder="e.g. they/them"
            onSave={(v) => handleSave("pronouns", v)}
          />
          <ProfileField
            label="Location"
            value={settings.location}
            placeholder="City, Country"
            onSave={(v) => handleSave("location", v)}
          />
          <ProfileField
            label="Company"
            value={settings.company}
            placeholder="Where you work"
            onSave={(v) => handleSave("company", v)}
          />
          <ProfileField
            label="Job title"
            value={settings.job_title}
            placeholder="What you do"
            onSave={(v) => handleSave("job_title", v)}
          />
          <ProfileField
            label="Website"
            value={settings.website}
            placeholder="https://example.com"
            onSave={(v) => handleSave("website", v)}
          />
        </div>

        {saved && (
          <div className="mt-4 text-[12px] text-[#22c55e]">Saved!</div>
        )}
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  placeholder,
  onSave,
  multiline,
}: {
  label: string;
  value: string;
  placeholder: string;
  onSave: (value: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  function handleBlur() {
    if (localValue !== value) {
      onSave(localValue);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      setEditing(false);
    }
  }

  if (editing) {
    const InputTag = multiline ? "textarea" : "input";
    return (
      <div>
        <label className="mb-[6px] block text-[12px] font-medium text-[#888]">{label}</label>
        <InputTag
          autoFocus
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={multiline ? 3 : undefined}
          className="w-full rounded-[8px] border-2 border-white bg-[#1a1a1a] px-3 py-2 text-[14px] text-white placeholder:text-[#555] focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-[6px] block text-[12px] font-medium text-[#888]">{label}</label>
      <button
        onClick={() => {
          setLocalValue(value);
          setEditing(true);
        }}
        className="w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-2 text-left text-[14px] transition-colors hover:border-[#333]"
      >
        <span className={value ? "text-white" : "text-[#555]"}>
          {value || placeholder}
        </span>
      </button>
    </div>
  );
}
