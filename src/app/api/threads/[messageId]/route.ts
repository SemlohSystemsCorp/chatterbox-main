import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const before = searchParams.get("before");
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 50, 1),
    100
  );

  // Get total count of replies for this thread
  const { count: total } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("parent_message_id", messageId);

  // Build query for replies
  let query = supabase
    .from("messages")
    .select(
      `
      id,
      content,
      created_at,
      edited_at,
      sender_id,
      parent_message_id,
      reactions:reactions(emoji, user_id),
      sender:profiles!sender_id(id, full_name, email, avatar_url, username)
    `
    )
    .eq("parent_message_id", messageId)
    .order("created_at", { ascending: true })
    .limit(limit + 1);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: replies, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasMore = (replies?.length ?? 0) > limit;
  const trimmed = hasMore ? replies!.slice(0, limit) : (replies ?? []);

  return NextResponse.json({
    replies: trimmed,
    total: total ?? 0,
    hasMore,
  });
}
