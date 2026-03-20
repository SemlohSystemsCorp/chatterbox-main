import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deleteDailyRoom } from "@/lib/daily";
import { NextResponse, type NextRequest } from "next/server";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { call_id } = body;

  if (!call_id) {
    return NextResponse.json({ error: "call_id required" }, { status: 400 });
  }

  // Use admin client to bypass RLS — any participant can end a call
  const { data: call } = await supabaseAdmin
    .from("calls")
    .select("id, room_name, started_by, started_at, channel_id, conversation_id")
    .eq("id", call_id)
    .is("ended_at", null)
    .single();

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  // Verify the caller is actually a participant
  const { data: participant } = await supabaseAdmin
    .from("call_participants")
    .select("id")
    .eq("call_id", call_id)
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // Mark the user as having left
  await supabaseAdmin
    .from("call_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("call_id", call_id)
    .eq("user_id", user.id)
    .is("left_at", null);

  // Check if any participants are still in the call
  const { count } = await supabaseAdmin
    .from("call_participants")
    .select("id", { count: "exact", head: true })
    .eq("call_id", call_id)
    .is("left_at", null);

  // If no one left, end the call (atomic: only update if not already ended)
  if (!count || count === 0) {
    const now = new Date();
    const { data: endedCall, error: endError } = await supabaseAdmin
      .from("calls")
      .update({ ended_at: now.toISOString() })
      .eq("id", call_id)
      .is("ended_at", null)
      .select("id")
      .maybeSingle();

    // Another request already ended this call
    if (endError || !endedCall) {
      return NextResponse.json({ ended: true });
    }

    // Insert channel event for call ended
    const duration = formatDuration(
      now.getTime() - new Date(call.started_at).getTime()
    );
    if (call.channel_id) {
      await supabaseAdmin.from("channel_events").insert({
        channel_id: call.channel_id,
        actor_id: call.started_by,
        type: "call_ended",
        metadata: { call_id: call_id, duration },
      });
    }

    try {
      await deleteDailyRoom(call.room_name);
    } catch {
      // Room may have already expired
    }

    // Clean up participants (keep call record — ended_at marks it as done)
    await supabaseAdmin
      .from("call_participants")
      .delete()
      .eq("call_id", call_id);
  }

  return NextResponse.json({ ended: !count || count === 0 });
}
