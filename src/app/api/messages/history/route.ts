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

  const { searchParams } = request.nextUrl;
  const channelId = searchParams.get("channel_id");
  const conversationId = searchParams.get("conversation_id");
  const before = searchParams.get("before"); // ISO timestamp cursor
  const parsedLimit = Number(searchParams.get("limit") || 50);
  const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 100);

  if (!channelId && !conversationId) {
    return NextResponse.json(
      { error: "channel_id or conversation_id required" },
      { status: 400 }
    );
  }

  if (!before) {
    return NextResponse.json(
      { error: "before timestamp required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("messages")
    .select(
      "id, content, created_at, edited_at, sender_id, parent_message_id, profiles:sender_id(id, full_name, email, avatar_url, username)"
    )
    .lt("created_at", before)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (channelId) {
    query = query.eq("channel_id", channelId);
  } else {
    query = query.eq("conversation_id", conversationId!);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reverse to chronological order
  const messages = (data ?? []).reverse().map((m) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    edited_at: m.edited_at,
    sender_id: m.sender_id,
    parent_message_id: m.parent_message_id,
    sender: m.profiles as unknown as {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
      username: string;
    },
  }));

  return NextResponse.json({ messages, hasMore: messages.length === limit });
}
