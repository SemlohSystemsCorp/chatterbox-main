import type { Metadata } from "next";
import {
  getAuthUser,
  getUserBoxes,
  getBoxByShortId,
  getBoxChannels,
  getChannelByShortId,
  getBoxMembers,
  getUnreadCountsForUser,
  getReadCursorsForChannel,
  getChannelMembers,
  isUserChannelMember,
  getUserConversations,
} from "@/lib/data";
import { redirect } from "next/navigation";
import { ChannelPageClient } from "./channel-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boxId: string; channelId: string }>;
}): Promise<Metadata> {
  const { boxId, channelId } = await params;
  const { supabase, user } = await getAuthUser();
  const box = await getBoxByShortId(supabase, boxId, user.id);
  if (!box) return { title: "Channel" };
  const channel = await getChannelByShortId(supabase, box.id, channelId);
  return {
    title: channel ? `#${channel.name} · ${box.name}` : box.name,
  };
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ boxId: string; channelId: string }>;
}) {
  const { boxId, channelId } = await params;
  const { supabase, user } = await getAuthUser();

  const box = await getBoxByShortId(supabase, boxId, user.id);
  if (!box) {
    redirect("/dashboard");
  }

  const channel = await getChannelByShortId(supabase, box.id, channelId);
  if (!channel) {
    redirect(`/box/${boxId}`);
  }

  // Private channel access check — only channel members and box admins/owners
  if (channel.is_private) {
    const isAdmin = box.role === "owner" || box.role === "admin";
    if (!isAdmin) {
      const isMember = await isUserChannelMember(supabase, channel.id, user.id);
      if (!isMember) {
        redirect(`/box/${boxId}`);
      }
    }
  }

  const [boxes, channels, members, channelMembers, conversations] = await Promise.all([
    getUserBoxes(supabase, user.id),
    getBoxChannels(supabase, box.id),
    getBoxMembers(box.id),
    getChannelMembers(supabase, channel.id),
    getUserConversations(supabase, user.id),
  ]);

  // Fetch read cursors, unread counts, active call, all box calls, and channel events in parallel
  const channelIds = channels.map((c) => c.id);
  const [readCursors, unreadCounts, activeCallResult, allBoxCallsResult, channelEventsResult] = await Promise.all([
    getReadCursorsForChannel(supabase, channel.id),
    getUnreadCountsForUser(supabase, user.id, channelIds),
    supabase
      .from("calls")
      .select("id, room_name, started_by, started_at")
      .eq("channel_id", channel.id)
      .is("ended_at", null)
      .maybeSingle(),
    channelIds.length > 0
      ? supabase
          .from("calls")
          .select("id, channel_id, conversation_id, started_by, started_at")
          .in("channel_id", channelIds)
          .is("ended_at", null)
      : Promise.resolve({ data: [] }),
    supabase
      .from("channel_events")
      .select("id, channel_id, actor_id, type, metadata, created_at")
      .eq("channel_id", channel.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const activeCall = activeCallResult.data;
  const channelEvents = channelEventsResult.data?.reverse() ?? [];

  // Build sidebar calls with channel names and starter names
  const activeCalls = (allBoxCallsResult.data ?? []).map((c) => {
    const ch = channels.find((ch) => ch.id === c.channel_id);
    const member = members.find((m) => m.user_id === c.started_by);
    return {
      ...c,
      channel_name: ch?.name,
      starter_name: member?.full_name || member?.email,
    };
  });

  // Check if Zoom is connected for this workspace
  const { data: zoomIntegration } = await supabase
    .from("integrations")
    .select("id")
    .eq("name", "zoom")
    .maybeSingle();

  let zoomConnected = false;
  if (zoomIntegration) {
    const { data: zoomWi } = await supabase
      .from("workspace_integrations")
      .select("id")
      .eq("workspace_id", box.id)
      .eq("integration_id", zoomIntegration.id)
      .eq("enabled", true)
      .maybeSingle();
    zoomConnected = !!zoomWi;
  }

  // Fetch the 50 most recent messages (descending to get newest, then reverse)
  const { data: rawMessages } = await supabase
    .from("messages")
    .select("id, content, created_at, edited_at, sender_id, parent_message_id, profiles:sender_id(id, full_name, email, avatar_url, username)")
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const messages = rawMessages?.reverse() ?? [];

  // Fetch reactions for these messages
  const messageIds = messages.map((m) => m.id);
  const { data: reactions } = messageIds.length > 0
    ? await supabase
        .from("reactions")
        .select("message_id, emoji, user_id")
        .in("message_id", messageIds)
    : { data: [] };

  const reactionsByMessage = (reactions ?? []).reduce<Record<string, { emoji: string; user_id: string }[]>>(
    (acc, r) => {
      if (!acc[r.message_id]) acc[r.message_id] = [];
      acc[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
      return acc;
    },
    {}
  );

  return (
    <ChannelPageClient
      key={channel.id}
      user={user}
      boxes={boxes}
      box={box}
      channel={channel}
      channels={channels}
      members={members}
      channelMembers={channelMembers}
      conversations={conversations}
      unreadCounts={unreadCounts}
      initialReadCursors={readCursors}
      activeCall={activeCall}
      activeCalls={activeCalls}
      zoomConnected={zoomConnected}
      initialEvents={channelEvents}
      initialMessages={
        messages.map((m) => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          edited_at: m.edited_at,
          sender_id: m.sender_id,
          parent_message_id: m.parent_message_id,
          reactions: reactionsByMessage[m.id] ?? [],
          sender: m.profiles as unknown as {
            id: string;
            full_name: string;
            email: string;
            avatar_url: string | null;
            username: string;
          },
        }))
      }
    />
  );
}
