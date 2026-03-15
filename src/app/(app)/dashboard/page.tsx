import type { Metadata } from "next";
import { getAuthUser, getUserBoxes } from "@/lib/data";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { supabase, user } = await getAuthUser();
  const boxes = await getUserBoxes(supabase, user.id);

  // Fetch channel and member counts per box in parallel
  const boxIds = boxes.map((b) => b.id);
  const [channelCounts, memberCounts] = await Promise.all([
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
  ]);

  const boxStats: Record<string, { channels: number; members: number }> = {};
  for (const b of boxes) {
    boxStats[b.id] = {
      channels: channelCounts[b.id] ?? 0,
      members: memberCounts[b.id] ?? 0,
    };
  }

  return <DashboardClient user={user} boxes={boxes} boxStats={boxStats} />;
}
