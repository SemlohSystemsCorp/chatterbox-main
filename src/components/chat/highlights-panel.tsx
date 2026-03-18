"use client";

import { useState, useEffect } from "react";
import { XIcon as X, LoopIcon as Loader2, AlertFillIcon as AlertTriangle, CheckboxIcon as CheckSquare, QuestionIcon as HelpCircle, MentionIcon as AtSign, StarIcon as Star, ZapIcon as Zap, NoteIcon as Newspaper } from "@primer/octicons-react";
import { Markdown } from "@/components/ui/markdown";

interface Highlight {
  category: string;
  summary: string;
  sender_name: string;
}

interface HighlightsPanelProps {
  channelId: string;
  channelName: string;
  since: string | null;
  unreadCount: number;
  onDismiss: () => void;
  onMarkAllRead: () => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: typeof AlertTriangle; color: string; label: string }
> = {
  DECISION: {
    icon: AlertTriangle,
    color: "text-[#f59e0b]",
    label: "Decision",
  },
  ACTION_ITEM: {
    icon: CheckSquare,
    color: "text-[#22c55e]",
    label: "Action Item",
  },
  QUESTION: {
    icon: HelpCircle,
    color: "text-[#3b82f6]",
    label: "Question",
  },
  MENTION: { icon: AtSign, color: "text-[#a855f7]", label: "Mention" },
  IMPORTANT: { icon: Star, color: "text-[#ef4444]", label: "Important" },
};

export function HighlightsPanel({
  channelId,
  channelName,
  since,
  unreadCount,
  onDismiss,
  onMarkAllRead,
}: HighlightsPanelProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  // Digest state
  const [digestContent, setDigestContent] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [showDigest, setShowDigest] = useState(false);

  useEffect(() => {
    if (unreadCount < 5) {
      setShow(false);
      return;
    }

    // If user has never read this channel, fall back to 24h ago
    const sinceDate =
      since ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    setLoading(true);
    setShow(true);

    fetch("/api/ai/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_id: channelId, since: sinceDate }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.highlights && data.highlights.length > 0) {
          setHighlights(data.highlights);
        } else {
          setShow(false);
        }
      })
      .catch(() => setShow(false))
      .finally(() => setLoading(false));
  }, [channelId, since, unreadCount]);

  function handleGenerateDigest() {
    setShowDigest(true);
    setDigestLoading(true);
    setDigestContent(null);

    const sinceDate =
      since ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    fetch("/api/ai/digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_id: channelId, since: sinceDate }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDigestContent(data.digest ?? "No messages to summarize.");
      })
      .catch(() => {
        setDigestContent("Failed to generate digest. Please try again.");
      })
      .finally(() => setDigestLoading(false));
  }

  if (!show) return null;

  return (
    <div className="border-b border-[#1a1a1a] bg-[#0d0d0d] px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#f59e0b]" />
          <span className="text-[13px] font-semibold text-white">
            Catch up — {unreadCount} unread messages
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!showDigest && (
            <button
              onClick={handleGenerateDigest}
              className="flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11px] text-[#f59e0b] transition-colors hover:bg-[#1a1a1a] hover:text-[#fbbf24]"
            >
              <Newspaper className="h-3 w-3" />
              Get digest
            </button>
          )}
          <button
            onClick={() => {
              onMarkAllRead();
              onDismiss();
            }}
            className="rounded-[6px] px-2 py-1 text-[11px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            Mark all read
          </button>
          <button
            onClick={onDismiss}
            className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            title="Close highlights"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#555]" />
          <span className="text-[12px] text-[#555]">
            Analyzing unread messages...
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {highlights.map((h, i) => {
            const config = CATEGORY_CONFIG[h.category] ?? {
              icon: Star,
              color: "text-[#888]",
              label: h.category,
            };
            const Icon = config.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-[6px] bg-[#111] px-3 py-2"
              >
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-[#444]">
                      {h.sender_name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-[18px] text-[#999]">
                    {h.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Catch-up digest section */}
      {showDigest && (
        <div className="mt-3 rounded-[8px] border border-[#1a1a1a] bg-[#111]">
          <div className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-2">
            <div className="flex items-center gap-2">
              <Newspaper className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span className="text-[12px] font-semibold text-white">
                Catch-up digest — #{channelName}
              </span>
            </div>
            <button
              onClick={() => setShowDigest(false)}
              className="flex h-5 w-5 items-center justify-center rounded text-[#555] transition-colors hover:text-white"
              title="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="max-h-[300px] overflow-auto px-3 py-2.5">
            {digestLoading ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#555]" />
                <span className="text-[12px] text-[#555]">
                  Generating catch-up digest...
                </span>
              </div>
            ) : (
              <Markdown className="text-[12px] leading-[20px]">
                {digestContent ?? ""}
              </Markdown>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
