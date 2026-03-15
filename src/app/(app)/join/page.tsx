import type { Metadata } from "next";
import { Suspense } from "react";
import { getAuthUser, getUserBoxes } from "@/lib/data";
import { JoinBoxClient } from "./join-box-client";

export const metadata: Metadata = {
  title: "Join a Box",
};

export default async function JoinBoxPage() {
  const { supabase, user } = await getAuthUser();
  const boxes = await getUserBoxes(supabase, user.id);

  return (
    <Suspense>
      <JoinBoxClient user={user} boxes={boxes} />
    </Suspense>
  );
}
