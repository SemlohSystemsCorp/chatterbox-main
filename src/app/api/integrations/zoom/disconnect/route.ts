import { createClient } from "@/lib/supabase/server";
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
  const { workspace_id } = body;

  if (!workspace_id) {
    return NextResponse.json(
      { error: "workspace_id is required" },
      { status: 400 }
    );
  }

  // Verify user is admin of this workspace
  const { data: membership } = await supabase
    .from("box_members")
    .select("role")
    .eq("box_id", workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Only workspace admins can disconnect integrations" },
      { status: 403 }
    );
  }

  // Get the Zoom integration ID
  const { data: integration } = await supabase
    .from("integrations")
    .select("id")
    .eq("name", "zoom")
    .single();

  if (!integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 }
    );
  }

  // Delete the workspace integration
  const { error } = await supabase
    .from("workspace_integrations")
    .delete()
    .eq("workspace_id", workspace_id)
    .eq("integration_id", integration.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }

  // Log the event
  await supabase.from("integration_events").insert({
    workspace_id,
    integration_id: integration.id,
    actor_id: user.id,
    event_type: "disconnected",
    metadata: {},
  });

  return NextResponse.json({ success: true });
}
