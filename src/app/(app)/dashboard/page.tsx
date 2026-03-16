import type { Metadata } from "next";
import { getAuthUser, getUserBoxes, getUserConversations } from "@/lib/data";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { supabase, user } = await getAuthUser();
  const [boxes, conversations] = await Promise.all([
    getUserBoxes(supabase, user.id),
    getUserConversations(supabase, user.id),
  ]);

  // Fetch channel counts, member counts, and recent channels per box in parallel
  const boxIds = boxes.map((b) => b.id);
  const [channelCounts, memberCounts, recentChannelsByBox] = await Promise.all([
    boxIds.length > 0
      ? supabase
          .from("channels")
          .select("box_id", { count: "exact", head: false })
          .in("box_id", boxIds)
          .eq("is_archived", false)
          .then(({ data }) => {
            const counts: Record<string, number> = {};
            for (const row of data ?? []) {
              counts[row.box_id] = (counts[row.box_id] ?? 0) + 1;
            }
            return counts;
          })
      : Promise.resolve({} as Record<string, number>),
    boxIds.length > 0
      ? supabase
          .from("box_members")
          .select("box_id")
          .in("box_id", boxIds)
          .then(({ data }) => {
            const counts: Record<string, number> = {};
            for (const row of data ?? []) {
              counts[row.box_id] = (counts[row.box_id] ?? 0) + 1;
            }
            return counts;
          })
      : Promise.resolve({} as Record<string, number>),
    boxIds.length > 0
      ? supabase
          .from("channels")
          .select("box_id, short_id, name")
          .in("box_id", boxIds)
          .eq("is_archived", false)
          .order("created_at", { ascending: true })
          .limit(50)
          .then(({ data }) => {
            const byBox: Record<string, { short_id: string; name: string }[]> = {};
            for (const row of data ?? []) {
              if (!byBox[row.box_id]) byBox[row.box_id] = [];
              if (byBox[row.box_id].length < 3) {
                byBox[row.box_id].push({ short_id: row.short_id, name: row.name });
              }
            }
            return byBox;
          })
      : Promise.resolve({} as Record<string, { short_id: string; name: string }[]>),
  ]);

  const boxStats: Record<string, { channels: number; members: number }> = {};
  for (const b of boxes) {
    boxStats[b.id] = {
      channels: channelCounts[b.id] ?? 0,
      members: memberCounts[b.id] ?? 0,
    };
  }

  // Take most recent DMs (up to 5)
  const recentDMs = conversations.slice(0, 5).map((c) => ({
    id: c.id,
    shortId: c.short_id,
    isGroup: c.is_group,
    name: c.name,
    updatedAt: c.updated_at,
    participants: c.participants,
  }));

  return (
    <DashboardClient
      user={user}
      boxes={boxes}
      boxStats={boxStats}
      recentChannels={recentChannelsByBox}
      recentDMs={recentDMs}
    />
  );
}
