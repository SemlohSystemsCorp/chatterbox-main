import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { message_id, emoji } = body;

  if (!message_id || !emoji) {
    return NextResponse.json(
      { error: "message_id and emoji are required" },
      { status: 400 }
    );
  }

  // Validate emoji - must be either:
  // 1. A valid Unicode emoji (1-8 characters from emoji ranges)
  // 2. A shortcode like :thumbsup: (common in chat apps)
  const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,5}$/u;
  const SHORTCODE_REGEX = /^:[a-z0-9_+-]+:$/;

  if (!EMOJI_REGEX.test(emoji) && !SHORTCODE_REGEX.test(emoji)) {
    return NextResponse.json(
      { error: "Invalid emoji format" },
      { status: 400 }
    );
  }

  // Verify the user can access this message's channel or conversation
  const { data: message } = await supabase
    .from("messages")
    .select("channel_id, conversation_id")
    .eq("id", message_id)
    .single();

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.channel_id) {
    const { data: ch } = await supabase
      .from("channels")
      .select("box_id")
      .eq("id", message.channel_id)
      .single();
    if (ch) {
      const { data: membership } = await supabase
        .from("box_members")
        .select("id")
        .eq("box_id", ch.box_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  } else if (message.conversation_id) {
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", message.conversation_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Check if reaction already exists (toggle off)
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("message_id", message_id)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  }

  const { error } = await supabase.from("reactions").insert({
    message_id,
    user_id: user.id,
    emoji,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: "added" }, { status: 201 });
}
