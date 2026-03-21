import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get member count
  const { count: memberCount } = await supabase
    .from("channel_members")
    .select("*", { count: "exact", head: true })
    .eq("channel_id", channelId);

  // Get message count
  const { count: messageCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("channel_id", channelId);

  // Get channel info with creator
  const { data: channel } = await supabase
    .from("channels")
    .select("created_by")
    .eq("id", channelId)
    .single();

  let creatorName: string | null = null;
  if (channel?.created_by) {
    const { data: creator } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", channel.created_by)
      .single();
    creatorName = creator?.full_name || null;
  }

  return NextResponse.json({
    member_count: memberCount ?? 0,
    message_count: messageCount ?? 0,
    creator_name: creatorName,
  });
}
