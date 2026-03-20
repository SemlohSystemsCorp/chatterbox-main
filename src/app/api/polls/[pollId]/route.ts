import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// GET — fetch poll with options and votes
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: poll } = await supabase
    .from("polls")
    .select("id, question, allows_multiple, is_anonymous, expires_at, created_at, creator_id")
    .eq("id", pollId)
    .single();

  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  const { data: options } = await supabase
    .from("poll_options")
    .select("id, label, position")
    .eq("poll_id", pollId)
    .order("position");

  const { data: votes } = await supabase
    .from("poll_votes")
    .select("id, option_id, user_id")
    .eq("poll_id", pollId);

  return NextResponse.json({ poll, options: options ?? [], votes: votes ?? [] });
}

// POST — vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { option_id } = body as { option_id: string };

  if (!option_id) {
    return NextResponse.json({ error: "option_id required" }, { status: 400 });
  }

  // Check poll exists and not expired
  const { data: poll } = await supabase
    .from("polls")
    .select("id, allows_multiple, expires_at, channel_id, conversation_id")
    .eq("id", pollId)
    .single();

  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  // Verify user has access to the channel/conversation
  if (poll.channel_id) {
    const { data: ch } = await supabase
      .from("channels")
      .select("box_id")
      .eq("id", poll.channel_id)
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
  } else if (poll.conversation_id) {
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", poll.conversation_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return NextResponse.json({ error: "Poll has expired" }, { status: 400 });
  }

  // If not multiple choice, remove existing votes first
  if (!poll.allows_multiple) {
    await supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", user.id);
  }

  // Check if already voted for this option
  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("option_id", option_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Toggle off — remove vote
    await supabase.from("poll_votes").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  }

  // Cast vote
  const { error } = await supabase.from("poll_votes").insert({
    poll_id: pollId,
    option_id,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: "voted" });
}
