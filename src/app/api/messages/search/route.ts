import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const boxId = request.nextUrl.searchParams.get("box_id");
  const fromUser = request.nextUrl.searchParams.get("from");
  const inChannel = request.nextUrl.searchParams.get("in");
  const before = request.nextUrl.searchParams.get("before");
  const hasFilter = request.nextUrl.searchParams.get("has");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Build tsquery from user input: split words and join with &
  const tsquery = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ");

  // Resolve `from:` filter — look up user by name/username
  let fromUserId: string | null = null;
  if (fromUser) {
    // Escape special LIKE characters to prevent pattern injection
    const safeFromUser = fromUser.replace(/[%_\\]/g, "\\$&");
    const { data: matchedProfiles } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.ilike.%${safeFromUser}%,full_name.ilike.%${safeFromUser}%`)
      .limit(1);
    if (matchedProfiles && matchedProfiles.length > 0) {
      fromUserId = matchedProfiles[0].id;
    } else {
      // No matching user — return empty
      return NextResponse.json({ results: [] });
    }
  }

  // Resolve `in:` filter — look up channel by name
  let inChannelId: string | null = null;
  if (inChannel) {
    const safeInChannel = inChannel.replace(/[%_\\]/g, "\\$&");
    let channelQuery = supabase
      .from("channels")
      .select("id")
      .ilike("name", `%${safeInChannel}%`)
      .limit(1);
    if (boxId) {
      channelQuery = channelQuery.eq("box_id", boxId);
    }
    const { data: matchedChannels } = await channelQuery;
    if (matchedChannels && matchedChannels.length > 0) {
      inChannelId = matchedChannels[0].id;
    } else {
      return NextResponse.json({ results: [] });
    }
  }

  // Search messages
  let query = supabase
    .from("messages")
    .select(
      "id, content, created_at, sender_id, channel_id, conversation_id, profiles:sender_id(id, full_name, email, avatar_url), channels:channel_id(id, short_id, name, box_id, boxes:box_id(short_id, name))"
    )
    .textSearch("content", tsquery)
    .order("created_at", { ascending: false })
    .limit(20);

  // Apply box filter
  if (boxId && !inChannelId) {
    const { data: boxChannels } = await supabase
      .from("channels")
      .select("id")
      .eq("box_id", boxId);

    if (boxChannels && boxChannels.length > 0) {
      query = query.in(
        "channel_id",
        boxChannels.map((c) => c.id)
      );
    } else {
      return NextResponse.json({ results: [] });
    }
  }

  // Apply from: filter
  if (fromUserId) {
    query = query.eq("sender_id", fromUserId);
  }

  // Apply in: filter
  if (inChannelId) {
    query = query.eq("channel_id", inChannelId);
  }

  // Apply before: filter
  if (before) {
    const beforeDate = new Date(before);
    if (!isNaN(beforeDate.getTime())) {
      query = query.lt("created_at", beforeDate.toISOString());
    }
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let results = (messages ?? []).map((m) => {
    const sender = m.profiles as unknown as {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
    const channel = m.channels as unknown as {
      id: string;
      short_id: string;
      name: string;
      box_id: string;
      boxes: { short_id: string; name: string };
    } | null;

    return {
      id: m.id,
      content: m.content,
      created_at: m.created_at,
      sender_id: m.sender_id,
      sender_name: sender?.full_name || sender?.email || "Unknown",
      sender_avatar_url: sender?.avatar_url ?? null,
      channel_id: m.channel_id,
      conversation_id: m.conversation_id,
      channel_name: channel?.name ?? null,
      channel_short_id: channel?.short_id ?? null,
      box_short_id: channel?.boxes?.short_id ?? null,
      box_name: channel?.boxes?.name ?? null,
    };
  });

  // Apply has: filter client-side
  if (hasFilter === "link") {
    const urlPattern = /https?:\/\/[^\s]+/;
    results = results.filter((r) => urlPattern.test(r.content));
  } else if (hasFilter === "image") {
    const imgPattern = /\.(png|jpg|jpeg|gif|webp|svg)/i;
    results = results.filter((r) => imgPattern.test(r.content));
  } else if (hasFilter === "file") {
    const filePattern = /\.(pdf|doc|docx|xls|xlsx|zip|tar|gz|csv|txt)/i;
    results = results.filter((r) => filePattern.test(r.content));
  }

  return NextResponse.json({ results });
}
