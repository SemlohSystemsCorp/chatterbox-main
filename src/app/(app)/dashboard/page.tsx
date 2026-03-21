import type { Metadata } from "next";
import { getAuthUser, getUserBoxes, getUserConversations, getUnreadCountsForUser, getUnreadCountsForConversations } from "@/lib/data";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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
  const [channelCounts, memberCounts, recentChannelsByBox, userChannelMemberships] = await Promise.all([
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
          .order("updated_at", { ascending: false })
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
    // Fetch user's channel memberships to compute per-box unread counts
    boxIds.length > 0
      ? supabase
          .from("channel_members")
          .select("channel_id, channels!inner(box_id)")
          .eq("user_id", user.id)
          .then(({ data }) => data ?? [])
      : Promise.resolve([] as { channel_id: string; channels: unknown }[]),
  ]);

  const boxStats: Record<string, { channels: number; members: number }> = {};
  for (const b of boxes) {
    boxStats[b.id] = {
      channels: channelCounts[b.id] ?? 0,
      members: memberCounts[b.id] ?? 0,
    };
  }

  // Compute per-box unread counts
  const channelsByBox: Record<string, string[]> = {};
  for (const m of userChannelMemberships) {
    const boxId = (m.channels as unknown as { box_id: string }).box_id;
    if (!channelsByBox[boxId]) channelsByBox[boxId] = [];
    channelsByBox[boxId].push(m.channel_id);
  }
  const allChannelIds = Object.values(channelsByBox).flat();
  const channelUnreads = await getUnreadCountsForUser(supabase, user.id, allChannelIds);

  const boxUnreadCounts: Record<string, number> = {};
  for (const [boxId, chIds] of Object.entries(channelsByBox)) {
    boxUnreadCounts[boxId] = chIds.reduce((sum, id) => sum + (channelUnreads[id] ?? 0), 0);
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

  // Compute DM unread counts + fetch last message previews
  const dmIds = recentDMs.map((d) => d.id);
  const [dmUnreadCounts, lastMsgData] = await Promise.all([
    getUnreadCountsForConversations(supabase, user.id, dmIds),
    dmIds.length > 0
      ? supabase
          .from("messages")
          .select("conversation_id, content, sender_id, created_at")
          .in("conversation_id", dmIds)
          .is("parent_message_id", null)
          .order("created_at", { ascending: false })
          .limit(50)
          .then(({ data }) => {
            const map: Record<string, { content: string; senderId: string }> = {};
            for (const msg of data ?? []) {
              if (msg.conversation_id && !map[msg.conversation_id]) {
                map[msg.conversation_id] = {
                  content: msg.content,
                  senderId: msg.sender_id,
                };
              }
            }
            return map;
          })
      : Promise.resolve({} as Record<string, { content: string; senderId: string }>),
  ]);

  // Use service role to bypass RLS — user isn't a member of invited boxes
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch pending invites for the user's email
  const { data: rawInvites } = await admin
    .from("invites")
    .select("code, role, box_id, created_by, expires_at, max_uses, uses")
    .eq("email", user.email.toLowerCase())
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  let pendingInvites: { code: string; boxName: string; boxIconUrl: string | null; role: string; inviterName: string | null; memberCount: number }[] = [];

  if (rawInvites && rawInvites.length > 0) {
    const validInvites = rawInvites.filter(
      (inv) => inv.max_uses === null || inv.uses < inv.max_uses
    );
    // Filter out boxes user already belongs to
    const newInvites = validInvites.filter((inv) => !boxIds.includes(inv.box_id));

    if (newInvites.length > 0) {
      const newBoxIds = [...new Set(newInvites.map((inv) => inv.box_id))];
      const [invBoxes, invMembers, inviters] = await Promise.all([
        admin.from("boxes").select("id, name, icon_url").in("id", newBoxIds),
        admin.from("box_members").select("box_id").in("box_id", newBoxIds),
        admin.from("profiles").select("id, full_name").in("id", [...new Set(newInvites.map((inv) => inv.created_by))]),
      ]);

      const boxMap = new Map((invBoxes.data ?? []).map((b) => [b.id, b]));
      const inviterMap = new Map((inviters.data ?? []).map((p) => [p.id, p.full_name]));
      const invMemberCounts: Record<string, number> = {};
      for (const row of invMembers.data ?? []) {
        invMemberCounts[row.box_id] = (invMemberCounts[row.box_id] ?? 0) + 1;
      }

      pendingInvites = newInvites.map((inv) => {
        const box = boxMap.get(inv.box_id);
        return {
          code: inv.code,
          boxName: box?.name ?? "Unknown",
          boxIconUrl: box?.icon_url ?? null,
          role: inv.role,
          inviterName: inviterMap.get(inv.created_by) ?? null,
          memberCount: invMemberCounts[inv.box_id] ?? 0,
        };
      });
    }
  }

  return (
    <DashboardClient
      user={user}
      boxes={boxes}
      boxStats={boxStats}
      recentChannels={recentChannelsByBox}
      recentDMs={recentDMs}
      pendingInvites={pendingInvites}
      boxUnreadCounts={boxUnreadCounts}
      dmUnreadCounts={dmUnreadCounts}
      lastMessages={lastMsgData}
    />
  );
}
