import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, username, status, status_message, created_at")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch user_settings for extended profile fields
  const { data: settings } = await supabase
    .from("user_settings")
    .select("display_name, bio, pronouns, phone, location, website, birthday, company, job_title, timezone, hide_email, hide_phone")
    .eq("user_id", userId)
    .single();

  const isOwnProfile = user.id === userId;

  return NextResponse.json({
    profile: {
      ...profile,
      // Use display_name from settings if set, otherwise fall back to full_name
      display_name: settings?.display_name || "",
      bio: settings?.bio || "",
      pronouns: settings?.pronouns || "",
      phone: (!settings?.hide_phone || isOwnProfile) ? (settings?.phone || "") : "",
      location: settings?.location || "",
      website: settings?.website || "",
      birthday: settings?.birthday || "",
      company: settings?.company || "",
      job_title: settings?.job_title || "",
      timezone: settings?.timezone || "",
      // Respect privacy: hide email from others if setting is on
      email: (!settings?.hide_email || isOwnProfile) ? profile.email : "",
    },
  });
}
