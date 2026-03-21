import type { Metadata } from "next";
import { getAuthUser, getUserBoxes } from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/super-admin";
import { redirect } from "next/navigation";
import { SuperAdminClient } from "./super-admin-client";

export const metadata: Metadata = {
  title: "Super Admin",
};

export default async function SuperAdminPage() {
  const { supabase, user } = await getAuthUser();

  if (!isSuperAdmin(user.email)) {
    redirect("/dashboard");
  }

  const [boxes, { count: totalUsers }, { count: totalBoxes }] = await Promise.all([
    getUserBoxes(supabase, user.id),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("boxes").select("*", { count: "exact", head: true }),
  ]);

  return (
    <SuperAdminClient
      user={user}
      boxes={boxes}
      initialCounts={{
        totalUsers: totalUsers ?? 0,
        totalBoxes: totalBoxes ?? 0,
      }}
    />
  );
}
