import { describe, it, expect } from "vitest";
import {
  welcomeEmail,
  inviteEmail,
  notificationEmail,
  subscriptionReceiptEmail,
  verificationCodeEmail,
} from "@/lib/email-templates";

describe("welcomeEmail", () => {
  it("includes the user's name", () => {
    const html = welcomeEmail("Alice", "https://example.com/login");
    expect(html).toContain("Alice");
  });

  it("includes the login URL", () => {
    const html = welcomeEmail("Alice", "https://example.com/login");
    expect(html).toContain("https://example.com/login");
  });

  it("is valid HTML with doctype", () => {
    const html = welcomeEmail("Alice", "https://example.com/login");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes Chatterbox branding", () => {
    const html = welcomeEmail("Alice", "https://example.com/login");
    expect(html).toContain("Chatterbox");
    expect(html).toContain("Welcome to Chatterbox");
  });
});

describe("inviteEmail", () => {
  it("includes inviter name and box name", () => {
    const html = inviteEmail("Bob", "My Team", "https://example.com/invite/abc");
    expect(html).toContain("Bob");
    expect(html).toContain("My Team");
  });

  it("includes the invite URL", () => {
    const html = inviteEmail("Bob", "My Team", "https://example.com/invite/abc");
    expect(html).toContain("https://example.com/invite/abc");
  });

  it("has Accept invite CTA", () => {
    const html = inviteEmail("Bob", "My Team", "https://example.com/invite/abc");
    expect(html).toContain("Accept invite");
  });

  it("includes safety notice for unexpected invites", () => {
    const html = inviteEmail("Bob", "My Team", "https://example.com/invite/abc");
    expect(html).toContain("safely ignore this email");
  });
});

describe("notificationEmail", () => {
  it("includes actor name and title", () => {
    const html = notificationEmail(
      "Alice",
      "New message",
      "Hey there!",
      "https://example.com/messages"
    );
    expect(html).toContain("Alice");
    expect(html).toContain("New message");
  });

  it("includes the body content", () => {
    const html = notificationEmail(
      "Alice",
      "New message",
      "Hey there!",
      "https://example.com/messages"
    );
    expect(html).toContain("Hey there!");
  });

  it("includes action URL in CTA", () => {
    const html = notificationEmail(
      "Alice",
      "New message",
      "Hello",
      "https://example.com/messages"
    );
    expect(html).toContain("https://example.com/messages");
    expect(html).toContain("View in Chatterbox");
  });

  it("handles empty body", () => {
    const html = notificationEmail(
      "Alice",
      "New message",
      "",
      "https://example.com/messages"
    );
    expect(html).toContain("Alice");
    expect(html).not.toContain("background-color:#f4f4f5;border-radius:10px;font-size:14px");
  });
});

describe("subscriptionReceiptEmail", () => {
  const params = {
    customerName: "George",
    planName: "Pro",
    boxName: "My Workspace",
    amount: "$9.99",
    currency: "usd",
    interval: "month",
    dashboardUrl: "https://example.com/dashboard",
  };

  it("includes customer name", () => {
    const html = subscriptionReceiptEmail(params);
    expect(html).toContain("George");
  });

  it("includes plan details", () => {
    const html = subscriptionReceiptEmail(params);
    expect(html).toContain("Pro");
    expect(html).toContain("My Workspace");
    expect(html).toContain("$9.99");
    expect(html).toContain("USD");
    expect(html).toContain("month");
  });

  it("includes dashboard URL", () => {
    const html = subscriptionReceiptEmail(params);
    expect(html).toContain("https://example.com/dashboard");
  });

  it("has Subscription confirmed heading", () => {
    const html = subscriptionReceiptEmail(params);
    expect(html).toContain("Subscription confirmed");
  });

  it("handles empty customer name", () => {
    const html = subscriptionReceiptEmail({ ...params, customerName: "" });
    expect(html).toContain("Thanks!");
    expect(html).not.toContain("Thanks, !");
  });
});

describe("verificationCodeEmail", () => {
  it("includes the verification code", () => {
    const html = verificationCodeEmail("123456");
    expect(html).toContain("123456");
  });

  it("mentions code expiration", () => {
    const html = verificationCodeEmail("123456");
    expect(html).toContain("10 minutes");
  });

  it("has Verify your email heading", () => {
    const html = verificationCodeEmail("123456");
    expect(html).toContain("Verify your email");
  });

  it("includes safety notice", () => {
    const html = verificationCodeEmail("123456");
    expect(html).toContain("safely ignore this email");
  });
});
