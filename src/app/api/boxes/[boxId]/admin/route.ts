import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/boxes/[boxId]/admin — fetch admin dashboard data (stats, logs)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  const { boxId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin/owner
  const { data: membership } = await supabase
    .from("box_members")
    .select("role")
    .eq("box_id", boxId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const section = url.searchParams.get("section");

  // ── Stats ──
  if (section === "stats") {
    // Fetch channel IDs once to avoid repeated queries
    const { data: boxChannels } = await supabase
      .from("channels")
      .select("id")
      .eq("box_id", boxId);
    const channelIds = boxChannels?.map((c) => c.id) ?? [];

    const [
      { count: memberCount },
      { count: channelCount },
      { count: messageCount },
      { data: recentMessages },
      { data: memberGrowth },
    ] = await Promise.all([
      supabase
        .from("box_members")
        .select("*", { count: "exact", head: true })
        .eq("box_id", boxId),
      supabase
        .from("channels")
        .select("*", { count: "exact", head: true })
        .eq("box_id", boxId)
        .eq("is_archived", false),
      channelIds.length > 0
        ? supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("channel_id", channelIds)
        : Promise.resolve({ count: 0, data: null, error: null }),
      // Messages per day (last 14 days)
      channelIds.length > 0
        ? supabase
            .from("messages")
            .select("created_at, channel_id")
            .in("channel_id", channelIds)
            .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      // Member joins over time
      supabase
        .from("box_members")
        .select("joined_at")
        .eq("box_id", boxId)
        .order("joined_at", { ascending: true }),
    ]);

    // Aggregate messages by day
    const dailyMessages: Record<string, number> = {};
    for (const msg of recentMessages ?? []) {
      const day = msg.created_at.split("T")[0];
      dailyMessages[day] = (dailyMessages[day] || 0) + 1;
    }

    // Aggregate messages by channel
    const channelActivity: Record<string, number> = {};
    for (const msg of recentMessages ?? []) {
      channelActivity[msg.channel_id] = (channelActivity[msg.channel_id] || 0) + 1;
    }

    // Get channel names for the activity breakdown
    const { data: channels } = await supabase
      .from("channels")
      .select("id, name")
      .eq("box_id", boxId);

    const channelMap = new Map(channels?.map((c) => [c.id, c.name]) ?? []);
    const channelBreakdown = Object.entries(channelActivity)
      .map(([id, count]) => ({ name: channelMap.get(id) ?? "Unknown", count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      memberCount: memberCount ?? 0,
      channelCount: channelCount ?? 0,
      messageCount: messageCount ?? 0,
      dailyMessages,
      memberGrowth: memberGrowth ?? [],
      channelBreakdown,
    });
  }

  // ── Audit logs ──
  if (section === "logs") {
    const page = parseInt(url.searchParams.get("page") ?? "0");
    const limit = 50;

    const { data: logs, count } = await supabase
      .from("admin_audit_logs")
      .select("*, profiles:actor_id(full_name, email, avatar_url)", { count: "exact" })
      .eq("box_id", boxId)
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    return NextResponse.json({
      logs: logs ?? [],
      total: count ?? 0,
      page,
      hasMore: (count ?? 0) > (page + 1) * limit,
    });
  }

  return NextResponse.json({ error: "Invalid section parameter" }, { status: 400 });
}

// PATCH /api/boxes/[boxId]/admin — update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  const { boxId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify owner/admin
  const { data: membership } = await supabase
    .from("box_members")
    .select("role")
    .eq("box_id", boxId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;

  // ── Update member role ──
  if (action === "update_role") {
    const { memberId, newRole } = body;
    if (!memberId || !["admin", "member", "guest"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Get the target member
    const { data: target } = await supabase
      .from("box_members")
      .select("user_id, role")
      .eq("id", memberId)
      .eq("box_id", boxId)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Only owner can promote to admin or demote admins
    if (
      (newRole === "admin" || target.role === "admin") &&
      membership.role !== "owner"
    ) {
      return NextResponse.json(
        { error: "Only the owner can manage admin roles" },
        { status: 403 }
      );
    }

    // Can't change owner's role
    if (target.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change the owner's role" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("box_members")
      .update({ role: newRole })
      .eq("id", memberId)
      .eq("box_id", boxId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.from("admin_audit_logs").insert({
      box_id: boxId,
      actor_id: user.id,
      action: "role_changed",
      target_type: "member",
      target_id: target.user_id,
      metadata: {
        from_role: target.role,
        to_role: newRole,
      },
    });

    return NextResponse.json({ success: true });
  }

  // ── Update box settings ──
  if (action === "update_settings") {
    const { settings } = body;
    const updates: Record<string, unknown> = {};

    if (settings.name !== undefined) {
      const name = String(settings.name).trim();
      if (name.length < 2 || name.length > 50) {
        return NextResponse.json(
          { error: "Name must be 2-50 characters" },
          { status: 400 }
        );
      }
      updates.name = name;
      updates.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (settings.description !== undefined) {
      updates.description = settings.description?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("boxes")
      .update(updates)
      .eq("id", boxId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.from("admin_audit_logs").insert({
      box_id: boxId,
      actor_id: user.id,
      action: "settings_updated",
      target_type: "box",
      target_id: boxId,
      metadata: { fields: Object.keys(updates).filter((k) => k !== "updated_at") },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
