import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchBoxChannelIds, formatMessagesForClaude } from "@/lib/ai-utils";
import type { ContextMessage } from "@/lib/ai-utils";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { box_id, messages: conversationMessages, mode, chat_id, user_content } = await request.json();

  const isGeneral = mode === "general";

  if (!isGeneral && !box_id) {
    return NextResponse.json(
      { error: "box_id is required" },
      { status: 400 }
    );
  }

  let systemPrompt: string;

  if (isGeneral) {
    // General mode — no workspace context, just a helpful AI assistant
    systemPrompt = `You are Sherlock, an AI assistant on Chatterbox. You have a friendly but sharp — witty, observant, and helpful.

You can help with anything:
- Brainstorming and ideation
- Drafting messages, emails, and documents
- Answering questions on any topic
- Coding help and technical discussions
- Writing, editing, and creative work
- Math, analysis, and research

Be concise, helpful, and engaging. Use markdown formatting when it helps readability.`;
  } else {
    // Workspace mode — gather context from the box
    // Verify membership
    const { data: membership } = await supabase
      .from("box_members")
      .select("role")
      .eq("box_id", box_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Gather workspace context
    const [channelsResult, membersResult] = await Promise.all([
      supabase
        .from("channels")
        .select("name, description")
        .eq("box_id", box_id)
        .eq("is_archived", false),
      supabase
        .from("box_members")
        .select("role, profiles(full_name, email)")
        .eq("box_id", box_id),
    ]);

    const { data: boxData } = await supabase
      .from("boxes")
      .select("name")
      .eq("id", box_id)
      .single();

    const channelList = (channelsResult.data ?? [])
      .map((c) => `#${c.name}${c.description ? ` — ${c.description}` : ""}`)
      .join("\n");

    const memberList = (membersResult.data ?? [])
      .map((m) => {
        const p = m.profiles as unknown as {
          full_name: string;
          email: string;
        };
        return `${p.full_name || p.email} (${m.role})`;
      })
      .join(", ");

    // Fetch recent messages across channels for context
    const channelIds = await fetchBoxChannelIds(supabase, box_id);
    let recentContext = "";

    if (channelIds.length > 0) {
      const { data: recentMsgs } = await supabase
        .from("messages")
        .select(
          "id, content, created_at, profiles:sender_id(full_name, email), channels:channel_id(name)"
        )
        .in("channel_id", channelIds)
        .order("created_at", { ascending: false })
        .limit(50);

      const mapped: ContextMessage[] = (recentMsgs ?? []).map((m) => {
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

      if (mapped.length > 0) {
        recentContext = `\n\nRecent workspace activity:\n${formatMessagesForClaude(mapped)}`;
      }
    }

    systemPrompt = `You are Sherlock, an AI assistant for the "${boxData?.name ?? "this"}" workspace on Chatterbox. You have a friendly but sharp Sherlock Holmes persona — witty, observant, and helpful.

Workspace: ${boxData?.name ?? "Unknown"}
Channels:\n${channelList || "No channels yet"}
Members: ${memberList || "No members yet"}${recentContext}

You can help with:
- Answering questions about what's been discussed in the workspace
- Brainstorming and ideation
- Drafting messages, announcements, and docs
- Summarizing conversations
- General assistance

Be concise and helpful. Reference specific messages, channels, or people when relevant. If you don't have enough context to answer, say so honestly.`;
  }

  const claudeMessages = (conversationMessages ?? []).map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system: systemPrompt,
    messages: claudeMessages,
  });

  const content =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Persist messages to database if a chat_id is provided
  if (chat_id && user_content) {
    const now = new Date().toISOString();
    await supabase.from("sherlock_messages").insert([
      { chat_id, role: "user", content: user_content },
      { chat_id, role: "assistant", content },
    ]);
    // Update chat title from first user message, and bump updated_at
    const { count: msgCount } = await supabase
      .from("sherlock_messages")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chat_id);
    const updates: Record<string, string> = { updated_at: now };
    // If this is the first exchange (2 messages: user + assistant), set the title
    if (msgCount === 2) {
      updates.title = user_content.slice(0, 80);
    }
    await supabase.from("sherlock_chats").update(updates).eq("id", chat_id);
  }

  return NextResponse.json({ content });
}
