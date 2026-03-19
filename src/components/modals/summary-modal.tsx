"use client";

import { useState, useEffect } from "react";
import { XIcon as X, SparklesFillIcon as Sparkles, LoopIcon as Loader2, SyncIcon as RefreshCw } from "@primer/octicons-react";
import { Markdown } from "@/components/ui/markdown";
import { Tooltip } from "@/components/ui/tooltip";

interface SummaryModalProps {
  open: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
}

export function SummaryModal({
  open,
  onClose,
  channelId,
  channelName,
}: SummaryModalProps) {
  const [summary, setSummary] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [timeRange, setTimeRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchSummary() {
    setLoading(true);
    setSummary("");
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: channelId }),
      });
      const data = await res.json();
      setSummary(data.summary ?? "");
      setMessageCount(data.message_count ?? 0);
      setTimeRange(data.time_range ?? null);
    } catch {
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchSummary();
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

  if (!open) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

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
            <Sparkles className="h-4 w-4 text-[#888]" />
            <span className="text-[14px] font-semibold text-white">
              Summary — #{channelName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip label="Refresh summary">
              <button
                onClick={fetchSummary}
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

        {/* Content */}
        <div className="max-h-[500px] overflow-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="h-4 w-4 animate-spin text-[#555]" />
              <span className="text-[13px] text-[#555]">
                Summarizing {channelName}...
              </span>
            </div>
          ) : (
            <>
              {timeRange && (
                <div className="mb-3 text-[11px] text-[#444]">
                  {messageCount} messages · {formatDate(timeRange.from)} —{" "}
                  {formatDate(timeRange.to)}
                </div>
              )}
              <Markdown className="text-[13px] leading-[22px]">
                {summary}
              </Markdown>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
