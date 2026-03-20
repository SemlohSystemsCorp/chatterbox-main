export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: "giphy", description: "Search for a GIF", usage: "/giphy [search query]" },
  { name: "shrug", description: "Append ¯\\_(ツ)_/¯", usage: "/shrug [message]" },
  { name: "tableflip", description: "Append (╯°□°)╯︵ ┻━┻", usage: "/tableflip [message]" },
  { name: "unflip", description: "Put the table back ┬─┬ノ( º _ ºノ)", usage: "/unflip [message]" },
  { name: "lenny", description: "Append ( ͡° ͜ʖ ͡°)", usage: "/lenny [message]" },
  { name: "me", description: "Send an action message", usage: "/me [action]" },
  { name: "status", description: "Set your status", usage: "/status [emoji] [text]" },
  { name: "clear", description: "Clear your status", usage: "/clear" },
  { name: "8ball", description: "Ask the magic 8-ball", usage: "/8ball [question]" },
  { name: "coin", description: "Flip a coin", usage: "/coin" },
  { name: "roll", description: "Roll dice (default d6)", usage: "/roll [sides]" },
  { name: "spoiler", description: "Send a spoiler message", usage: "/spoiler [text]" },
  { name: "invite", description: "Share an invite link", usage: "/invite" },
  { name: "date", description: "Send the current date and time", usage: "/date" },
  { name: "poll", description: "Create a poll", usage: "/poll" },
  { name: "remind", description: "Set a reminder", usage: "/remind [time] [message]" },
  { name: "todo", description: "Add a to-do item", usage: "/todo [task]" },
  { name: "mute", description: "Mute this channel", usage: "/mute" },
  { name: "unmute", description: "Unmute this channel", usage: "/unmute" },
  { name: "nick", description: "Set a nickname for someone", usage: "/nick @user [nickname]" },
  { name: "dm", description: "Send a direct message", usage: "/dm @user [message]" },
  { name: "code", description: "Send a code block", usage: "/code [language] [code]" },
  { name: "timestamp", description: "Insert a formatted timestamp", usage: "/timestamp" },
];

export interface CommandResult {
  /** "message" = send as normal message, "status" = set status (no message), "giphy" = needs async gif lookup, "clear_status" = clear status, "open_poll" = open poll modal, "mute" / "unmute" = toggle channel mute, "set_nick" = set contact nickname, "open_dm" = open DM with user */
  type: "message" | "status" | "giphy" | "clear_status" | "open_poll" | "mute" | "unmute" | "set_nick" | "open_dm";
  content?: string;
  statusEmoji?: string | null;
  statusText?: string;
  giphyQuery?: string;
  /** Target username for /nick, /dm */
  targetUser?: string;
  /** Nickname value for /nick */
  nickname?: string;
}

export function parseSlashCommand(input: string): { command: string; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) {
    return { command: trimmed.slice(1).toLowerCase(), args: "" };
  }
  return {
    command: trimmed.slice(1, spaceIdx).toLowerCase(),
    args: trimmed.slice(spaceIdx + 1),
  };
}

const EIGHT_BALL_RESPONSES = [
  "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes, definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
  "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful.",
];

export function executeCommand(command: string, args: string, userName: string): CommandResult | null {
  switch (command) {
    case "shrug":
      return { type: "message", content: args ? `${args} ¯\\_(ツ)_/¯` : "¯\\_(ツ)_/¯" };

    case "tableflip":
      return { type: "message", content: args ? `${args} (╯°□°)╯︵ ┻━┻` : "(╯°□°)╯︵ ┻━┻" };

    case "unflip":
      return { type: "message", content: args ? `${args} ┬─┬ノ( º _ ºノ)` : "┬─┬ノ( º _ ºノ)" };

    case "lenny":
      return { type: "message", content: args ? `${args} ( ͡° ͜ʖ ͡°)` : "( ͡° ͜ʖ ͡°)" };

    case "me":
      return { type: "message", content: args ? `*${userName} ${args}*` : undefined };

    case "giphy":
      return { type: "giphy", giphyQuery: args || "random" };

    case "status": {
      if (!args.trim()) return null;
      const emojiMatch = args.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u);
      if (emojiMatch) {
        return {
          type: "status",
          statusEmoji: emojiMatch[1],
          statusText: args.slice(emojiMatch[0].length).trim() || emojiMatch[1],
        };
      }
      return { type: "status", statusEmoji: null, statusText: args.trim() };
    }

    case "clear":
      return { type: "clear_status" };

    case "8ball": {
      const answer = EIGHT_BALL_RESPONSES[Math.floor(Math.random() * EIGHT_BALL_RESPONSES.length)];
      const question = args.trim();
      return {
        type: "message",
        content: question
          ? `🎱 **${question}** — ${answer}`
          : `🎱 ${answer}`,
      };
    }

    case "coin": {
      const result = Math.random() < 0.5 ? "Heads" : "Tails";
      return { type: "message", content: `🪙 Coin flip: **${result}**!` };
    }

    case "roll": {
      const sides = Math.max(2, parseInt(args) || 6);
      const result = Math.floor(Math.random() * sides) + 1;
      return { type: "message", content: `🎲 Rolled a **${result}** (d${sides})` };
    }

    case "spoiler":
      if (!args.trim()) return null;
      return { type: "message", content: `||${args.trim()}||` };

    case "invite":
      return { type: "message", content: `📨 Join me on Chatterbox! ${typeof window !== "undefined" ? window.location.origin : ""}` };

    case "date": {
      const now = new Date();
      return {
        type: "message",
        content: `📅 ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      };
    }

    case "poll":
      return { type: "open_poll" };

    case "remind": {
      if (!args.trim()) return null;
      // Parse: /remind 5m Take out the trash  OR  /remind 2h Check deployment
      const remindMatch = args.match(/^(\d+)\s*(s|sec|m|min|h|hr|d|day)s?\s+(.+)/i);
      if (!remindMatch) {
        return { type: "message", content: `⏰ Usage: /remind <number><s|m|h|d> <message>` };
      }
      const amount = parseInt(remindMatch[1]);
      const unit = remindMatch[2].toLowerCase();
      const reminderText = remindMatch[3].trim();
      const unitLabels: Record<string, string> = { s: "second", sec: "second", m: "minute", min: "minute", h: "hour", hr: "hour", d: "day", day: "day" };
      const label = unitLabels[unit] || unit;
      return {
        type: "message",
        content: `⏰ Reminder set for **${amount} ${label}${amount !== 1 ? "s" : ""}**: ${reminderText}`,
      };
    }

    case "todo": {
      if (!args.trim()) return null;
      return { type: "message", content: `☐ **To-do:** ${args.trim()}` };
    }

    case "mute":
      return { type: "mute" };

    case "unmute":
      return { type: "unmute" };

    case "nick": {
      if (!args.trim()) return null;
      // Parse: /nick @username Cool Nickname
      const nickMatch = args.match(/^@(\S+)\s+(.*)/);
      if (!nickMatch) {
        return { type: "message", content: `Usage: /nick @user [nickname]` };
      }
      return { type: "set_nick", targetUser: nickMatch[1], nickname: nickMatch[2].trim() || undefined };
    }

    case "dm": {
      if (!args.trim()) return null;
      // Parse: /dm @username Hey there!
      const dmMatch = args.match(/^@(\S+)\s*(.*)/);
      if (!dmMatch) {
        return { type: "message", content: `Usage: /dm @user [message]` };
      }
      return { type: "open_dm", targetUser: dmMatch[1], content: dmMatch[2].trim() || undefined };
    }

    case "code": {
      if (!args.trim()) return null;
      // Parse: /code js console.log("hello")  OR  /code just some code
      const codeMatch = args.match(/^(\S+)\s+([\s\S]+)/);
      if (codeMatch) {
        return { type: "message", content: `\`\`\`${codeMatch[1]}\n${codeMatch[2].trim()}\n\`\`\`` };
      }
      return { type: "message", content: `\`\`\`\n${args.trim()}\n\`\`\`` };
    }

    case "timestamp": {
      const now = new Date();
      return {
        type: "message",
        content: `\`${now.toISOString()}\` (${now.toLocaleString()})`,
      };
    }

    default:
      return null;
  }
}
