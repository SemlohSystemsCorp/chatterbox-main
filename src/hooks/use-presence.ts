"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  user_id: string;
  status: "online" | "away";
  last_seen: string;
}

/**
 * Tracks online presence for a set of users in a shared room.
 * Uses Supabase Realtime Presence — ephemeral, no DB writes.
 * Also updates the user's profile.status on connect/disconnect.
 */
export function usePresence(
  roomKey: string,
  userId: string,
  userName: string
) {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceState>>(
    new Map()
  );
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel(`presence-${roomKey}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const map = new Map<string, PresenceState>();
        for (const [key, presences] of Object.entries(state)) {
          if (presences.length > 0) {
            map.set(key, presences[0] as PresenceState);
          }
        }
        setOnlineUsers(map);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            user_name: userName,
            status: "online",
            last_seen: new Date().toISOString(),
          });

          // Update profile status to online
          supabase
            .from("profiles")
            .update({ status: "online" })
            .eq("id", userId)
            .then(() => {}, () => {});
        }
      });

    channelRef.current = channel;

    // Handle visibility changes for away detection
    function handleVisibility() {
      if (!channelRef.current) return;
      if (document.visibilityState === "hidden") {
        channelRef.current.track({
          user_id: userId,
          user_name: userName,
          status: "away",
          last_seen: new Date().toISOString(),
        });
      } else {
        channelRef.current.track({
          user_id: userId,
          user_name: userName,
          status: "online",
          last_seen: new Date().toISOString(),
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    // Set offline on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      supabase
        .from("profiles")
        .update({ status: "offline" })
        .eq("id", userId)
        .then(() => {}, () => {});
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomKey, userId, userName]);

  function isOnline(uid: string) {
    return onlineUsers.has(uid);
  }

  function getStatus(uid: string): "online" | "away" | "offline" {
    const p = onlineUsers.get(uid);
    if (!p) return "offline";
    return p.status;
  }

  return { onlineUsers, isOnline, getStatus };
}
