import type { Metadata } from "next";
import { getAuthUser, getUserBoxes } from "@/lib/data";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const { user, supabase } = await getAuthUser();
  const boxes = await getUserBoxes(supabase, user.id);

  return <SettingsClient user={user} boxes={boxes} />;
}
