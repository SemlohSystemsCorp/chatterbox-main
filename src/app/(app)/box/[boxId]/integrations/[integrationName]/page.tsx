import type { Metadata } from "next";
import {
  getAuthUser,
  getUserBoxes,
  getBoxByShortId,
} from "@/lib/data";
import { redirect } from "next/navigation";
import { IntegrationDetailClient } from "./integration-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boxId: string; integrationName: string }>;
}): Promise<Metadata> {
  const { boxId, integrationName } = await params;
  const { supabase, user } = await getAuthUser();
  const box = await getBoxByShortId(supabase, boxId, user.id);
  const formattedName = integrationName.charAt(0).toUpperCase() + integrationName.slice(1);
  return {
    title: box ? `${formattedName} · ${box.name}` : formattedName,
  };
}

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ boxId: string; integrationName: string }>;
}) {
  const { boxId, integrationName } = await params;
  const { supabase, user } = await getAuthUser();

  const box = await getBoxByShortId(supabase, boxId, user.id);
  if (!box) {
    redirect("/dashboard");
  }

  // Get the integration details
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("name", integrationName)
    .single();

  if (!integration) {
    redirect(`/box/${boxId}/integrations`);
  }

  // Check if connected for this workspace
  const { data: workspaceIntegration } = await supabase
    .from("workspace_integrations")
    .select("id, enabled, connected_by, connected_at, updated_at")
    .eq("workspace_id", box.id)
    .eq("integration_id", integration.id)
    .maybeSingle();

  // Get connected-by user name if connected
  let connectedByName: string | null = null;
  if (workspaceIntegration?.connected_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", workspaceIntegration.connected_by)
      .single();
    connectedByName = profile?.full_name || profile?.email || null;
  }

  const boxes = await getUserBoxes(supabase, user.id);

  return (
    <IntegrationDetailClient
      user={user}
      boxes={boxes}
      box={box}
      integration={integration}
      workspaceIntegration={workspaceIntegration}
      connectedByName={connectedByName}
    />
  );
}
