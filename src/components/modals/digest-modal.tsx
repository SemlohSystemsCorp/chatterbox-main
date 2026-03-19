"use client";

import { useState, useEffect } from "react";
import { XIcon as X, NoteIcon as Newspaper, LoopIcon as Loader2, SyncIcon as RefreshCw } from "@primer/octicons-react";
import { Markdown } from "@/components/ui/markdown";
import { Tooltip } from "@/components/ui/tooltip";

interface DigestModalProps {
  open: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
}

type Period = "daily" | "weekly";

export function DigestModal({
  open,
  onClose,
  channelId,
  channelName,
}: DigestModalProps) {
  const [period, setPeriod] = useState<Period>("daily");
  const [digest, setDigest] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function fetchDigest(p: Period) {
    setLoading(true);
    setDigest(null);
    try {
      const res = await fetch("/api/ai/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: channelId, period: p }),
      });
      const data = await res.json();
      setDigest(data.digest);
      setMessageCount(data.message_count ?? 0);
    } catch {
      setDigest("Failed to generate digest. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchDigest(period);
    }
  }, [open, channelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    fetchDigest(p);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[12vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-[#888]" />
            <span className="text-[14px] font-semibold text-white">
              Digest — #{channelName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip label="Refresh digest">
              <button
                onClick={() => fetchDigest(period)}
                disabled={loading}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </Tooltip>
            <Tooltip label="Close">
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex border-b border-[#1a1a1a]">
          {(["daily", "weekly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`flex-1 py-2 text-[12px] font-medium capitalize transition-colors ${
                period === p
                  ? "border-b-2 border-white text-white"
                  : "text-[#555] hover:text-[#888]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="h-4 w-4 animate-spin text-[#555]" />
              <span className="text-[13px] text-[#555]">
                Generating {period} digest...
              </span>
            </div>
          ) : digest === null ? (
            <div className="py-12 text-center">
              <Newspaper className="mx-auto mb-3 h-8 w-8 text-[#333]" />
              <p className="text-[13px] text-[#555]">
                No activity in the last {period === "daily" ? "24 hours" : "7 days"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 text-[11px] text-[#444]">
                {messageCount} messages in the last{" "}
                {period === "daily" ? "24 hours" : "7 days"}
              </div>
              <Markdown className="text-[13px] leading-[22px]">
                {digest}
              </Markdown>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
