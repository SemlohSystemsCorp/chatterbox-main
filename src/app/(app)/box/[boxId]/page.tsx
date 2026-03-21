import type { Metadata } from "next";
import { getAuthUser, getUserBoxes, getBoxByShortId, getBoxChannels, getBoxMembers, getUnreadCountsForUser } from "@/lib/data";
import { redirect } from "next/navigation";
import { BoxPageClient } from "./box-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boxId: string }>;
}): Promise<Metadata> {
  const { boxId } = await params;
  const { supabase, user } = await getAuthUser();
  const box = await getBoxByShortId(supabase, boxId, user.id);
  return {
    title: box ? box.name : "Box",
  };
}

export default async function BoxPage({
  params,
}: {
  params: Promise<{ boxId: string }>;
}) {
  const { boxId } = await params;
  const { supabase, user } = await getAuthUser();

  const box = await getBoxByShortId(supabase, boxId, user.id);
  if (!box) {
    redirect("/dashboard");
  }

  const [boxes, channels, members] = await Promise.all([
    getUserBoxes(supabase, user.id),
    getBoxChannels(supabase, box.id),
    getBoxMembers(box.id),
  ]);

  const channelIds = channels.map((c) => c.id);

  // Fetch active calls, user channel memberships, and recent messages in parallel
  const [callsResult, membershipsResult, recentMsgsResult] = await Promise.all([
    channelIds.length > 0
      ? supabase
          .from("calls")
          .select("id, channel_id, conversation_id, started_by, started_at")
          .in("channel_id", channelIds)
          .is("ended_at", null)
      : { data: [] },
    channelIds.length > 0
      ? supabase
          .from("channel_members")
          .select("channel_id")
          .eq("user_id", user.id)
          .in("channel_id", channelIds)
      : { data: [] },
    channelIds.length > 0
      ? supabase
          .from("messages")
          .select("id, channel_id, content, sender_id, created_at")
          .in("channel_id", channelIds)
          .is("parent_message_id", null)
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [] },
  ]);

  const activeCalls = (callsResult.data ?? []).map((c) => {
    const ch = channels.find((ch) => ch.id === c.channel_id);
    const member = members.find((m) => m.user_id === c.started_by);
    return {
      ...c,
      channel_name: ch?.name,
      starter_name: member?.full_name || member?.email,
    };
  });

  // Compute channel unread counts
  const userChannelIds = (membershipsResult.data ?? []).map((m: { channel_id: string }) => m.channel_id);
  const channelUnreads = await getUnreadCountsForUser(supabase, user.id, userChannelIds);

  // Build recent activity from messages
  const recentActivity = (recentMsgsResult.data ?? []).map((msg) => {
    const channel = channels.find((c) => c.id === msg.channel_id);
    const member = members.find((m) => m.user_id === msg.sender_id);
    return {
      id: msg.id,
      channelName: channel?.name ?? "unknown",
      channelShortId: channel?.short_id ?? "",
      senderName: member?.full_name || member?.email || "Unknown",
      senderAvatarUrl: member?.avatar_url ?? null,
      content: msg.content,
      createdAt: msg.created_at,
    };
  });

  return (
    <BoxPageClient
      user={user}
      boxes={boxes}
      box={box}
      channels={channels}
      members={members}
      activeCalls={activeCalls}
      channelUnreads={channelUnreads}
      recentActivity={recentActivity}
    />
  );
}
