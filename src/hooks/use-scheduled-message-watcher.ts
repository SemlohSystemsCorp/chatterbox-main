"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Watches for pending scheduled messages and sends them at the exact scheduled time.
 * Uses client-side timeouts for realtime delivery. The edge function cron is a safety net.
 */
export function useScheduledMessageWatcher(userId: string) {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const supabase = createClient();

    async function sendMessage(id: string) {
      timers.current.delete(id);
      await fetch("/api/messages/schedule/send", { method: "POST" });
    }

    function scheduleTimer(id: string, scheduledFor: string) {
      // Clear existing timer for this message
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);

      const delay = new Date(scheduledFor).getTime() - Date.now();

      if (delay <= 0) {
        // Already due — send immediately
        sendMessage(id);
      } else {
        const timer = setTimeout(() => sendMessage(id), delay);
        timers.current.set(id, timer);
      }
    }

    // Fetch all pending scheduled messages on mount
    async function init() {
      const { data } = await supabase
        .from("scheduled_messages")
        .select("id, scheduled_for")
        .eq("sender_id", userId)
        .eq("status", "pending");

      if (data) {
        for (const msg of data) {
          scheduleTimer(msg.id, msg.scheduled_for);
        }
      }
    }

    init();

    // Subscribe to new scheduled messages in realtime
    const channel = supabase
      .channel("scheduled-messages-watcher")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scheduled_messages",
          filter: `sender_id=eq.${userId}`,
        },
        (payload) => {
          const msg = payload.new as { id: string; scheduled_for: string; status: string };
          if (msg.status === "pending") {
            scheduleTimer(msg.id, msg.scheduled_for);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "scheduled_messages",
          filter: `sender_id=eq.${userId}`,
        },
        (payload) => {
          const msg = payload.new as { id: string; status: string };
          // If cancelled or already sent, clear the timer
          if (msg.status !== "pending") {
            const existing = timers.current.get(msg.id);
            if (existing) {
              clearTimeout(existing);
              timers.current.delete(msg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      // Cleanup all timers
      for (const timer of timers.current.values()) {
        clearTimeout(timer);
      }
      timers.current.clear();
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
