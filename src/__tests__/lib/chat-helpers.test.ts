import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatTime,
  formatDate,
  shouldShowDate,
  getInitials,
  isGrouped,
  type MessageData,
} from "@/lib/chat-helpers";

describe("formatTime", () => {
  it("formats a date string to time", () => {
    const result = formatTime("2024-01-15T14:30:00Z");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("handles ISO date strings", () => {
    const result = formatTime("2024-06-01T09:05:00Z");
    expect(result).toBeTruthy();
  });
});

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for current date', () => {
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    expect(formatDate("2024-06-15T08:30:00Z")).toBe("Today");
  });

  it('returns "Yesterday" for previous day', () => {
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    expect(formatDate("2024-06-14T20:00:00Z")).toBe("Yesterday");
  });

  it("returns formatted date for older dates", () => {
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    const result = formatDate("2024-06-10T12:00:00Z");
    expect(result).not.toBe("Today");
    expect(result).not.toBe("Yesterday");
    expect(typeof result).toBe("string");
  });
});

describe("shouldShowDate", () => {
  it("returns true when previous is null", () => {
    expect(shouldShowDate("2024-06-15T12:00:00Z", null)).toBe(true);
  });

  it("returns false for same day messages", () => {
    expect(
      shouldShowDate("2024-06-15T12:00:00Z", "2024-06-15T08:00:00Z")
    ).toBe(false);
  });

  it("returns true for different day messages", () => {
    expect(
      shouldShowDate("2024-06-15T12:00:00Z", "2024-06-14T08:00:00Z")
    ).toBe(true);
  });
});

describe("getInitials", () => {
  it("returns initials from full name", () => {
    expect(getInitials("John Doe", "john@example.com")).toBe("JD");
  });

  it("returns single initial for single name", () => {
    expect(getInitials("Alice", "alice@example.com")).toBe("A");
  });

  it("returns max 2 characters", () => {
    expect(getInitials("John Michael Doe", "john@example.com")).toBe("JM");
  });

  it("falls back to email initial when name is empty", () => {
    expect(getInitials("", "alice@example.com")).toBe("A");
  });

  it('returns "?" when both are empty', () => {
    expect(getInitials("", "")).toBe("?");
  });

  it("uppercases initials", () => {
    expect(getInitials("john doe", "john@example.com")).toBe("JD");
  });
});

describe("isGrouped", () => {
  const makeSender = (id: string) => ({
    id,
    full_name: "Test",
    email: "test@test.com",
    avatar_url: null,
  });

  const makeMessage = (
    senderId: string,
    createdAt: string
  ): MessageData => ({
    id: "msg-1",
    content: "hello",
    created_at: createdAt,
    edited_at: null,
    sender_id: senderId,
    parent_message_id: null,
    reactions: [],
    sender: makeSender(senderId),
  });

  it("returns false when previous is null", () => {
    const msg = makeMessage("user-1", "2024-06-15T12:00:00Z");
    expect(isGrouped(msg, null)).toBe(false);
  });

  it("returns false for different senders", () => {
    const current = makeMessage("user-1", "2024-06-15T12:01:00Z");
    const previous = makeMessage("user-2", "2024-06-15T12:00:00Z");
    expect(isGrouped(current, previous)).toBe(false);
  });

  it("returns true for same sender within 5 minutes", () => {
    const current = makeMessage("user-1", "2024-06-15T12:04:00Z");
    const previous = makeMessage("user-1", "2024-06-15T12:00:00Z");
    expect(isGrouped(current, previous)).toBe(true);
  });

  it("returns false for same sender beyond 5 minutes", () => {
    const current = makeMessage("user-1", "2024-06-15T12:06:00Z");
    const previous = makeMessage("user-1", "2024-06-15T12:00:00Z");
    expect(isGrouped(current, previous)).toBe(false);
  });

  it("returns false for exactly 5 minutes apart", () => {
    const current = makeMessage("user-1", "2024-06-15T12:05:00Z");
    const previous = makeMessage("user-1", "2024-06-15T12:00:00Z");
    expect(isGrouped(current, previous)).toBe(false);
  });
});
