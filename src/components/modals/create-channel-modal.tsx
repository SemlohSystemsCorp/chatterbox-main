"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { XIcon as X, HashIcon as Hash, LockIcon as Lock } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  boxId: string;
  boxShortId: string;
}

export function CreateChannelModal({
  open,
  onClose,
  boxId,
  boxShortId,
}: CreateChannelModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setIsPrivate(false);
      setError("");
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          box_id: boxId,
          name: slug || name.trim(),
          description: description.trim() || null,
          is_private: isPrivate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create channel");
        setLoading(false);
        return;
      }

      onClose();
      router.push(`/box/${boxShortId}/c/${data.channel.short_id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[440px] rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <h2 className="text-[16px] font-bold text-white">Create Channel</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4">
          <div className="space-y-4">
            {/* Channel type toggle */}
            <div>
              <label className="mb-[6px] block text-[14px] font-medium text-white">
                Channel type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex flex-1 items-center gap-2 rounded-[8px] border-2 px-3 py-2.5 text-left transition-colors ${
                    !isPrivate
                      ? "border-white bg-[#1a1a1a]"
                      : "border-transparent bg-[#0f0f0f] hover:bg-[#141414]"
                  }`}
                >
                  <Hash className={`h-4 w-4 ${!isPrivate ? "text-white" : "text-[#555]"}`} />
                  <div>
                    <div className={`text-[13px] font-medium ${!isPrivate ? "text-white" : "text-[#888]"}`}>
                      Public
                    </div>
                    <div className="text-[11px] text-[#555]">Anyone in the Box</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex flex-1 items-center gap-2 rounded-[8px] border-2 px-3 py-2.5 text-left transition-colors ${
                    isPrivate
                      ? "border-white bg-[#1a1a1a]"
                      : "border-transparent bg-[#0f0f0f] hover:bg-[#141414]"
                  }`}
                >
                  <Lock className={`h-4 w-4 ${isPrivate ? "text-white" : "text-[#555]"}`} />
                  <div>
                    <div className={`text-[13px] font-medium ${isPrivate ? "text-white" : "text-[#888]"}`}>
                      Private
                    </div>
                    <div className="text-[11px] text-[#555]">Invite only</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Name */}
            <Input
              ref={nameRef}
              id="channel-name"
              label="Channel name"
              placeholder="e.g. design, marketing, random"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error || undefined}
            />

            {slug && slug !== name.trim().toLowerCase() && (
              <div className="rounded-[8px] bg-[#0a0a0a] px-3 py-1.5">
                <span className="text-[12px] text-[#555]">
                  Will be created as{" "}
                  <span className="font-medium text-[#888]">#{slug}</span>
                </span>
              </div>
            )}

            {/* Description */}
            <div>
              <label
                htmlFor="channel-desc"
                className="mb-[6px] block text-[14px] font-medium text-white"
              >
                Description{" "}
                <span className="font-normal text-[#555]">(optional)</span>
              </label>
              <textarea
                id="channel-desc"
                placeholder="What is this channel about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="flex w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-[10px] text-[14px] text-white placeholder:text-[#666] focus:border-white focus:bg-[#222] focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={loading}
              disabled={!name.trim()}
            >
              Create Channel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
