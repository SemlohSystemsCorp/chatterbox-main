import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/contacts/nickname?contact_user_id=xxx — get one nickname
// GET /api/contacts/nickname — get all nicknames for the current user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contactUserId = request.nextUrl.searchParams.get("contact_user_id");

  if (contactUserId) {
    const { data } = await supabase
      .from("contact_nicknames")
      .select("nickname")
      .eq("user_id", user.id)
      .eq("contact_user_id", contactUserId)
      .single();

    return NextResponse.json({ nickname: data?.nickname || null });
  }

  // Return all nicknames as a map
  const { data } = await supabase
    .from("contact_nicknames")
    .select("contact_user_id, nickname")
    .eq("user_id", user.id);

  const nicknames: Record<string, string> = {};
  for (const row of data ?? []) {
    nicknames[row.contact_user_id] = row.nickname;
  }

  return NextResponse.json({ nicknames });
}

// PUT /api/contacts/nickname — set or update a nickname
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { contact_user_id, nickname } = body;

  if (!contact_user_id) {
    return NextResponse.json({ error: "contact_user_id is required" }, { status: 400 });
  }

  // If nickname is empty/null, delete it
  if (!nickname || !nickname.trim()) {
    await supabase
      .from("contact_nicknames")
      .delete()
      .eq("user_id", user.id)
      .eq("contact_user_id", contact_user_id);

    return NextResponse.json({ nickname: null });
  }

  const { data, error } = await supabase
    .from("contact_nicknames")
    .upsert(
      {
        user_id: user.id,
        contact_user_id,
        nickname: nickname.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,contact_user_id" }
    )
    .select("nickname")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ nickname: data.nickname });
}
