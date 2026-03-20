import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/messages/pin?channel_id=xxx — list pinned messages for a channel
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channelId = request.nextUrl.searchParams.get("channel_id");
  const conversationId = request.nextUrl.searchParams.get("conversation_id");

  if (!channelId && !conversationId) {
    return NextResponse.json(
      { error: "channel_id or conversation_id required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("pinned_messages")
    .select("id, message_id, pinned_by, pinned_at")
    .order("pinned_at", { ascending: false });

  if (channelId) {
    query = query.eq("channel_id", channelId);
  } else {
    query = query.eq("conversation_id", conversationId!);
  }

  const { data: pins, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pins || pins.length === 0) {
    return NextResponse.json({ pins: [] });
  }

  // Fetch the actual messages with sender info
  const messageIds = pins.map((p) => p.message_id);
  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, created_at, sender_id, channel_id, conversation_id")
    .in("id", messageIds);

  // Fetch sender profiles
  const senderIds = [...new Set((messages ?? []).map((m) => m.sender_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", senderIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const messageMap = new Map((messages ?? []).map((m) => [m.id, m]));

  const enrichedPins = pins
    .map((pin) => {
      const msg = messageMap.get(pin.message_id);
      if (!msg) return null;
      const sender = profileMap.get(msg.sender_id);
      return {
        ...pin,
        message: {
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
          sender: sender
            ? {
                id: sender.id,
                full_name: sender.full_name,
                email: sender.email,
                avatar_url: sender.avatar_url,
              }
            : null,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({ pins: enrichedPins });
}

// POST /api/messages/pin — pin a message
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message_id, channel_id, conversation_id } = await request.json();

  if (!message_id) {
    return NextResponse.json(
      { error: "message_id is required" },
      { status: 400 }
    );
  }

  // Verify the user has access to this channel or conversation
  if (channel_id) {
    const { data: ch } = await supabase
      .from("channels")
      .select("box_id")
      .eq("id", channel_id)
      .single();
    if (!ch) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    const { data: membership } = await supabase
      .from("box_members")
      .select("id")
      .eq("box_id", ch.box_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (conversation_id) {
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversation_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Check if already pinned
  const { data: existing } = await supabase
    .from("pinned_messages")
    .select("id")
    .eq("message_id", message_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Message is already pinned" },
      { status: 409 }
    );
  }

  const { data: pin, error } = await supabase
    .from("pinned_messages")
    .insert({
      message_id,
      channel_id: channel_id || null,
      conversation_id: conversation_id || null,
      pinned_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pin }, { status: 201 });
}

// DELETE /api/messages/pin?message_id=xxx — unpin a message
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messageId = request.nextUrl.searchParams.get("message_id");
  const channelId = request.nextUrl.searchParams.get("channel_id");
  const conversationId = request.nextUrl.searchParams.get("conversation_id");

  if (!messageId) {
    return NextResponse.json(
      { error: "message_id is required" },
      { status: 400 }
    );
  }

  // Verify access
  if (channelId) {
    const { data: ch } = await supabase
      .from("channels")
      .select("box_id")
      .eq("id", channelId)
      .single();
    if (!ch) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    const { data: membership } = await supabase
      .from("box_members")
      .select("id")
      .eq("box_id", ch.box_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (conversationId) {
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("pinned_messages")
    .delete()
    .eq("message_id", messageId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
