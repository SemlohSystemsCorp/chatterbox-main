import type { Metadata } from "next";
import { getAuthUser, getUserBoxes, getBoxByShortId, getBoxChannels, getBoxMembers } from "@/lib/data";
import { redirect } from "next/navigation";
import { BoxPageClient } from "./box-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boxId: string }>;
}): Promise<Metadata> {
  const { boxId } = await params;
  const { supabase, user } = await getAuthUser();
  const box = await getBoxByShortId(supabase, boxId, user.id);
  return {
    title: box ? box.name : "Box",
  };
}

export default async function BoxPage({
  params,
}: {
  params: Promise<{ boxId: string }>;
}) {
  const { boxId } = await params;
  const { supabase, user } = await getAuthUser();

  const box = await getBoxByShortId(supabase, boxId, user.id);
  if (!box) {
    redirect("/dashboard");
  }

  const [boxes, channels, members] = await Promise.all([
    getUserBoxes(supabase, user.id),
    getBoxChannels(supabase, box.id),
    getBoxMembers(supabase, box.id),
  ]);

  // Fetch active calls across all box channels
  const channelIds = channels.map((c) => c.id);
  const { data: callsData } = channelIds.length > 0
    ? await supabase
        .from("calls")
        .select("id, channel_id, conversation_id, started_by, started_at")
        .in("channel_id", channelIds)
        .is("ended_at", null)
    : { data: [] };

  const activeCalls = (callsData ?? []).map((c) => {
    const ch = channels.find((ch) => ch.id === c.channel_id);
    const member = members.find((m) => m.user_id === c.started_by);
    return {
      ...c,
      channel_name: ch?.name,
      starter_name: member?.full_name || member?.email,
    };
  });

  return (
    <BoxPageClient
      user={user}
      boxes={boxes}
      box={box}
      channels={channels}
      members={members}
      activeCalls={activeCalls}
    />
  );
}
