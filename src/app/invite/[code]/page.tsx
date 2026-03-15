import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InviteLandingClient } from "./invite-landing-client";

export const metadata: Metadata = {
  title: "You're invited",
  description: "You've been invited to join a Chatterbox workspace.",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up invite
  const { data: invite } = await supabase
    .from("invites")
    .select(
      "code, role, expires_at, max_uses, uses, boxes(id, name, slug, icon_url)"
    )
    .eq("code", code)
    .maybeSingle();

  if (!invite) {
    return <InviteLandingClient error="This invite link is invalid." />;
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return <InviteLandingClient error="This invite has expired." />;
  }

  if (invite.max_uses && invite.uses >= invite.max_uses) {
    return (
      <InviteLandingClient error="This invite has reached its maximum uses." />
    );
  }

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Logged in — send straight to join flow
    redirect(`/join?code=${code}`);
  }

  // Not logged in — show landing page
  const box = invite.boxes as unknown as {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
  };

  return (
    <InviteLandingClient
      box={box}
      role={invite.role}
      code={code}
    />
  );
}
