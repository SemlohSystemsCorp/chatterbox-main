import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, encryptTokens } from "@/lib/zoom";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // workspace_id (box UUID)
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/dashboard?error=zoom_auth_denied`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard?error=zoom_missing_params`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Verify user is admin of this workspace
  const { data: membership } = await supabase
    .from("box_members")
    .select("role, boxes!inner(short_id)")
    .eq("box_id", state)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.redirect(
      `${appUrl}/dashboard?error=zoom_not_admin`
    );
  }

  const boxShortId = (membership.boxes as unknown as { short_id: string }).short_id;

  try {
    const redirectUri = `${appUrl}/api/integrations/zoom/oauth-callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const { accessTokenEncrypted, refreshTokenEncrypted, expiresAt } =
      encryptTokens(tokens);

    // Get the Zoom integration ID
    const { data: integration } = await supabase
      .from("integrations")
      .select("id")
      .eq("name", "zoom")
      .single();

    if (!integration) {
      return NextResponse.redirect(
        `${appUrl}/box/${boxShortId}/integrations/zoom?error=integration_not_found`
      );
    }

    // Upsert workspace integration (handles reconnection)
    const { error: upsertError } = await supabase.from("workspace_integrations").upsert(
      {
        workspace_id: state,
        integration_id: integration.id,
        enabled: true,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        token_expires_at: expiresAt.toISOString(),
        connected_by: user.id,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,integration_id" }
    );

    if (upsertError) {
      console.error("Zoom integration upsert failed:", upsertError);
      return NextResponse.redirect(
        `${appUrl}/box/${boxShortId}/integrations/zoom?error=zoom_save_failed`
      );
    }

    // Log the event
    await supabase.from("integration_events").insert({
      workspace_id: state,
      integration_id: integration.id,
      actor_id: user.id,
      event_type: "connected",
      metadata: {},
    });

    return NextResponse.redirect(
      `${appUrl}/box/${boxShortId}/integrations/zoom?success=connected`
    );
  } catch (err) {
    console.error("Zoom OAuth error:", err);
    return NextResponse.redirect(
      `${appUrl}/box/${boxShortId}/integrations/zoom?error=zoom_auth_failed`
    );
  }
}
