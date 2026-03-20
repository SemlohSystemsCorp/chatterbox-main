import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { participant_ids, name } = await request.json();

  if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length < 2) {
    return NextResponse.json(
      { error: "At least 2 other participants are required" },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin;

  // Verify all participant IDs exist
  const { data: validProfiles } = await admin
    .from("profiles")
    .select("id")
    .in("id", participant_ids);

  const validIds = new Set((validProfiles ?? []).map((p) => p.id));
  const invalidIds = participant_ids.filter((id: string) => !validIds.has(id));

  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: "Some participant IDs are invalid" },
      { status: 400 }
    );
  }

  // Create the group conversation
  const { data: conversation, error: convoError } = await admin
    .from("conversations")
    .insert({
      is_group: true,
      name: name?.trim() || null,
    })
    .select("id, short_id")
    .single();

  if (convoError) {
    return NextResponse.json({ error: convoError.message }, { status: 500 });
  }

  // Add all participants (including the creator)
  const allParticipantIds = [user.id, ...participant_ids.filter((id: string) => id !== user.id)];

  const { error: partError } = await admin
    .from("conversation_participants")
    .insert(
      allParticipantIds.map((uid: string) => ({
        conversation_id: conversation.id,
        user_id: uid,
      }))
    );

  if (partError) {
    return NextResponse.json({ error: partError.message }, { status: 500 });
  }

  return NextResponse.json({ id: conversation.id, short_id: conversation.short_id });
}
