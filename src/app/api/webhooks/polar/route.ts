import { NextResponse } from "next/server";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { subscriptionReceiptEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = validateEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET!);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 403 }
      );
    }
    throw error;
  }

  const type = event.type;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getchatterbox.app";

  // ── Subscription activated ──
  if (
    type === "subscription.created" ||
    type === "subscription.active"
  ) {
    const subscription = event.data;
    const boxId = subscription.metadata?.box_id as string | undefined;
    const userId = subscription.metadata?.user_id as string | undefined;
    const customerEmail = subscription.customer?.email;
    const customerName = subscription.customer?.name || "";
    const productName = subscription.product?.name || "Pro";
    const amount = subscription.amount ?? 0;
    const currency = subscription.currency ?? "usd";
    const recurringInterval = subscription.recurringInterval ?? "month";

    if (boxId) {
      // Update box plan
      const { data: box, error: boxError } = await supabaseAdmin
        .from("boxes")
        .update({
          plan: "pro",
          polar_subscription_id: subscription.id,
          polar_customer_id: subscription.customerId,
        })
        .eq("id", boxId)
        .select("name, short_id")
        .single();

      if (boxError) {
        console.error("Failed to update box:", boxError);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
      }

      // Store subscription record
      const { error: subError } = await supabaseAdmin.from("subscriptions").upsert(
        {
          id: subscription.id,
          box_id: boxId,
          user_id: userId || null,
          polar_customer_id: subscription.customerId,
          status: subscription.status,
          plan: "pro",
          amount,
          currency,
          interval: recurringInterval,
          current_period_start: subscription.currentPeriodStart,
          current_period_end: subscription.currentPeriodEnd,
          created_at: subscription.createdAt,
        },
        { onConflict: "id" }
      );

      if (subError) {
        console.error("Failed to upsert subscription:", subError);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
      }

      // Send receipt email
      if (customerEmail && box) {
        const formattedAmount = (amount / 100).toFixed(2);
        await resend.emails.send({
          from: `Chatterbox <${FROM_EMAIL}>`,
          to: customerEmail,
          subject: `Receipt: Chatterbox ${productName} for ${box.name}`,
          html: subscriptionReceiptEmail({
            customerName,
            planName: productName,
            boxName: box.name,
            amount: `$${formattedAmount}`,
            currency,
            interval: recurringInterval,
            dashboardUrl: `${appUrl}/box/${box.short_id}`,
          }),
        }).catch((err) => {
          console.error("Failed to send receipt email:", err);
        });
      }
    }
  }

  // ── Subscription updated ──
  if (type === "subscription.updated") {
    const subscription = event.data;
    const boxId = subscription.metadata?.box_id as string | undefined;

    if (boxId) {
      const { error: boxError } = await supabaseAdmin
        .from("boxes")
        .update({ plan: "pro" })
        .eq("id", boxId);

      if (boxError) {
        console.error("Failed to update box:", boxError);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
      }

      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: subscription.status,
          amount: subscription.amount ?? 0,
          current_period_start: subscription.currentPeriodStart,
          current_period_end: subscription.currentPeriodEnd,
        })
        .eq("id", subscription.id);

      if (subError) {
        console.error("Failed to update subscription:", subError);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
      }
    }
  }

  // ── Subscription canceled / revoked ──
  if (
    type === "subscription.canceled" ||
    type === "subscription.revoked"
  ) {
    const subscription = event.data;
    const boxId = subscription.metadata?.box_id as string | undefined;

    if (boxId) {
      const { error: boxError } = await supabaseAdmin
        .from("boxes")
        .update({ plan: "free", polar_subscription_id: null })
        .eq("id", boxId);

      if (boxError) {
        console.error("Failed to update box:", boxError);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
      }

      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: subscription.status,
          canceled_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (subError) {
        console.error("Failed to update subscription:", subError);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
