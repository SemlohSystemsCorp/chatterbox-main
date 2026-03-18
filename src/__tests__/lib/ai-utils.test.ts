import { describe, it, expect } from "vitest";
import { formatMessagesForClaude, type ContextMessage } from "@/lib/ai-utils";

describe("formatMessagesForClaude", () => {
  const messages: ContextMessage[] = [
    {
      id: "1",
      content: "Hello everyone!",
      created_at: "2024-06-15T12:00:00Z",
      sender_name: "Alice",
      channel_name: "general",
    },
    {
      id: "2",
      content: "Hey Alice!",
      created_at: "2024-06-15T12:05:00Z",
      sender_name: "Bob",
      channel_name: "general",
    },
  ];

  it("formats messages with sender names and content", () => {
    const result = formatMessagesForClaude(messages);
    expect(result).toContain("Alice: Hello everyone!");
    expect(result).toContain("Bob: Hey Alice!");
  });

  it("includes channel name with # prefix", () => {
    const result = formatMessagesForClaude(messages);
    expect(result).toContain("#general");
  });

  it("sorts messages by created_at ascending", () => {
    const reversed = [...messages].reverse();
    const result = formatMessagesForClaude(reversed);
    const lines = result.split("\n");
    expect(lines[0]).toContain("Alice");
    expect(lines[1]).toContain("Bob");
  });

  it("handles messages without channel name", () => {
    const dms: ContextMessage[] = [
      {
        id: "1",
        content: "DM message",
        created_at: "2024-06-15T12:00:00Z",
        sender_name: "Alice",
        channel_name: null,
      },
    ];
    const result = formatMessagesForClaude(dms);
    expect(result).toContain("Alice: DM message");
    expect(result).not.toContain("#");
  });

  it("handles empty array", () => {
    const result = formatMessagesForClaude([]);
    expect(result).toBe("");
  });

  it("does not mutate original array", () => {
    const original = [...messages];
    formatMessagesForClaude(messages);
    expect(messages).toEqual(original);
  });
});
