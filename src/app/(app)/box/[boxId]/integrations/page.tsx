import type { Metadata } from "next";
import {
  getAuthUser,
  getUserBoxes,
  getBoxByShortId,
  getBoxMembers,
} from "@/lib/data";
import { redirect } from "next/navigation";
import { IntegrationsClient } from "./integrations-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boxId: string }>;
}): Promise<Metadata> {
  const { boxId } = await params;
  const { supabase, user } = await getAuthUser();
  const box = await getBoxByShortId(supabase, boxId, user.id);
  return {
    title: box ? `Integrations · ${box.name}` : "Integrations",
  };
}

export default async function IntegrationsPage({
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

  const [boxesResult, integrationsResult, connectedResult, membersResult] = await Promise.all([
    getUserBoxes(supabase, user.id),
    supabase
      .from("integrations")
      .select("*")
      .order("display_name"),
    supabase
      .from("workspace_integrations")
      .select("*, integrations(name)")
      .eq("workspace_id", box.id)
      .eq("enabled", true),
    getBoxMembers(supabase, box.id),
  ]);

  const integrations = integrationsResult.data ?? [];
  const connected = connectedResult.data ?? [];

  // Build a map of connected integration names
  const connectedMap: Record<string, { connected_at: string; connected_by: string }> = {};
  for (const c of connected) {
    const name = (c.integrations as unknown as { name: string })?.name;
    if (name) {
      connectedMap[name] = {
        connected_at: c.connected_at,
        connected_by: c.connected_by,
      };
    }
  }

  return (
    <IntegrationsClient
      user={user}
      boxes={boxesResult}
      box={box}
      integrations={integrations}
      connectedMap={connectedMap}
      members={membersResult}
    />
  );
}
