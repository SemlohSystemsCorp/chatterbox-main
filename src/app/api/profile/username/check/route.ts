import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const USERNAME_RE = /^[a-zA-Z0-9._-]{2,30}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username || !USERNAME_RE.test(username)) {
    return NextResponse.json({ available: false });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase());

  // Exclude the current user's own username from the check
  if (user) {
    query = query.neq("id", user.id);
  }

  const { data: existing } = await query.maybeSingle();

  return NextResponse.json({ available: !existing });
}
