import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

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

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
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

  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null;
  }

  if (body.icon_url !== undefined) {
    updates.icon_url = body.icon_url || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data: box, error } = await supabase
    .from("boxes")
    .update(updates)
    .eq("id", boxId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ box });
}

export async function DELETE(
  _request: NextRequest,
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

  // Only owner can delete
  const { data: membership } = await supabase
    .from("box_members")
    .select("role")
    .eq("box_id", boxId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can delete this Box" },
      { status: 403 }
    );
  }

  // Use admin client to bypass RLS — ownership already verified above
  const { error } = await supabaseAdmin.from("boxes").delete().eq("id", boxId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
