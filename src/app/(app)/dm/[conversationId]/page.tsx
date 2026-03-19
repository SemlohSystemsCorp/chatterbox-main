import type { Metadata } from "next";
import {
  getAuthUser,
  getUserBoxes,
  getConversationByShortId,
  getBoxByShortId,
  getBoxChannels,
  getBoxMembers,
  getReadCursorsForConversation,
  getUserConversations,
} from "@/lib/data";
import { redirect } from "next/navigation";
import { DmPageClient } from "./dm-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}): Promise<Metadata> {
  const { conversationId } = await params;
  const { supabase, user } = await getAuthUser();
  const conversation = await getConversationByShortId(supabase, conversationId, user.id);
  if (!conversation) return { title: "Message" };
  const others = conversation.participants.filter(
    (p: { user_id: string }) => p.user_id !== user.id
  );
  const name = others.length > 0
    ? others.map((p: { full_name: string; email: string }) => p.full_name || p.email).join(", ")
    : "Message";
  return { title: name };
}

export default async function DmPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ box?: string }>;
}) {
  const { conversationId } = await params;
  const { box: boxShortId } = await searchParams;
  const { supabase, user } = await getAuthUser();

  const conversation = await getConversationByShortId(
    supabase,
    conversationId,
    user.id
  );
  if (!conversation) {
    redirect("/dashboard");
  }

  const [boxes, conversations] = await Promise.all([
    getUserBoxes(supabase, user.id),
    getUserConversations(supabase, user.id),
  ]);

  // If a box context is provided, load that box's channels and members for the sidebar
  let box = null;
  let channels: Awaited<ReturnType<typeof getBoxChannels>> = [];
  let members: Awaited<ReturnType<typeof getBoxMembers>> = [];

  if (boxShortId) {
    box = await getBoxByShortId(supabase, boxShortId, user.id);
    if (box) {
      [channels, members] = await Promise.all([
        getBoxChannels(supabase, box.id),
        getBoxMembers(box.id),
      ]);
    }
  }

  // Fetch read cursors, active call, and all box calls in parallel
  const channelIds = channels.map((c) => c.id);
  const [readCursors, activeCallResult, allBoxCallsResult] = await Promise.all([
    getReadCursorsForConversation(supabase, conversation.id),
    supabase
      .from("calls")
      .select("id, room_name, started_by, started_at")
      .eq("conversation_id", conversation.id)
      .is("ended_at", null)
      .maybeSingle(),
    channelIds.length > 0
      ? supabase
          .from("calls")
          .select("id, channel_id, conversation_id, started_by, started_at")
          .in("channel_id", channelIds)
          .is("ended_at", null)
      : Promise.resolve({ data: [] }),
  ]);
  const activeCall = activeCallResult.data;

  const activeCalls = (allBoxCallsResult.data ?? []).map((c) => {
    const ch = channels.find((ch) => ch.id === c.channel_id);
    const member = members.find((m) => m.user_id === c.started_by);
    return {
      ...c,
      channel_name: ch?.name,
      starter_name: member?.full_name || member?.email,
    };
  });

  // Fetch the 50 most recent messages (descending to get newest, then reverse)
  const { data: rawMessages } = await supabase
    .from("messages")
    .select(
      "id, content, created_at, edited_at, sender_id, parent_message_id, profiles:sender_id(id, full_name, email, avatar_url, username)"
    )
    .eq("conversation_id", conversation.id)
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
    <DmPageClient
      key={conversation.id}
      user={user}
      boxes={boxes}
      box={box}
      channels={channels}
      members={members}
      conversation={conversation}
      conversations={conversations}
      activeCall={activeCall}
      activeCalls={activeCalls}
      initialReadCursors={readCursors}
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
