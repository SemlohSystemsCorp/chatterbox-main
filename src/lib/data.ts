import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export const getAuthUser = cache(async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch username and avatar from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string) ?? "",
      avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? null,
      username: profile?.username ?? user.email?.split("@")[0] ?? "",
      statusText: (profile as Record<string, unknown>)?.status_text as string | null ?? null,
      statusEmoji: (profile as Record<string, unknown>)?.status_emoji as string | null ?? null,
      statusExpiresAt: (profile as Record<string, unknown>)?.status_expires_at as string | null ?? null,
    },
  };
});

export async function getUserBoxes(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: memberships } = await supabase
    .from("box_members")
    .select("box_id, role, boxes(id, short_id, name, slug, icon_url, plan)")
    .eq("user_id", userId);

  return (
    memberships?.map((m) => ({
      ...(m.boxes as unknown as {
        id: string;
        short_id: string;
        name: string;
        slug: string;
        icon_url: string | null;
        plan: string;
      }),
      role: m.role as string,
    })) ?? []
  );
}

export async function getBoxByShortId(supabase: Awaited<ReturnType<typeof createClient>>, shortId: string, userId: string) {
  const { data: box } = await supabase
    .from("boxes")
    .select("id, short_id, name, slug, description, icon_url, owner_id, plan, created_at")
    .eq("short_id", shortId)
    .single();

  if (!box) return null;

  // Check membership
  const { data: membership } = await supabase
    .from("box_members")
    .select("role")
    .eq("box_id", box.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  return { ...box, role: membership.role as string };
}

export async function getBoxChannels(supabase: Awaited<ReturnType<typeof createClient>>, boxId: string) {
  const { data: channels } = await supabase
    .from("channels")
    .select("id, short_id, name, description, is_private, is_archived, created_at, updated_at")
    .eq("box_id", boxId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  return channels ?? [];
}

export async function getChannelByShortId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  boxId: string,
  channelShortId: string
) {
  const { data: channel } = await supabase
    .from("channels")
    .select("id, short_id, box_id, name, description, is_private, is_archived, created_by, created_at")
    .eq("box_id", boxId)
    .eq("short_id", channelShortId)
    .single();

  return channel ?? null;
}

export async function getChannelMembers(supabase: Awaited<ReturnType<typeof createClient>>, channelId: string) {
  const { data: members } = await supabase
    .from("channel_members")
    .select("id, user_id, added_at, profiles:user_id(id, full_name, email, avatar_url, username)")
    .eq("channel_id", channelId)
    .order("added_at", { ascending: true });

  const profile = (p: unknown) =>
    p as { id: string; full_name: string; email: string; avatar_url: string | null; username: string };

  return (
    members?.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      added_at: m.added_at,
      full_name: profile(m.profiles).full_name,
      email: profile(m.profiles).email,
      avatar_url: profile(m.profiles).avatar_url,
      username: profile(m.profiles).username || (profile(m.profiles).email || "").split("@")[0] || "user",
    })) ?? []
  );
}

export async function isUserChannelMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  channelId: string,
  userId: string
) {
  const { data } = await supabase
    .from("channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function getUserConversations(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // Get all conversation IDs the user participates in
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (!participations || participations.length === 0) return [];

  const convoIds = participations.map((p) => p.conversation_id);

  // Get conversations with short_id
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, short_id, is_group, name, created_at, updated_at")
    .in("id", convoIds)
    .order("updated_at", { ascending: false });

  if (!conversations) return [];

  // Get all participants for these conversations
  const { data: allParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, profiles(id, full_name, email, avatar_url)")
    .in("conversation_id", convoIds);

  const participantsByConvo = new Map<string, { user_id: string; full_name: string; email: string; avatar_url: string | null }[]>();
  for (const p of allParticipants ?? []) {
    const profile = p.profiles as unknown as { id: string; full_name: string; email: string; avatar_url: string | null };
    const list = participantsByConvo.get(p.conversation_id) ?? [];
    list.push({
      user_id: p.user_id,
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
    });
    participantsByConvo.set(p.conversation_id, list);
  }

  return conversations.map((c) => ({
    ...c,
    participants: participantsByConvo.get(c.id) ?? [],
  }));
}

export async function getConversationByShortId(supabase: Awaited<ReturnType<typeof createClient>>, shortId: string, userId: string) {
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, short_id, is_group, name, created_at, updated_at")
    .eq("short_id", shortId)
    .single();

  if (!conversation) return null;

  // Check user is a participant
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversation.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!participant) return null;

  // Get all participants with profiles
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id, profiles(id, full_name, email, avatar_url, username)")
    .eq("conversation_id", conversation.id);

  return {
    ...conversation,
    participants: (participants ?? []).map((p) => {
      const profile = p.profiles as unknown as { id: string; full_name: string; email: string; avatar_url: string | null; username: string };
      return {
        user_id: p.user_id,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        username: profile.username || (profile.email || "").split("@")[0] || "user",
      };
    }),
  };
}

export async function getReadCursorsForChannel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  channelId: string
) {
  const { data } = await supabase
    .from("read_cursors")
    .select("user_id, last_read_at")
    .eq("channel_id", channelId);

  return data ?? [];
}

export async function getReadCursorsForConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string
) {
  const { data } = await supabase
    .from("read_cursors")
    .select("user_id, last_read_at")
    .eq("conversation_id", conversationId);

  return data ?? [];
}

export async function getUnreadCountsForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  channelIds: string[]
) {
  if (channelIds.length === 0) return {} as Record<string, number>;

  const { data: cursors } = await supabase
    .from("read_cursors")
    .select("channel_id, last_read_at")
    .eq("user_id", userId)
    .in("channel_id", channelIds);

  const cursorMap = new Map(
    cursors?.map((c) => [c.channel_id, c.last_read_at]) ?? []
  );

  // Batch: fetch recent messages for all channels with cursors in one query
  const channelsWithCursors = channelIds.filter((id) => cursorMap.has(id));

  if (channelsWithCursors.length === 0) {
    return Object.fromEntries(channelIds.map((id) => [id, 0]));
  }

  // Use the oldest cursor as a lower bound to limit the query
  const oldestCursor = [...cursorMap.values()].sort()[0];
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("channel_id, created_at")
    .in("channel_id", channelsWithCursors)
    .gt("created_at", oldestCursor);

  const counts: Record<string, number> = {};
  for (const channelId of channelIds) {
    const lastRead = cursorMap.get(channelId);
    if (!lastRead) {
      counts[channelId] = 0;
      continue;
    }
    counts[channelId] = (recentMessages ?? []).filter(
      (m) => m.channel_id === channelId && m.created_at > lastRead
    ).length;
  }

  return counts;
}

export async function getUnreadCountsForConversations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conversationIds: string[]
) {
  if (conversationIds.length === 0) return {} as Record<string, number>;

  const { data: cursors } = await supabase
    .from("read_cursors")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId)
    .in("conversation_id", conversationIds);

  const cursorMap = new Map(
    cursors?.map((c) => [c.conversation_id, c.last_read_at]) ?? []
  );

  const convoWithCursors = conversationIds.filter((id) => cursorMap.has(id));

  if (convoWithCursors.length === 0) {
    return Object.fromEntries(conversationIds.map((id) => [id, 0]));
  }

  const oldestCursor = [...cursorMap.values()].sort()[0];
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("conversation_id, created_at")
    .in("conversation_id", convoWithCursors)
    .gt("created_at", oldestCursor);

  const counts: Record<string, number> = {};
  for (const convoId of conversationIds) {
    const lastRead = cursorMap.get(convoId);
    if (!lastRead) {
      counts[convoId] = 0;
      continue;
    }
    counts[convoId] = (recentMessages ?? []).filter(
      (m) => m.conversation_id === convoId && m.created_at > lastRead
    ).length;
  }

  return counts;
}

export async function getBoxMembers(boxId: string) {
  // Use admin client to bypass RLS — callers always verify box membership first
  const { data: members, error } = await supabaseAdmin
    .from("box_members")
    .select("id, user_id, role, joined_at, profiles(id, email, full_name, avatar_url, status, username, status_text, status_emoji, status_expires_at)")
    .eq("box_id", boxId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[getBoxMembers] error:", error.message, "boxId:", boxId);
    return [];
  }

  const profile = (p: unknown) =>
    p as { id: string; email: string; full_name: string; avatar_url: string | null; status: string; username: string; status_text: string | null; status_emoji: string | null; status_expires_at: string | null };

  return (
    members?.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      email: profile(m.profiles).email,
      full_name: profile(m.profiles).full_name,
      avatar_url: profile(m.profiles).avatar_url,
      status: profile(m.profiles).status,
      username: profile(m.profiles).username || (profile(m.profiles).email || "").split("@")[0] || "user",
      status_text: profile(m.profiles).status_text,
      status_emoji: profile(m.profiles).status_emoji,
      status_expires_at: profile(m.profiles).status_expires_at,
    })) ?? []
  );
}
