import type { Metadata } from "next";
import {
  getAuthUser,
  getUserBoxes,
  getBoxByShortId,
  getBoxChannels,
  getBoxMembers,
} from "@/lib/data";
import { redirect } from "next/navigation";
import { BoxAdminClient } from "./box-admin-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boxId: string }>;
}): Promise<Metadata> {
  const { boxId } = await params;
  const { supabase, user } = await getAuthUser();
  const box = await getBoxByShortId(supabase, boxId, user.id);
  return {
    title: box ? `Admin · ${box.name}` : "Box Admin",
  };
}

export default async function BoxAdminPage({
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

  // Only owner/admin can access
  if (!["owner", "admin"].includes(box.role)) {
    redirect(`/box/${boxId}`);
  }

  const [boxes, channels, members] = await Promise.all([
    getUserBoxes(supabase, user.id),
    getBoxChannels(supabase, box.id),
    getBoxMembers(box.id),
  ]);

  return (
    <BoxAdminClient
      user={user}
      boxes={boxes}
      box={box}
      channels={channels}
      members={members}
    />
  );
}
