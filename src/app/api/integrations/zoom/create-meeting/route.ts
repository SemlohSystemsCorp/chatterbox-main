import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken, createZoomMeeting } from "@/lib/zoom";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { workspace_id, channel_id, conversation_id, topic } = body;

  if (!workspace_id) {
    return NextResponse.json(
      { error: "workspace_id is required" },
      { status: 400 }
    );
  }

  if (!channel_id && !conversation_id) {
    return NextResponse.json(
      { error: "channel_id or conversation_id required" },
      { status: 400 }
    );
  }

  // Verify user is a member of this workspace
  const { data: membership } = await supabase
    .from("box_members")
    .select("role")
    .eq("box_id", workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "Not a workspace member" },
      { status: 403 }
    );
  }

  // Get the Zoom integration for this workspace
  const { data: integration } = await supabase
    .from("integrations")
    .select("id")
    .eq("name", "zoom")
    .single();

  if (!integration) {
    return NextResponse.json(
      { error: "Zoom integration not found" },
      { status: 404 }
    );
  }

  const { data: workspaceIntegration } = await supabase
    .from("workspace_integrations")
    .select("*")
    .eq("workspace_id", workspace_id)
    .eq("integration_id", integration.id)
    .eq("enabled", true)
    .maybeSingle();

  if (!workspaceIntegration) {
    return NextResponse.json(
      { error: "Zoom is not connected for this workspace" },
      { status: 404 }
    );
  }

  try {
    // Get a valid access token (auto-refreshes if expired)
    const tokenResult = await getValidAccessToken({
      access_token_encrypted: workspaceIntegration.access_token_encrypted!,
      refresh_token_encrypted: workspaceIntegration.refresh_token_encrypted!,
      token_expires_at: workspaceIntegration.token_expires_at,
    });

    // If token was refreshed, update the stored tokens
    if (tokenResult.refreshed) {
      await supabase
        .from("workspace_integrations")
        .update({
          access_token_encrypted: tokenResult.newAccessTokenEncrypted,
          refresh_token_encrypted: tokenResult.newRefreshTokenEncrypted,
          token_expires_at: tokenResult.newExpiresAt!.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspaceIntegration.id);
    }

    // Create the Zoom meeting
    const meeting = await createZoomMeeting(tokenResult.accessToken, {
      topic: topic || "Chatterbox Meeting",
      duration: 60,
    });

    // Save meeting record
    const { data: meetingRecord } = await supabase
      .from("zoom_meetings")
      .insert({
        workspace_id,
        channel_id: channel_id || null,
        conversation_id: conversation_id || null,
        created_by: user.id,
        zoom_meeting_id: String(meeting.id),
        join_url: meeting.join_url,
        topic: meeting.topic,
        duration: meeting.duration,
      })
      .select("id")
      .single();

    return NextResponse.json(
      {
        meeting_id: meeting.id,
        join_url: meeting.join_url,
        topic: meeting.topic,
        record_id: meetingRecord?.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Zoom create meeting error:", err);
    return NextResponse.json(
      { error: "Failed to create Zoom meeting" },
      { status: 500 }
    );
  }
}
