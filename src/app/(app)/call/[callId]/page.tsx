import type { Metadata } from "next";
import { getAuthUser } from "@/lib/data";
import { createMeetingToken } from "@/lib/daily";
import { redirect } from "next/navigation";
import { CallPageClient } from "./call-page-client";

export const metadata: Metadata = {
  title: "Call",
};

export default async function CallPage({
  params,
  searchParams,
}: {
  params: Promise<{ callId: string }>;
  searchParams: Promise<{ returnTo?: string; token?: string }>;
}) {
  const { callId } = await params;
  const { returnTo, token: passedToken } = await searchParams;
  const { supabase, user } = await getAuthUser();

  const { data: call } = await supabase
    .from("calls")
    .select("id, room_name, room_url, channel_id, conversation_id, started_by, started_at, ended_at")
    .eq("id", callId)
    .single();

  if (!call || call.ended_at) {
    redirect(returnTo || "/dashboard");
  }

  // Use the token passed from the start route, or generate a new one
  let token = passedToken || "";
  if (!token) {
    try {
      const result = await createMeetingToken(call.room_name, user.id);
      token = result.token;
    } catch (err) {
      console.error("[CallPage] Failed to create meeting token:", err);
      redirect(returnTo || "/dashboard");
    }
  }

  // Add user as participant if not already (reset left_at for rejoins)
  await supabase
    .from("call_participants")
    .upsert(
      { call_id: call.id, user_id: user.id, left_at: null },
      { onConflict: "call_id,user_id" }
    );

  return (
    <CallPageClient
      call={call}
      token={token}
      userId={user.id}
      userName={user.fullName || user.email}
      userAvatar={user.avatarUrl}
      returnTo={returnTo || "/dashboard"}
    />
  );
}
