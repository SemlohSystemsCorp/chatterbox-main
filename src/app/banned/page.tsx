import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { BannedPageClient } from "./banned-client";

export default async function BannedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → go to login
  if (!user) {
    redirect("/login");
  }

  // Check actual ban status
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
  const bannedUntil = authUser?.user?.banned_until;
  const meta = authUser?.user?.user_metadata as Record<string, unknown> | undefined;
  const isBanned =
    bannedUntil &&
    bannedUntil !== "1970-01-01T00:00:00Z" &&
    new Date(bannedUntil) > new Date();

  // Not actually banned → go to dashboard
  if (!isBanned) {
    redirect("/dashboard");
  }

  return (
    <BannedPageClient
      reason={meta?.ban_reason ? String(meta.ban_reason) : null}
      bannedUntil={String(bannedUntil)}
    />
  );
}
