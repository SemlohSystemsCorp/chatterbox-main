"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BellIcon as Bell, ChecklistIcon as CheckCheck, XIcon as X, MentionIcon as AtSign, CommentDiscussionIcon as MessageSquare, ReplyIcon as Reply, SmileyIcon as Smile, MailIcon as Mail, PinIcon as Pin, SparklesFillIcon as Sparkles, ArrowLeftIcon as ArrowLeft } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initNotifications, showPushNotification } from "@/lib/notifications";
import type { Notification } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bg: string }
> = {
  mention: { icon: AtSign, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" },
  dm: { icon: MessageSquare, color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" },
  reply: { icon: Reply, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
  reaction: { icon: Smile, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  invite: { icon: Mail, color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10" },
  pin: { icon: Pin, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
};

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summaryView, setSummaryView] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=30");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + register SW + request permission
  useEffect(() => {
    fetchNotifications();
    initNotifications();

    // Listen for SW navigation messages (when user clicks a desktop notification)
    function handleSwMessage(event: MessageEvent) {
      if (event.data?.type === "NAVIGATE" && event.data.url) {
        router.push(event.data.url);
      }
    }
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, [fetchNotifications, router]);

  // Subscribe to realtime notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 30));
          setUnreadCount((prev) => prev + 1);

          // Show desktop notification with navigation URL
          const url = getNotificationUrl(newNotif);
          showPushNotification({
            title: newNotif.title,
            body: newNotif.body,
            type: newNotif.type,
            tag: `notif-${newNotif.id}`,
            url,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(ids: string[]) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_ids: ids }),
    });
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - ids.length));
  }

  async function summarizeNotifications() {
    setSummaryView(true);
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/ai/notifications-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setSummary(data.summary || "Couldn't generate a summary.");
    } catch {
      setSummary("Something went wrong. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleNotificationClick(n: Notification) {
    // Mark as read
    if (!n.read) markRead([n.id]);

    // Navigate to the notification context
    const url = getNotificationUrl(n);
    if (url) {
      setOpen(false);
      router.push(url);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Tooltip label="Notifications" side="bottom">
        <button
          onClick={() => {
            setOpen(!open);
            if (!open) fetchNotifications();
          }}
          className="relative flex h-8 w-8 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#de1135] px-1 text-[10px] font-bold tabular-nums text-white shadow-[0_0_0_2px_#0a0a0a]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
            <div className="flex items-center gap-2">
              {summaryView && (
                <button
                  onClick={() => setSummaryView(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                  title="Back to notifications"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="text-[14px] font-semibold text-white">
                {summaryView ? "AI Summary" : "Notifications"}
              </span>
              {!summaryView && unreadCount > 0 && (
                <span className="rounded-full bg-[#de1135]/10 px-2 py-0.5 text-[11px] font-medium text-[#de1135]">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!summaryView && notifications.length > 0 && (
                <button
                  onClick={summarizeNotifications}
                  className="flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                  title="Summarize with AI"
                >
                  <Sparkles className="h-3 w-3" />
                  Summarize
                </button>
              )}
              {!summaryView && unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  Read all
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  setSummaryView(false);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* AI Summary view */}
          {summaryView ? (
            <div className="max-h-[440px] overflow-auto px-4 py-4">
              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#276ef1]/10">
                    <Sparkles className="h-5 w-5 text-[#276ef1]" />
                  </div>
                  <p className="text-[13px] font-medium text-[#888]">
                    Summarizing notifications...
                  </p>
                  <Spinner size="sm" className="mt-2 text-[#555]" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#276ef1]" />
                    <span className="text-[11px] text-[#555]">
                      Powered by Chatterbox AI
                    </span>
                  </div>
                  <div className="rounded-[8px] border border-[#1a1a1a] bg-[#0f0f0f] p-3 text-[13px] leading-[20px] text-[#ccc] whitespace-pre-wrap [&_strong]:text-white [&_strong]:font-semibold">
                    {summary}
                  </div>
                </div>
              )}
            </div>
          ) : (
          /* Notifications list */
          <div className="max-h-[440px] overflow-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="sm" className="text-[#555]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a]">
                  <Bell className="h-5 w-5 text-[#333]" />
                </div>
                <p className="text-[13px] font-medium text-[#555]">
                  All caught up
                </p>
                <p className="mt-0.5 text-[11px] text-[#333]">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = TYPE_CONFIG[n.type] ?? {
                  icon: Bell,
                  color: "text-[#555]",
                  bg: "bg-[#1a1a1a]",
                };
                const Icon = config.icon;

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1a1a1a]/60 ${
                      !n.read ? "bg-[#1a1a1a]/30" : ""
                    }`}
                  >
                    {/* Avatar or icon */}
                    <div className="relative mt-0.5 shrink-0">
                      {n.actor?.avatar_url ? (
                        <img
                          src={n.actor.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${config.bg}`}
                        >
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                      )}
                      {/* Type badge on avatar */}
                      {n.actor?.avatar_url && (
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#111] ${config.bg}`}
                        >
                          <Icon className={`h-2 w-2 ${config.color}`} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-[13px] leading-[18px] ${
                            n.read ? "text-[#888]" : "font-medium text-white"
                          }`}
                        >
                          {n.title}
                        </p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="text-[10px] tabular-nums text-[#444]">
                            {timeAgo(n.created_at)}
                          </span>
                          {!n.read && (
                            <div className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
                          )}
                        </div>
                      </div>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-1 text-[12px] text-[#555]">
                          {n.body}
                        </p>
                      )}
                      {n.actor && (
                        <span className="mt-0.5 block text-[11px] text-[#444]">
                          {n.actor.full_name || n.actor.email}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──

/** Build a URL to navigate to based on notification context */
function getNotificationUrl(n: Notification): string | undefined {
  // DM notifications
  if (n.conversation_id) {
    return `/dm/${n.conversation_id}`;
  }
  // Channel notifications (box_id here is the box short_id passed by the sender)
  if (n.box_id && n.channel_id) {
    return `/box/${n.box_id}`;
  }
  // Box-level notification
  if (n.box_id) {
    return `/box/${n.box_id}`;
  }
  return undefined;
}
