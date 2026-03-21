import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// List chats for a user in a box
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const boxId = searchParams.get("box_id");
  const mode = searchParams.get("mode") || "workspace";

  let query = supabase
    .from("sherlock_chats")
    .select("id, title, mode, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("mode", mode)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (boxId) {
    query = query.eq("box_id", boxId);
  } else {
    query = query.is("box_id", null);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

// Create a new chat
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { box_id, mode, title } = await request.json();

  const { data, error } = await supabase
    .from("sherlock_chats")
    .insert({
      user_id: user.id,
      box_id: mode === "general" ? null : box_id,
      mode: mode || "workspace",
      title: title || "New chat",
    })
    .select("id, title, mode, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
