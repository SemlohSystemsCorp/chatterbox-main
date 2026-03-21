"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon as X, PlusIcon as Plus, GrabberIcon as GripVertical, TrashIcon as Trash2 } from "@primer/octicons-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
  channelId?: string;
  conversationId?: string;
}

const DURATION_OPTIONS = [
  { label: "No limit", value: 0 },
  { label: "5 minutes", value: 5 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "24 hours", value: 1440 },
  { label: "1 week", value: 10080 },
];

export function CreatePollModal({
  open,
  onClose,
  channelId,
  conversationId,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowsMultiple, setAllowsMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuestion("");
      setOptions(["", ""]);
      setAllowsMultiple(false);
      setIsAnonymous(false);
      setDuration(0);
      setError("");
      setDragIdx(null);
      setDropIdx(null);
      setTimeout(() => questionRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  function addOption() {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  function handleDragStart(index: number) {
    setDragIdx(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDropIdx(index);
  }

  function handleDrop(index: number) {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setDropIdx(null);
      return;
    }
    const updated = [...options];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(index, 0, moved);
    setOptions(updated);
    setDragIdx(null);
    setDropIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDropIdx(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: validOptions,
          channel_id: channelId || undefined,
          conversation_id: conversationId || undefined,
          allows_multiple: allowsMultiple,
          is_anonymous: isAnonymous,
          expires_in_minutes: duration || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create poll");
        setLoading(false);
        return;
      }

      onClose();
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
      <div className="w-full max-w-[480px] rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <h2 className="text-[16px] font-bold text-white">Create Poll</h2>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4">
          <div className="space-y-4">
            {/* Question */}
            <div>
              <label className="mb-[6px] block text-[14px] font-medium text-white">
                Question
              </label>
              <input
                ref={questionRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What do you want to ask?"
                maxLength={200}
                className="w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-[10px] text-[14px] text-white placeholder:text-[#666] focus:border-white focus:bg-[#222] focus:outline-none"
              />
              <p className={`mt-1 text-right text-[11px] ${question.length >= 180 ? (question.length >= 195 ? "text-[#de1135]" : "text-amber-400") : "text-[#555]"}`}>
                {question.length}/200
              </p>
            </div>

            {/* Options */}
            <div>
              <label className="mb-[6px] block text-[14px] font-medium text-white">
                Options
              </label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={handleDragEnd}
                    className={`transition-opacity ${dragIdx === i ? "opacity-40" : dropIdx === i && dragIdx !== null ? "opacity-70" : "opacity-100"}`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-[#333]" />
                      <input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        maxLength={100}
                        className="flex-1 rounded-[6px] border-2 border-transparent bg-[#1a1a1a] px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:border-white focus:bg-[#222] focus:outline-none"
                      />
                      {options.length > 2 && (
                        <Tooltip label="Remove option">
                          <button
                            type="button"
                            onClick={() => removeOption(i)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-[#de1135]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                    <p className={`mt-0.5 text-right text-[11px] ${opt.length >= 85 ? (opt.length >= 95 ? "text-[#de1135]" : "text-amber-400") : "text-[#555]"}`}>
                      {opt.length}/100
                    </p>
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 flex items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[12px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </button>
              )}
            </div>

            {/* Settings */}
            <div className="space-y-2.5 rounded-[8px] bg-[#0a0a0a] p-3">
              <label className="flex items-center justify-between">
                <span className="text-[13px] text-[#888]">Allow multiple votes</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowsMultiple}
                  aria-label="Allow multiple votes"
                  onClick={() => setAllowsMultiple(!allowsMultiple)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${allowsMultiple ? "bg-white" : "bg-[#333]"}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                      allowsMultiple ? "left-[18px] bg-[#111]" : "left-0.5 bg-[#666]"
                    }`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-[13px] text-[#888]">Anonymous voting</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAnonymous}
                  aria-label="Anonymous voting"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${isAnonymous ? "bg-white" : "bg-[#333]"}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                      isAnonymous ? "left-[18px] bg-[#111]" : "left-0.5 bg-[#666]"
                    }`}
                  />
                </button>
              </label>
              <div>
                <span className="mb-1.5 block text-[13px] text-[#888]">Duration</span>
                <div className="flex flex-wrap gap-1">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                        duration === opt.value
                          ? "bg-white text-black"
                          : "bg-[#1a1a1a] text-[#888] hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-[#de1135]">{error}</p>
            )}
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
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
            >
              Create Poll
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
