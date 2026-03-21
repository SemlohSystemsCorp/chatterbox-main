import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        // Check if another user already has this email (duplicate prevention)
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", user.email)
          .neq("id", user.id)
          .maybeSingle();

        if (existingProfile) {
          // Another account already uses this email — clean up and redirect
          await supabase.auth.signOut();
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          return NextResponse.redirect(
            `${origin}/login?error=email_exists`
          );
        }

        // Ensure a profile row exists for OAuth users
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          await supabaseAdmin.from("profiles").insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name ?? "",
            avatar_url: user.user_metadata?.avatar_url ?? null,
            username: user.email.split("@")[0],
          });

          // Mark new OAuth user as needing onboarding
          await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { onboarding_completed: false },
          });

          // Redirect to onboarding, preserving invite context if present
          const joinCodeMatch = next.match(/\/join\?code=([^&]+)/);
          const onboardingPath = joinCodeMatch
            ? `/onboarding?invite=${encodeURIComponent(joinCodeMatch[1])}`
            : "/onboarding";
          return NextResponse.redirect(`${origin}${onboardingPath}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
