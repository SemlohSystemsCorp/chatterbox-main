import type { Metadata } from "next";
import {
  getAuthUser,
  getUserBoxes,
  getBoxByShortId,
  getBoxChannels,
  getBoxMembers,
} from "@/lib/data";
import { redirect } from "next/navigation";
import { BoxSettingsClient } from "./box-settings-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boxId: string }>;
}): Promise<Metadata> {
  const { boxId } = await params;
  const { supabase, user } = await getAuthUser();
  const box = await getBoxByShortId(supabase, boxId, user.id);
  return {
    title: box ? `Settings · ${box.name}` : "Box Settings",
  };
}

export default async function BoxSettingsPage({
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
    getBoxMembers(box.id),
  ]);

  return (
    <BoxSettingsClient
      user={user}
      boxes={boxes}
      box={box}
      channels={channels}
      members={members}
    />
  );
}
