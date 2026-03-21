import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency: number | null;
  detail?: string;
}

async function checkService(
  name: string,
  fn: () => Promise<void>
): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await fn();
    return { name, status: "operational", latency: Date.now() - start };
  } catch (err: unknown) {
    const latency = Date.now() - start;
    const detail = err instanceof Error ? err.message : "Unknown error";
    const status = latency > 5000 ? "down" : "degraded";
    return { name, status, latency, detail };
  }
}

export async function GET() {
  const checks = await Promise.allSettled([
    // Database
    checkService("Database", async () => {
      const { error } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);
      if (error) throw error;
    }),

    // Auth
    checkService("Authentication", async () => {
      const { error } = await supabaseAdmin.auth.getSession();
      if (error) throw error;
    }),

    // Storage
    checkService("File Storage", async () => {
      const { error } = await supabaseAdmin.storage.listBuckets();
      if (error) throw error;
    }),

    // Realtime (check via a simple REST ping to Supabase)
    checkService("Realtime", async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!url || url.includes("placeholder")) {
        throw new Error("Not configured");
      }
      const res = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),

    // API (self-check — if this runs, the API is up)
    checkService("API", async () => {
      // This function running is proof the API works
    }),
  ]);

  const services: ServiceStatus[] = checks.map((result) => {
    if (result.status === "fulfilled") return result.value;
    return {
      name: "Unknown",
      status: "down" as const,
      latency: null,
      detail: result.reason?.message || "Check failed",
    };
  });

  const overall = services.every((s) => s.status === "operational")
    ? "operational"
    : services.some((s) => s.status === "down")
      ? "major_outage"
      : "degraded";

  return NextResponse.json({
    status: overall,
    services,
    checked_at: new Date().toISOString(),
  });
}
