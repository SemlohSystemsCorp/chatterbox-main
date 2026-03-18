import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find all pending messages that are due
  const { data: dueMessages, error: fetchError } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
    });
  }

  if (!dueMessages || dueMessages.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }));
  }

  let sentCount = 0;

  for (const scheduled of dueMessages) {
    try {
      const insertData: Record<string, unknown> = {
        sender_id: scheduled.sender_id,
        content: scheduled.content,
      };
      if (scheduled.channel_id) insertData.channel_id = scheduled.channel_id;
      if (scheduled.conversation_id)
        insertData.conversation_id = scheduled.conversation_id;
      if (scheduled.parent_message_id)
        insertData.parent_message_id = scheduled.parent_message_id;

      const { data: message, error: insertError } = await supabase
        .from("messages")
        .insert(insertData)
        .select("id")
        .single();

      if (insertError) {
        await supabase
          .from("scheduled_messages")
          .update({ status: "failed" })
          .eq("id", scheduled.id);
        continue;
      }

      // Insert attachments if any
      const attachments = scheduled.attachments as Array<{
        url: string;
        file_name: string;
        file_type: string;
        file_size: number;
      }>;
      if (attachments && attachments.length > 0 && message) {
        await supabase.from("attachments").insert(
          attachments.map((a) => ({
            message_id: message.id,
            file_url: a.url,
            file_name: a.file_name,
            file_type: a.file_type,
            file_size: a.file_size,
          }))
        );
      }

      // Mark as sent
      await supabase
        .from("scheduled_messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", scheduled.id);

      sentCount++;
    } catch {
      await supabase
        .from("scheduled_messages")
        .update({ status: "failed" })
        .eq("id", scheduled.id);
    }
  }

  return new Response(JSON.stringify({ sent: sentCount }));
});
