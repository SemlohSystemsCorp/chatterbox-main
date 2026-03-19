import type { Metadata } from "next";
import { getAuthUser, getUserBoxes, getBoxByShortId, getBoxMembers } from "@/lib/data";
import { redirect } from "next/navigation";
import { MembersPageClient } from "./members-page-client";

export const metadata: Metadata = {
  title: "Members",
};

export default async function MembersPage({
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

  const [boxes, members] = await Promise.all([
    getUserBoxes(supabase, user.id),
    getBoxMembers(box.id),
  ]);

  return (
    <MembersPageClient
      user={user}
      boxes={boxes}
      box={box}
      members={members}
    />
  );
}
