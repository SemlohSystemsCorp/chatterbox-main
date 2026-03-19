"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon as ArrowLeft,
  SearchIcon as Search,
  CheckCircleFillIcon as CheckCircle,
  PlugIcon as Plug,
  PeopleIcon as People,
  ShieldLockIcon as Shield,
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
  is_available: boolean;
  website_url: string | null;
}

interface MemberData {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  status: string;
}

interface IntegrationsClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  boxes: BoxData[];
  box: BoxData & { description: string | null; owner_id: string; created_at: string };
  integrations: Integration[];
  connectedMap: Record<string, { connected_at: string; connected_by: string }>;
  members: MemberData[];
}

const CATEGORY_LABELS: Record<string, string> = {
  communication: "Communication",
  project_management: "Project Management",
  notifications: "Notifications",
};

function IntegrationIcon({ name, brandColor, iconUrl }: { name: string; brandColor: string; iconUrl: string | null }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg"
      style={{ backgroundColor: brandColor }}
    >
      {iconUrl ? (
        <img src={iconUrl} alt={name} className="h-5 w-5" />
      ) : (
        <span className="text-[16px] font-bold text-white">
          {name[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function IntegrationsClient({
  user,
  boxes,
  box,
  integrations,
  connectedMap,
  members,
}: IntegrationsClientProps) {
  const isAdmin = box.role === "owner" || box.role === "admin";
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = integrations.filter((i) => {
    const matchesSearch =
      !filter ||
      i.display_name.toLowerCase().includes(filter.toLowerCase()) ||
      i.description.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = !categoryFilter || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(integrations.map((i) => i.category))];

  return (
    <AppShell user={user} boxes={boxes} activeBoxId={box.short_id}>
      <div className="flex h-full flex-col">
        <TopBar
          title="Integrations"
          description={box.name}
          actions={
            <Link
              href={`/box/${box.short_id}`}
              className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[12px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-[22px] font-bold text-white">
                Integrations Marketplace
              </h2>
              <p className="mt-1 text-[14px] text-[#888]">
                Connect your favorite tools to {box.name}. Workspace admins can install integrations for the whole team.
              </p>
            </div>

            {/* Search & Filter */}
            <div className="mb-6 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555]" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-9 w-full rounded-[8px] border border-[#1a1a1a] bg-[#111] pl-9 pr-3 text-[13px] text-white placeholder:text-[#555] focus:border-[#2a2a2a] focus:outline-none"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`rounded-[6px] px-3 py-1.5 text-[12px] transition-colors ${
                    !categoryFilter
                      ? "bg-white text-black"
                      : "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setCategoryFilter(cat === categoryFilter ? null : cat)
                    }
                    className={`rounded-[6px] px-3 py-1.5 text-[12px] transition-colors ${
                      categoryFilter === cat
                        ? "bg-white text-black"
                        : "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                    }`}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Integration Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((integration) => {
                const isConnected = !!connectedMap[integration.name];
                return (
                  <Link
                    key={integration.id}
                    href={`/box/${box.short_id}/integrations/${integration.name}`}
                    className="group relative rounded-[10px] border border-[#1a1a1a] bg-[#111] p-4 transition-colors hover:border-[#2a2a2a] hover:bg-[#141414]"
                  >
                    {/* Connected badge */}
                    {isConnected && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#22c55e]/15 px-2 py-0.5">
                        <CheckCircle className="h-3 w-3 text-[#22c55e]" />
                        <span className="text-[10px] font-semibold text-[#22c55e]">
                          Connected
                        </span>
                      </div>
                    )}

                    {/* Not available badge */}
                    {!integration.is_available && !isConnected && (
                      <div className="absolute right-3 top-3 rounded-full bg-[#1a1a1a] px-2 py-0.5">
                        <span className="text-[10px] font-semibold text-[#555]">
                          Coming Soon
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <IntegrationIcon
                        name={integration.name}
                        brandColor={integration.brand_color}
                        iconUrl={integration.icon_url}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-semibold text-white">
                          {integration.display_name}
                        </h3>
                        <span className="text-[11px] text-[#555]">
                          {CATEGORY_LABELS[integration.category] || integration.category}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-[12px] leading-relaxed text-[#888]">
                      {integration.description}
                    </p>

                    {/* Action hint */}
                    <div className="mt-4 flex items-center gap-1.5">
                      {isConnected ? (
                        <span className="text-[12px] text-[#555] group-hover:text-[#888]">
                          Manage integration →
                        </span>
                      ) : integration.is_available ? (
                        <span className="text-[12px] text-[#555] group-hover:text-white">
                          {isAdmin ? "Set up integration →" : "View details →"}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#444]">
                          Not yet available
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="mt-12 text-center">
                <Plug className="mx-auto h-8 w-8 text-[#333]" />
                <p className="mt-3 text-[14px] text-[#555]">
                  No integrations match your search.
                </p>
              </div>
            )}

            {/* Workspace Members */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <People className="h-4 w-4 text-[#555]" />
                <h3 className="text-[15px] font-semibold text-white">
                  Workspace Members
                </h3>
                <span className="text-[12px] text-[#555]">{members.length}</span>
              </div>
              <div className="rounded-[10px] border border-[#1a1a1a] bg-[#111] divide-y divide-[#1a1a1a]">
                {members.map((member) => {
                  const initials = member.full_name
                    ? member.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : member.email[0].toUpperCase();
                  const roleColor =
                    member.role === "owner"
                      ? "text-[#f59e0b]"
                      : member.role === "admin"
                        ? "text-[#3b82f6]"
                        : "text-[#555]";

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="relative h-8 w-8 shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] text-[11px] font-bold text-white">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-medium text-white">
                            {member.full_name || member.email}
                          </span>
                          {member.user_id === user.id && (
                            <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] text-[#555]">
                              you
                            </span>
                          )}
                        </div>
                        <span className="text-[12px] text-[#555]">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`flex items-center gap-1 text-[11px] font-medium capitalize ${roleColor}`}>
                          {member.role === "owner" && <Shield className="h-3 w-3" />}
                          {member.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
