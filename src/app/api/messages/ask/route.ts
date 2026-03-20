import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question, box_id } = await request.json();

  if (!question || typeof question !== "string" || question.trim().length < 3) {
    return NextResponse.json(
      { error: "Question must be at least 3 characters" },
      { status: 400 }
    );
  }

  // Extract search keywords from the question for full-text retrieval
  const keywords = question
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 8);

  // Try full-text search first, then fall back to recent messages
  let contextMessages: {
    id: string;
    content: string;
    created_at: string;
    sender_name: string;
    channel_name: string | null;
  }[] = [];

  if (keywords.length > 0) {
    const tsquery = keywords.map((w) => `${w}:*`).join(" | ");

    let query = supabase
      .from("messages")
      .select(
        "id, content, created_at, profiles:sender_id(full_name, email), channels:channel_id(name)"
      )
      .textSearch("content", tsquery)
      .order("created_at", { ascending: false })
      .limit(30);

    if (box_id) {
      // Verify user is a member of this box
      const { data: membership } = await supabase
        .from("box_members")
        .select("id")
        .eq("box_id", box_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: boxChannels } = await supabase
        .from("channels")
        .select("id")
        .eq("box_id", box_id);

      if (boxChannels && boxChannels.length > 0) {
        query = query.in(
          "channel_id",
          boxChannels.map((c) => c.id)
        );
      }
    }

    const { data: found } = await query;

    contextMessages = (found ?? []).map((m) => {
      const profile = m.profiles as unknown as {
        full_name: string;
        email: string;
      } | null;
      const channel = m.channels as unknown as { name: string } | null;
      return {
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        sender_name: profile?.full_name || profile?.email || "Unknown",
        channel_name: channel?.name ?? null,
      };
    });
  }

  // If full-text didn't find enough, also grab recent messages for context
  if (contextMessages.length < 10 && box_id) {
    const { data: boxChannels } = await supabase
      .from("channels")
      .select("id")
      .eq("box_id", box_id);

    if (boxChannels && boxChannels.length > 0) {
      const { data: recent } = await supabase
        .from("messages")
        .select(
          "id, content, created_at, profiles:sender_id(full_name, email), channels:channel_id(name)"
        )
        .in(
          "channel_id",
          boxChannels.map((c) => c.id)
        )
        .order("created_at", { ascending: false })
        .limit(30);

      const existingIds = new Set(contextMessages.map((m) => m.id));
      for (const m of recent ?? []) {
        if (existingIds.has(m.id)) continue;
        const profile = m.profiles as unknown as {
          full_name: string;
          email: string;
        } | null;
        const channel = m.channels as unknown as { name: string } | null;
        contextMessages.push({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          sender_name: profile?.full_name || profile?.email || "Unknown",
          channel_name: channel?.name ?? null,
        });
      }
    }
  }

  if (contextMessages.length === 0) {
    return NextResponse.json({
      answer: "I couldn't find any messages to answer your question. Try asking about something that's been discussed in your channels.",
      sources: [],
    });
  }

  // Sort chronologically for Claude
  contextMessages.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const messagesContext = contextMessages
    .map((m) => {
      const date = new Date(m.created_at).toLocaleString();
      const where = m.channel_name ? ` in #${m.channel_name}` : "";
      return `[${date}${where}] ${m.sender_name}: ${m.content}`;
    })
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You are a helpful assistant that answers questions about team conversations. You are given chat messages as context. Answer the user's question based ONLY on the provided messages. Be concise and direct. If the messages don't contain enough information to answer, say so. When referencing what someone said, mention their name.`,
    messages: [
      {
        role: "user",
        content: `Here are the recent messages from the team:\n\n${messagesContext}\n\nQuestion: ${question.trim()}`,
      },
    ],
  });

  const answer =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Return the top sources (messages most relevant to the answer)
  const sources = contextMessages.slice(0, 5).map((m) => ({
    id: m.id,
    content:
      m.content.length > 100 ? m.content.slice(0, 100) + "..." : m.content,
    sender_name: m.sender_name,
    channel_name: m.channel_name,
    created_at: m.created_at,
  }));

  return NextResponse.json({ answer, sources });
}
