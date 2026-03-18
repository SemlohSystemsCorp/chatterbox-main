import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDailyRoom, createMeetingToken, deleteDailyRoom } from "@/lib/daily";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("Daily.co API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDailyRoom", () => {
    it("sends POST request to create a room", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          name: "test-room",
          url: "https://daily.co/test-room",
        }),
      });

      const result = await createDailyRoom({ name: "test-room" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.daily.co/v1/rooms",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual({
        name: "test-room",
        url: "https://daily.co/test-room",
      });
    });

    it("uses private privacy by default", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await createDailyRoom();

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.privacy).toBe("private");
    });

    it("uses 60 minute default expiration", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await createDailyRoom();

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const expectedExp = Math.floor(Date.now() / 1000) + 3600;
      // Allow 2 seconds of difference for test execution time
      expect(body.properties.exp).toBeGreaterThanOrEqual(expectedExp - 2);
      expect(body.properties.exp).toBeLessThanOrEqual(expectedExp + 2);
    });

    it("enables chat and screenshare", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await createDailyRoom();

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.properties.enable_chat).toBe(true);
      expect(body.properties.enable_screenshare).toBe(true);
      expect(body.properties.enable_recording).toBe(false);
    });

    it("throws on failed response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
      });

      await expect(createDailyRoom()).rejects.toThrow(
        "Failed to create Daily room: Bad Request"
      );
    });

    it("respects custom options", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await createDailyRoom({
        name: "custom-room",
        privacy: "public",
        expiresInMinutes: 30,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.name).toBe("custom-room");
      expect(body.privacy).toBe("public");
    });
  });

  describe("createMeetingToken", () => {
    it("sends POST request with room name and user id", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: "abc123" }),
      });

      const result = await createMeetingToken("test-room", "user-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.daily.co/v1/meeting-tokens",
        expect.objectContaining({ method: "POST" })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.properties.room_name).toBe("test-room");
      expect(body.properties.user_id).toBe("user-1");
      expect(body.properties.is_owner).toBe(false);
      expect(result).toEqual({ token: "abc123" });
    });

    it("throws on failed response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
      });

      await expect(createMeetingToken("room", "user")).rejects.toThrow(
        "Failed to create meeting token: Unauthorized"
      );
    });
  });

  describe("deleteDailyRoom", () => {
    it("sends DELETE request with room name", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ deleted: true }),
      });

      await deleteDailyRoom("test-room");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.daily.co/v1/rooms/test-room",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("throws on failed response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      await expect(deleteDailyRoom("nonexistent")).rejects.toThrow(
        "Failed to delete Daily room: Not Found"
      );
    });
  });
});
