import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const TEMPLATE_CHANNELS: Record<string, { name: string; description: string }[]> = {
  team: [
    { name: "general", description: "General discussion" },
    { name: "random", description: "Off-topic and watercooler chat" },
    { name: "announcements", description: "Company-wide announcements" },
    { name: "watercooler", description: "Casual conversations" },
  ],
  engineering: [
    { name: "general", description: "General discussion" },
    { name: "engineering", description: "Engineering discussion" },
    { name: "devops", description: "Infrastructure and deployments" },
    { name: "incidents", description: "Incident tracking and response" },
    { name: "random", description: "Off-topic chat" },
  ],
  community: [
    { name: "general", description: "General discussion" },
    { name: "introductions", description: "Introduce yourself to the community" },
    { name: "off-topic", description: "Anything goes" },
    { name: "feedback", description: "Share feedback and suggestions" },
  ],
  friends: [
    { name: "general", description: "General discussion" },
    { name: "random", description: "Random stuff" },
    { name: "memes", description: "Memes and funny stuff" },
  ],
  personal: [
    { name: "general", description: "General discussion" },
    { name: "notes", description: "Personal notes and drafts" },
  ],
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, template } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (name.trim().length > 50) {
    return NextResponse.json(
      { error: "Name must be under 50 characters" },
      { status: 400 }
    );
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check for slug uniqueness
  const { data: existing } = await supabase
    .from("boxes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .insert({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || null,
      owner_id: user.id,
    })
    .select()
    .single();

  if (boxError) {
    return NextResponse.json({ error: boxError.message }, { status: 500 });
  }

  // Add the creator as owner
  const { error: memberError } = await supabase.from("box_members").insert({
    box_id: box.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    // Rollback: delete the box if we can't add the member
    await supabase.from("boxes").delete().eq("id", box.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Create channels based on template (default to just #general)
  const channels = TEMPLATE_CHANNELS[template] ?? [
    { name: "general", description: "General discussion" },
  ];

  const { error: channelError } = await supabase.from("channels").insert(
    channels.map((ch) => ({
      box_id: box.id,
      name: ch.name,
      description: ch.description,
      created_by: user.id,
    }))
  );

  if (channelError) {
    // Rollback: delete member and box
    await supabase.from("box_members").delete().eq("box_id", box.id);
    await supabase.from("boxes").delete().eq("id", box.id);
    return NextResponse.json({ error: "Failed to create default channels" }, { status: 500 });
  }

  return NextResponse.json({ box }, { status: 201 });
}
