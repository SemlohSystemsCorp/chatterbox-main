import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@/stores/chat-store";
import type { Box, Channel, Message } from "@/types";

const mockBox: Box = {
  id: "box-1",
  name: "Test Box",
  slug: "test-box",
  description: null,
  icon_url: null,
  owner_id: "user-1",
  plan: "free",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockChannel: Channel = {
  id: "ch-1",
  box_id: "box-1",
  name: "general",
  description: null,
  is_private: false,
  is_archived: false,
  created_by: "user-1",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockMessage: Message = {
  id: "msg-1",
  channel_id: "ch-1",
  conversation_id: null,
  joint_channel_id: null,
  sender_id: "user-1",
  content: "Hello world",
  edited_at: null,
  parent_message_id: null,
  attachments: [],
  reactions: [],
  created_at: "2024-01-01T00:00:00Z",
};

describe("useChatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      activeBox: null,
      activeChannel: null,
      activeConversation: null,
      boxes: [],
      channels: [],
      messages: [],
      conversations: [],
      sidebarOpen: true,
      threadOpen: false,
      activeThreadMessageId: null,
    });
  });

  describe("initial state", () => {
    it("starts with empty/null values", () => {
      const state = useChatStore.getState();
      expect(state.activeBox).toBeNull();
      expect(state.activeChannel).toBeNull();
      expect(state.activeConversation).toBeNull();
      expect(state.boxes).toEqual([]);
      expect(state.channels).toEqual([]);
      expect(state.messages).toEqual([]);
      expect(state.conversations).toEqual([]);
      expect(state.sidebarOpen).toBe(true);
      expect(state.threadOpen).toBe(false);
      expect(state.activeThreadMessageId).toBeNull();
    });
  });

  describe("setActiveBox", () => {
    it("sets the active box", () => {
      useChatStore.getState().setActiveBox(mockBox);
      expect(useChatStore.getState().activeBox).toEqual(mockBox);
    });

    it("can clear the active box", () => {
      useChatStore.getState().setActiveBox(mockBox);
      useChatStore.getState().setActiveBox(null);
      expect(useChatStore.getState().activeBox).toBeNull();
    });
  });

  describe("setActiveChannel", () => {
    it("sets the active channel", () => {
      useChatStore.getState().setActiveChannel(mockChannel);
      expect(useChatStore.getState().activeChannel).toEqual(mockChannel);
    });
  });

  describe("setBoxes / setChannels", () => {
    it("sets boxes array", () => {
      useChatStore.getState().setBoxes([mockBox]);
      expect(useChatStore.getState().boxes).toHaveLength(1);
      expect(useChatStore.getState().boxes[0]).toEqual(mockBox);
    });

    it("sets channels array", () => {
      useChatStore.getState().setChannels([mockChannel]);
      expect(useChatStore.getState().channels).toHaveLength(1);
    });
  });

  describe("message operations", () => {
    it("sets messages", () => {
      useChatStore.getState().setMessages([mockMessage]);
      expect(useChatStore.getState().messages).toHaveLength(1);
    });

    it("adds a message", () => {
      useChatStore.getState().setMessages([mockMessage]);
      const newMsg: Message = { ...mockMessage, id: "msg-2", content: "Hi" };
      useChatStore.getState().addMessage(newMsg);
      expect(useChatStore.getState().messages).toHaveLength(2);
    });

    it("updates a message", () => {
      useChatStore.getState().setMessages([mockMessage]);
      useChatStore.getState().updateMessage("msg-1", { content: "Updated" });
      expect(useChatStore.getState().messages[0].content).toBe("Updated");
    });

    it("does not update non-existent message", () => {
      useChatStore.getState().setMessages([mockMessage]);
      useChatStore.getState().updateMessage("msg-999", { content: "Nope" });
      expect(useChatStore.getState().messages[0].content).toBe("Hello world");
    });

    it("removes a message", () => {
      useChatStore.getState().setMessages([mockMessage]);
      useChatStore.getState().removeMessage("msg-1");
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it("does not remove non-existent message", () => {
      useChatStore.getState().setMessages([mockMessage]);
      useChatStore.getState().removeMessage("msg-999");
      expect(useChatStore.getState().messages).toHaveLength(1);
    });
  });

  describe("sidebar and thread state", () => {
    it("toggles sidebar", () => {
      useChatStore.getState().setSidebarOpen(false);
      expect(useChatStore.getState().sidebarOpen).toBe(false);
    });

    it("opens thread with message id", () => {
      useChatStore.getState().setThreadOpen(true, "msg-1");
      expect(useChatStore.getState().threadOpen).toBe(true);
      expect(useChatStore.getState().activeThreadMessageId).toBe("msg-1");
    });

    it("closes thread and clears message id", () => {
      useChatStore.getState().setThreadOpen(true, "msg-1");
      useChatStore.getState().setThreadOpen(false);
      expect(useChatStore.getState().threadOpen).toBe(false);
      expect(useChatStore.getState().activeThreadMessageId).toBeNull();
    });
  });
});
