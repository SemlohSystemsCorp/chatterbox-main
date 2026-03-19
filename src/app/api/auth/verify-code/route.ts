import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, code, type = "email_verification" } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Find the most recent unused code for this email
    const { data: record, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("type", type)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !record) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check max attempts
    if (record.attempts >= record.max_attempts) {
      // Mark as used so it can't be retried
      await supabaseAdmin
        .from("verification_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", record.id);

      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // Increment attempts
    const { error: incrError } = await supabaseAdmin
      .from("verification_codes")
      .update({ attempts: record.attempts + 1 })
      .eq("id", record.id);

    if (incrError) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 500 }
      );
    }

    // Check code
    if (record.code !== code) {
      const remaining = record.max_attempts - record.attempts - 1;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Incorrect code. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .from("verification_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id);

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
