import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar, POLAR_PRO_PRODUCT_ID } from "@/lib/polar";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boxId } = await request.json();

    if (!boxId) {
      return NextResponse.json(
        { error: "Box ID is required" },
        { status: 400 }
      );
    }

    // Verify user is owner/admin of this box
    const { data: membership } = await supabase
      .from("box_members")
      .select("role")
      .eq("box_id", boxId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only box owners and admins can upgrade" },
        { status: 403 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Get box short_id for redirect
    const { data: box } = await supabase
      .from("boxes")
      .select("short_id, name")
      .eq("id", boxId)
      .single();

    const checkout = await polar.checkouts.create({
      products: [POLAR_PRO_PRODUCT_ID],
      customerEmail: user.email ?? undefined,
      customerName: user.user_metadata?.full_name ?? undefined,
      successUrl: `${appUrl}/checkout?success=true&box=${box?.short_id ?? ""}`,
      metadata: {
        box_id: boxId,
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
