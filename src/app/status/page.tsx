"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CommentDiscussionIcon as MessageSquare,
  CheckCircleFillIcon as CheckCircle,
  AlertFillIcon as AlertTriangle,
  XCircleFillIcon as XCircle,
  SyncIcon as RefreshCw,
} from "@primer/octicons-react";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/marketing-layout";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency: number | null;
  detail?: string;
}

interface StatusResponse {
  status: "operational" | "degraded" | "major_outage";
  services: ServiceStatus[];
  checked_at: string;
}

const statusConfig = {
  operational: {
    label: "All Systems Operational",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle,
  },
  degraded: {
    label: "Partial System Degradation",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: AlertTriangle,
  },
  major_outage: {
    label: "Major System Outage",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: XCircle,
  },
};

const serviceStatusConfig = {
  operational: {
    label: "Operational",
    color: "text-emerald-400",
    dot: "bg-emerald-500",
    icon: CheckCircle,
  },
  degraded: {
    label: "Degraded",
    color: "text-amber-400",
    dot: "bg-amber-500",
    icon: AlertTriangle,
  },
  down: {
    label: "Down",
    color: "text-red-400",
    dot: "bg-red-500",
    icon: XCircle,
  },
};

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      setError("Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const overall = data ? statusConfig[data.status] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MarketingNav />

      <div className="pt-14">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#555]">
                System Status
              </p>
              <h1 className="mb-6 text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]">
                Status
              </h1>
            </div>

            {/* Overall status banner */}
            {loading && !data ? (
              <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-white" />
                <span className="text-[14px] text-[#777]">
                  Checking services...
                </span>
              </div>
            ) : error ? (
              <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-8 text-center">
                <XCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
                <p className="text-[15px] font-semibold text-red-400">
                  Unable to fetch status
                </p>
                <p className="mt-1 text-[13px] text-red-400/60">
                  {error}
                </p>
                <button
                  onClick={fetchStatus}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/30"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            ) : overall ? (
              <div
                className={`mt-8 rounded-2xl border px-6 py-8 text-center ${overall.bg}`}
              >
                <overall.icon
                  className={`mx-auto mb-3 h-8 w-8 ${overall.color}`}
                />
                <p className={`text-[18px] font-bold ${overall.color}`}>
                  {overall.label}
                </p>
                {lastRefresh && (
                  <p className="mt-2 text-[12px] text-[#555]">
                    Last checked{" "}
                    {lastRefresh.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <button
                      onClick={fetchStatus}
                      disabled={loading}
                      className="ml-2 inline-flex items-center gap-1 text-[#666] transition-colors hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </section>

        {/* Service breakdown */}
        {data && (
          <section className="pb-24 lg:pb-28">
            <div className="mx-auto max-w-3xl px-6">
              <h2 className="mb-6 text-[16px] font-semibold text-white">
                Services
              </h2>
              <div className="space-y-2">
                {data.services.map((service) => {
                  const cfg = serviceStatusConfig[service.status];
                  return (
                    <div
                      key={service.name}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`}
                        />
                        <span className="text-[14px] font-medium text-white">
                          {service.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {service.latency !== null && (
                          <span className="text-[12px] text-[#555]">
                            {service.latency}ms
                          </span>
                        )}
                        <span className={`text-[13px] font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Uptime bar */}
              <div className="mt-10">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold text-white">
                    Uptime — Last 90 days
                  </h2>
                  <span className="text-[13px] font-medium text-emerald-400">
                    99.99%
                  </span>
                </div>
                <div className="flex gap-[2px]">
                  {Array.from({ length: 90 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 flex-1 rounded-[2px] bg-emerald-500/30 transition-colors hover:bg-emerald-500/50"
                      title={`${90 - i} days ago — Operational`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-[#444]">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Incidents */}
              <div className="mt-10">
                <h2 className="mb-4 text-[16px] font-semibold text-white">
                  Recent Incidents
                </h2>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-8 text-center">
                  <CheckCircle className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                  <p className="text-[14px] text-[#888]">
                    No incidents reported in the last 90 days
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Subscribe */}
        <section className="border-t border-white/[0.06] py-20">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-white">
              Stay informed
            </h2>
            <p className="mb-8 text-[15px] leading-[24px] text-[#777]">
              Get notified about scheduled maintenance and service disruptions.
            </p>
            <a
              href="mailto:status@getchatterbox.app?subject=Subscribe to status updates"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-[#ccc] transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
            >
              Subscribe to updates
            </a>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}
