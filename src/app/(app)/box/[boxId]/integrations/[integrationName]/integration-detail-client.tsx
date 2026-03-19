"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon as ArrowLeft,
  CheckCircleFillIcon as CheckCircle,
  ShieldLockIcon as Shield,
  LinkExternalIcon as ExternalLink,
  AlertIcon as AlertTriangle,
  SyncIcon as Sync,
} from "@primer/octicons-react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";

interface BoxData {
  id: string;
  short_id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  plan: string;
  role: string;
}

interface Integration {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon_url: string | null;
  brand_color: string;
  category: string;
  auth_type: string;
  scopes: string | null;
  is_available: boolean;
  website_url: string | null;
}

interface WorkspaceIntegration {
  id: string;
  enabled: boolean;
  connected_by: string;
  connected_at: string;
  updated_at: string;
}

interface IntegrationDetailClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  boxes: BoxData[];
  box: BoxData & { description: string | null; owner_id: string; created_at: string };
  integration: Integration;
  workspaceIntegration: WorkspaceIntegration | null;
  connectedByName: string | null;
}

function IntegrationIcon({ name, brandColor, iconUrl }: { name: string; brandColor: string; iconUrl: string | null }) {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-xl"
      style={{ backgroundColor: brandColor }}
    >
      {iconUrl ? (
        <img src={iconUrl} alt={name} className="h-7 w-7" />
      ) : (
        <span className="text-[24px] font-bold text-white">
          {name[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "meeting:write:meeting": "Create and manage meetings",
  "meeting:read:meeting": "View meeting details",
  "user:read:user": "Read basic user profile",
};

export function IntegrationDetailClient({
  user,
  boxes,
  box,
  integration,
  workspaceIntegration,
  connectedByName,
}: IntegrationDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = box.role === "owner" || box.role === "admin";
  const isConnected = !!workspaceIntegration;
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const successMessage = searchParams.get("success");
  const errorMessage = searchParams.get("error");

  async function handleConnect() {
    setConnecting(true);
    // Redirect to Zoom OAuth flow
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/api/integrations/zoom/oauth-callback`
    );
    const state = box.id; // Pass workspace UUID as state
    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
    const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
    window.location.href = url;
  }

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${integration.display_name} from ${box.name}? All team members will lose access to ${integration.display_name} features.`)) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/zoom/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: box.id }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to disconnect");
      }
    } finally {
      setDisconnecting(false);
    }
  }

  const scopes = integration.scopes?.split(" ") ?? [];

  return (
    <AppShell user={user} boxes={boxes} activeBoxId={box.short_id}>
      <div className="flex h-full flex-col">
        <TopBar
          title={integration.display_name}
          description={box.name}
          actions={
            <Link
              href={`/box/${box.short_id}/integrations`}
              className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[12px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Integrations
            </Link>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-8">
            {/* Status messages */}
            {successMessage === "connected" && (
              <div className="mb-6 flex items-center gap-2 rounded-[8px] border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3">
                <CheckCircle className="h-4 w-4 text-[#22c55e]" />
                <span className="text-[13px] text-[#22c55e]">
                  {integration.display_name} has been connected successfully! All workspace members can now use it.
                </span>
              </div>
            )}
            {errorMessage && (
              <div className="mb-6 flex items-center gap-2 rounded-[8px] border border-[#de1135]/30 bg-[#de1135]/10 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-[#de1135]" />
                <span className="text-[13px] text-[#de1135]">
                  Failed to connect {integration.display_name}. Please try again.
                </span>
              </div>
            )}

            {/* Integration header */}
            <div className="flex items-start gap-4">
              <IntegrationIcon
                name={integration.name}
                brandColor={integration.brand_color}
                iconUrl={integration.icon_url}
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-[20px] font-bold text-white">
                    {integration.display_name}
                  </h2>
                  {isConnected && (
                    <div className="flex items-center gap-1 rounded-full bg-[#22c55e]/15 px-2.5 py-0.5">
                      <CheckCircle className="h-3 w-3 text-[#22c55e]" />
                      <span className="text-[11px] font-semibold text-[#22c55e]">
                        Connected
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-[#888]">
                  {integration.description}
                </p>
                {integration.website_url && (
                  <a
                    href={integration.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[12px] text-[#555] transition-colors hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {integration.website_url.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                )}
              </div>
            </div>

            {/* Connection status / action */}
            <div className="mt-8 rounded-[10px] border border-[#1a1a1a] bg-[#111] p-5">
              {isConnected ? (
                <div>
                  <h3 className="text-[14px] font-semibold text-white">
                    Connection Status
                  </h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#888]">Status</span>
                      <span className="flex items-center gap-1.5 text-[13px] text-[#22c55e]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                        Active
                      </span>
                    </div>
                    {connectedByName && (
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-[#888]">Connected by</span>
                        <span className="text-[13px] text-white">{connectedByName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#888]">Connected on</span>
                      <span className="text-[13px] text-white">
                        {new Date(workspaceIntegration!.connected_at).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#888]">Last updated</span>
                      <span className="text-[13px] text-white">
                        {new Date(workspaceIntegration!.updated_at).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#1a1a1a] pt-4">
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#2a2a2a] px-3 text-[12px] text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
                      >
                        <Sync className="h-3.5 w-3.5" />
                        Reconnect
                      </button>
                      <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#de1135]/30 px-3 text-[12px] text-[#de1135] transition-colors hover:bg-[#de1135]/10 disabled:opacity-50"
                      >
                        {disconnecting ? "Disconnecting..." : "Disconnect"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-[14px] font-semibold text-white">
                    Connect {integration.display_name}
                  </h3>
                  <p className="mt-1 text-[13px] text-[#888]">
                    {isAdmin
                      ? `Connect your workspace's ${integration.display_name} account. Once connected, all members of ${box.name} can use ${integration.display_name} features.`
                      : `Ask a workspace admin to connect ${integration.display_name} for ${box.name}.`}
                  </p>

                  {isAdmin ? (
                    integration.is_available ? (
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="mt-4 flex h-9 items-center gap-2 rounded-[6px] px-4 text-[13px] font-medium text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: integration.brand_color }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {connecting ? "Redirecting..." : `Connect ${integration.display_name}`}
                      </button>
                    ) : (
                      <div className="mt-4 rounded-[6px] bg-[#1a1a1a] px-3 py-2 text-[12px] text-[#555]">
                        This integration is coming soon.
                      </div>
                    )
                  ) : (
                    <div className="mt-4 rounded-[6px] bg-[#1a1a1a] px-3 py-2 text-[12px] text-[#555]">
                      Only workspace admins can connect integrations.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Permissions / Scopes */}
            {scopes.length > 0 && (
              <div className="mt-6 rounded-[10px] border border-[#1a1a1a] bg-[#111] p-5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#555]" />
                  <h3 className="text-[14px] font-semibold text-white">
                    Permissions Requested
                  </h3>
                </div>
                <div className="mt-3 space-y-2">
                  {scopes.map((scope) => (
                    <div key={scope} className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-[#555]" />
                      <span className="text-[13px] text-[#888]">
                        {SCOPE_DESCRIPTIONS[scope] || scope}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What you can do */}
            {integration.name === "zoom" && (
              <div className="mt-6 rounded-[10px] border border-[#1a1a1a] bg-[#111] p-5">
                <h3 className="text-[14px] font-semibold text-white">
                  What you can do with Zoom
                </h3>
                <div className="mt-3 space-y-3">
                  {[
                    {
                      title: "Start meetings from chat",
                      desc: "Click the Zoom button in any channel to instantly create and share a meeting link.",
                    },
                    {
                      title: "Workspace-wide access",
                      desc: "One admin connects Zoom, and all workspace members can create meetings.",
                    },
                    {
                      title: "Auto-shared links",
                      desc: "Meeting join URLs are automatically posted in the channel for everyone to see.",
                    },
                  ].map((feature, i) => (
                    <div key={i}>
                      <h4 className="text-[13px] font-medium text-white">
                        {feature.title}
                      </h4>
                      <p className="mt-0.5 text-[12px] text-[#888]">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
