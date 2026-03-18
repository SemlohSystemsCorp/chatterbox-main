import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SLASH_COMMANDS,
  parseSlashCommand,
  executeCommand,
  type SlashCommand,
  type CommandResult,
} from "@/lib/slash-commands";

describe("SLASH_COMMANDS", () => {
  it("has all expected commands", () => {
    const names = SLASH_COMMANDS.map((c) => c.name);
    expect(names).toContain("giphy");
    expect(names).toContain("shrug");
    expect(names).toContain("tableflip");
    expect(names).toContain("unflip");
    expect(names).toContain("lenny");
    expect(names).toContain("me");
    expect(names).toContain("status");
    expect(names).toContain("clear");
    expect(names).toContain("8ball");
    expect(names).toContain("coin");
    expect(names).toContain("roll");
    expect(names).toContain("spoiler");
    expect(names).toContain("invite");
    expect(names).toContain("date");
    expect(names).toContain("poll");
  });

  it("each command has name, description, and usage", () => {
    for (const cmd of SLASH_COMMANDS) {
      expect(cmd.name).toBeTruthy();
      expect(cmd.description).toBeTruthy();
      expect(cmd.usage).toBeTruthy();
    }
  });
});

describe("parseSlashCommand", () => {
  it("returns null for non-slash input", () => {
    expect(parseSlashCommand("hello world")).toBeNull();
  });

  it("parses command without args", () => {
    expect(parseSlashCommand("/shrug")).toEqual({
      command: "shrug",
      args: "",
    });
  });

  it("parses command with args", () => {
    expect(parseSlashCommand("/shrug whatever")).toEqual({
      command: "shrug",
      args: "whatever",
    });
  });

  it("lowercases command name", () => {
    expect(parseSlashCommand("/SHRUG test")).toEqual({
      command: "shrug",
      args: "test",
    });
  });

  it("trims whitespace from input", () => {
    const result = parseSlashCommand("  /shrug  ");
    expect(result?.command).toBe("shrug");
    // After trim: "/shrug" — no space means no args
    expect(result?.args).toBe("");
  });

  it("returns null for empty string", () => {
    expect(parseSlashCommand("")).toBeNull();
  });

  it("parses command with multiple args", () => {
    expect(parseSlashCommand("/me is doing something")).toEqual({
      command: "me",
      args: "is doing something",
    });
  });
});

describe("executeCommand", () => {
  const userName = "TestUser";

  describe("shrug", () => {
    it("returns shrug face without args", () => {
      const result = executeCommand("shrug", "", userName);
      expect(result).toEqual({
        type: "message",
        content: "¯\\_(ツ)_/¯",
      });
    });

    it("appends shrug face to args", () => {
      const result = executeCommand("shrug", "oh well", userName);
      expect(result).toEqual({
        type: "message",
        content: "oh well ¯\\_(ツ)_/¯",
      });
    });
  });

  describe("tableflip", () => {
    it("returns tableflip without args", () => {
      const result = executeCommand("tableflip", "", userName);
      expect(result?.content).toBe("(╯°□°)╯︵ ┻━┻");
    });

    it("appends tableflip to message", () => {
      const result = executeCommand("tableflip", "rage", userName);
      expect(result?.content).toBe("rage (╯°□°)╯︵ ┻━┻");
    });
  });

  describe("unflip", () => {
    it("returns unflip without args", () => {
      const result = executeCommand("unflip", "", userName);
      expect(result?.content).toBe("┬─┬ノ( º _ ºノ)");
    });
  });

  describe("lenny", () => {
    it("returns lenny face without args", () => {
      const result = executeCommand("lenny", "", userName);
      expect(result?.content).toBe("( ͡° ͜ʖ ͡°)");
    });

    it("appends lenny face to message", () => {
      const result = executeCommand("lenny", "hey", userName);
      expect(result?.content).toBe("hey ( ͡° ͜ʖ ͡°)");
    });
  });

  describe("me", () => {
    it("wraps action in italics", () => {
      const result = executeCommand("me", "is testing", userName);
      expect(result).toEqual({
        type: "message",
        content: "*TestUser is testing*",
      });
    });

    it("returns undefined content for empty args", () => {
      const result = executeCommand("me", "", userName);
      expect(result?.content).toBeUndefined();
    });
  });

  describe("giphy", () => {
    it("returns giphy type with query", () => {
      const result = executeCommand("giphy", "cats", userName);
      expect(result).toEqual({
        type: "giphy",
        giphyQuery: "cats",
      });
    });

    it("defaults to random for no args", () => {
      const result = executeCommand("giphy", "", userName);
      expect(result?.giphyQuery).toBe("random");
    });
  });

  describe("status", () => {
    it("returns null for empty args", () => {
      expect(executeCommand("status", "", userName)).toBeNull();
      expect(executeCommand("status", "   ", userName)).toBeNull();
    });

    it("parses text-only status", () => {
      const result = executeCommand("status", "busy", userName);
      expect(result).toEqual({
        type: "status",
        statusEmoji: null,
        statusText: "busy",
      });
    });
  });

  describe("clear", () => {
    it("returns clear_status type", () => {
      expect(executeCommand("clear", "", userName)).toEqual({
        type: "clear_status",
      });
    });
  });

  describe("8ball", () => {
    it("returns a message with a response", () => {
      const result = executeCommand("8ball", "Will it work?", userName);
      expect(result?.type).toBe("message");
      expect(result?.content).toContain("🎱");
      expect(result?.content).toContain("Will it work?");
    });

    it("works without a question", () => {
      const result = executeCommand("8ball", "", userName);
      expect(result?.type).toBe("message");
      expect(result?.content).toContain("🎱");
    });
  });

  describe("coin", () => {
    it("returns heads or tails", () => {
      const result = executeCommand("coin", "", userName);
      expect(result?.type).toBe("message");
      expect(result?.content).toContain("🪙");
      expect(
        result?.content?.includes("Heads") || result?.content?.includes("Tails")
      ).toBe(true);
    });
  });

  describe("roll", () => {
    it("rolls a d6 by default", () => {
      const result = executeCommand("roll", "", userName);
      expect(result?.type).toBe("message");
      expect(result?.content).toContain("🎲");
      expect(result?.content).toContain("d6");
    });

    it("rolls custom dice", () => {
      const result = executeCommand("roll", "20", userName);
      expect(result?.content).toContain("d20");
    });

    it("enforces minimum of 2 sides", () => {
      const result = executeCommand("roll", "1", userName);
      expect(result?.content).toContain("d2");
    });
  });

  describe("spoiler", () => {
    it("wraps text in spoiler tags", () => {
      const result = executeCommand("spoiler", "secret stuff", userName);
      expect(result).toEqual({
        type: "message",
        content: "||secret stuff||",
      });
    });

    it("returns null for empty text", () => {
      expect(executeCommand("spoiler", "", userName)).toBeNull();
      expect(executeCommand("spoiler", "   ", userName)).toBeNull();
    });
  });

  describe("invite", () => {
    it("returns invite message", () => {
      const result = executeCommand("invite", "", userName);
      expect(result?.type).toBe("message");
      expect(result?.content).toContain("📨");
      expect(result?.content).toContain("Join me on Chatterbox!");
    });
  });

  describe("date", () => {
    it("returns current date and time", () => {
      const result = executeCommand("date", "", userName);
      expect(result?.type).toBe("message");
      expect(result?.content).toContain("📅");
    });
  });

  describe("poll", () => {
    it("returns open_poll type", () => {
      expect(executeCommand("poll", "", userName)).toEqual({
        type: "open_poll",
      });
    });
  });

  describe("unknown command", () => {
    it("returns null for unknown commands", () => {
      expect(executeCommand("nonexistent", "", userName)).toBeNull();
    });
  });
});
