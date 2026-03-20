import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// POST — mark a poll as ended and insert channel event
export async function POST(
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

  // Get poll + options + votes for results
  const { data: poll } = await supabase
    .from("polls")
    .select("id, question, channel_id, conversation_id, expires_at, creator_id")
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

  // Only fire event if it's actually expired
  if (!poll.expires_at || new Date(poll.expires_at) >= new Date()) {
    return NextResponse.json({ error: "Poll has not expired yet" }, { status: 400 });
  }

  // Insert channel event if this poll is in a channel
  if (poll.channel_id) {
    // Get vote results for the event
    const { data: options } = await supabase
      .from("poll_options")
      .select("id, label, position")
      .eq("poll_id", pollId)
      .order("position");

    const { data: votes } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", pollId);

    const voteCounts: Record<string, number> = {};
    for (const v of votes ?? []) {
      voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1;
    }

    const totalVotes = votes?.length ?? 0;
    const winner = options
      ?.map((o) => ({ label: o.label, count: voteCounts[o.id] || 0 }))
      .sort((a, b) => b.count - a.count)[0];

    // Check if event already exists for this poll
    const { data: existing } = await supabase
      .from("channel_events")
      .select("id")
      .eq("channel_id", poll.channel_id)
      .eq("type", "poll_ended")
      .contains("metadata", { poll_id: pollId })
      .maybeSingle();

    if (!existing) {
      await supabase.from("channel_events").insert({
        channel_id: poll.channel_id,
        actor_id: poll.creator_id,
        type: "poll_ended",
        metadata: {
          poll_id: pollId,
          question: poll.question,
          total_votes: totalVotes,
          winner_label: winner?.label ?? "",
          winner_count: winner?.count ?? 0,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
