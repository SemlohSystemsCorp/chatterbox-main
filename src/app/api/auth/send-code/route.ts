import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { verificationCodeEmail } from "@/lib/email-templates";

function generateCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

export async function POST(request: Request) {
  try {
    const { email, type = "email_verification" } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // For signup: check if an account with this email already exists
    if (type === "email_verification") {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        return NextResponse.json(
          { error: "An account with this email already exists. Try logging in instead." },
          { status: 409 }
        );
      }
    }

    // Rate limit: max 3 codes per email in the last 10 minutes
    const { data: recentCodes } = await supabaseAdmin
      .from("verification_codes")
      .select("id")
      .eq("email", email)
      .eq("type", type)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (recentCodes && recentCodes.length >= 3) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        email,
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to store verification code:", insertError);
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }

    // Send via Resend
    const { error: emailError } = await resend.emails.send({
      from: `Chatterbox <${FROM_EMAIL}>`,
      to: email,
      subject: `${code} is your Chatterbox verification code`,
      html: verificationCodeEmail(code),
    });

    if (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
