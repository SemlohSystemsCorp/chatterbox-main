import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ banned: false });
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
    user.id
  );

  if (!authUser?.user) {
    return NextResponse.json({ banned: false });
  }

  const bannedUntil = authUser.user.banned_until;
  const isBanned =
    bannedUntil &&
    bannedUntil !== "1970-01-01T00:00:00Z" &&
    new Date(bannedUntil) > new Date();

  const meta = authUser.user.user_metadata as Record<string, unknown> | undefined;

  return NextResponse.json({
    banned: !!isBanned,
    ban_reason: meta?.ban_reason ? String(meta.ban_reason) : null,
    banned_until: isBanned ? String(bannedUntil) : null,
  });
}
