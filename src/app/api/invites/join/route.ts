import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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
  const { code } = body;

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json(
      { error: "Invite code is required" },
      { status: 400 }
    );
  }

  const trimmedCode = code.trim();

  // Look up the invite
  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("*, boxes(id, short_id, name, slug, icon_url)")
    .eq("code", trimmedCode)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 404 }
    );
  }

  // Check if expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invite has expired" },
      { status: 410 }
    );
  }

  // Check if max uses reached
  if (invite.max_uses && invite.uses >= invite.max_uses) {
    return NextResponse.json(
      { error: "This invite has reached its maximum uses" },
      { status: 410 }
    );
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("box_members")
    .select("id")
    .eq("box_id", invite.box_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json(
      {
        error: "You're already a member of this workspace",
        box: invite.boxes,
      },
      { status: 409 }
    );
  }

  // Add the user as a member
  const { error: memberError } = await supabase.from("box_members").insert({
    box_id: invite.box_id,
    user_id: user.id,
    role: invite.role || "member",
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Increment invite uses
  const { error: usesError } = await supabase
    .from("invites")
    .update({ uses: invite.uses + 1 })
    .eq("id", invite.id);

  if (usesError) {
    console.error("[invites/join] failed to increment uses:", usesError.message);
  }

  // Insert "member_joined" events into all public channels of this box
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();
  const actorName = profile?.full_name || profile?.email || "Someone";

  const { data: publicChannels } = await supabase
    .from("channels")
    .select("id")
    .eq("box_id", invite.box_id)
    .eq("is_private", false);

  if (publicChannels && publicChannels.length > 0) {
    await supabase.from("channel_events").insert(
      publicChannels.map((ch) => ({
        channel_id: ch.id,
        actor_id: user.id,
        type: "member_joined",
        metadata: { actor_name: actorName },
      }))
    );
  }

  // Use admin client to bypass RLS for DM creation —
  // the new member can't query other users' conversation_participants yet
  const admin = supabaseAdmin;

  // Create self-DM (Saved Messages)
  const { data: selfConvos } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  let hasSelfDm = false;
  if (selfConvos) {
    for (const c of selfConvos) {
      const { count } = await admin
        .from("conversation_participants")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.conversation_id);
      if (count === 1) {
        hasSelfDm = true;
        break;
      }
    }
  }

  if (!hasSelfDm) {
    const { data: selfConvo } = await admin
      .from("conversations")
      .insert({ is_group: false })
      .select("id")
      .single();
    if (selfConvo) {
      await admin
        .from("conversation_participants")
        .insert({ conversation_id: selfConvo.id, user_id: user.id });
    }
  }

  // Create 1:1 DMs with every existing member
  const { data: existingMembers } = await admin
    .from("box_members")
    .select("user_id")
    .eq("box_id", invite.box_id)
    .neq("user_id", user.id);

  if (existingMembers && existingMembers.length > 0) {
    // Fetch all conversation participations for the new user ONCE
    const { data: myParticipations } = await admin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);
    const myConvoIds = new Set(myParticipations?.map((e) => e.conversation_id) ?? []);

    // Fetch non-group conversations the new user is in, to check for existing 1:1s
    const myNonGroupConvos = new Set<string>();
    if (myConvoIds.size > 0) {
      const { data: convos } = await admin
        .from("conversations")
        .select("id")
        .in("id", [...myConvoIds])
        .eq("is_group", false);
      for (const c of convos ?? []) {
        myNonGroupConvos.add(c.id);
      }
    }

    // Fetch all participants in those 1:1 conversations to find existing pairs
    const existingDmPartners = new Set<string>();
    if (myNonGroupConvos.size > 0) {
      const { data: partners } = await admin
        .from("conversation_participants")
        .select("user_id, conversation_id")
        .in("conversation_id", [...myNonGroupConvos])
        .neq("user_id", user.id);
      for (const p of partners ?? []) {
        existingDmPartners.add(p.user_id);
      }
    }

    // Create 1:1 DMs only with members who don't already have one
    const newDmMembers = existingMembers.filter(
      (m) => !existingDmPartners.has(m.user_id)
    );

    for (const member of newDmMembers) {
      const { data: newConvo } = await admin
        .from("conversations")
        .insert({ is_group: false })
        .select("id")
        .single();

      if (newConvo) {
        await admin.from("conversation_participants").insert([
          { conversation_id: newConvo.id, user_id: user.id },
          { conversation_id: newConvo.id, user_id: member.user_id },
        ]);
      }
    }
  }

  return NextResponse.json({ box: invite.boxes }, { status: 200 });
}

// GET: Look up invite info without joining
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Code parameter required" },
      { status: 400 }
    );
  }

  // Use admin client — the user isn't a member yet,
  // so RLS on boxes/box_members/channels would block the preview.
  const admin = supabaseAdmin;

  const { data: invite } = await admin
    .from("invites")
    .select(
      "code, role, expires_at, max_uses, uses, box_id, boxes(id, short_id, name, slug, icon_url)"
    )
    .eq("code", code)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 404 }
    );
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invite has expired" },
      { status: 410 }
    );
  }

  if (invite.max_uses && invite.uses >= invite.max_uses) {
    return NextResponse.json(
      { error: "This invite has reached its maximum uses" },
      { status: 410 }
    );
  }

  // Fetch member count and channel count for preview
  const [{ count: memberCount }, { count: channelCount }] = await Promise.all([
    admin
      .from("box_members")
      .select("id", { count: "exact", head: true })
      .eq("box_id", invite.box_id),
    admin
      .from("channels")
      .select("id", { count: "exact", head: true })
      .eq("box_id", invite.box_id)
      .eq("is_archived", false),
  ]);

  return NextResponse.json({
    invite: {
      ...invite,
      member_count: memberCount ?? 0,
      channel_count: channelCount ?? 0,
    },
  });
}
