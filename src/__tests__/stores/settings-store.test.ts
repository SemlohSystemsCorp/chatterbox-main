import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "@/stores/settings-store";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useSettingsStore", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    useSettingsStore.setState({
      loaded: false,
      saving: false,
    });
  });

  describe("default settings", () => {
    it("has sensible defaults", () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.theme).toBe("dark");
      expect(settings.send_on_enter).toBe(true);
      expect(settings.show_link_previews).toBe(true);
      expect(settings.language).toBe("en");
      expect(settings.timezone).toBe("UTC");
      expect(settings.compact_mode).toBe(false);
      expect(settings.notifications_enabled).toBe(true);
    });
  });

  describe("setSettings", () => {
    it("merges partial settings", () => {
      useSettingsStore.getState().setSettings({ theme: "light" });
      expect(useSettingsStore.getState().settings.theme).toBe("light");
      // Other settings should remain
      expect(useSettingsStore.getState().settings.language).toBe("en");
    });

    it("saves to localStorage", () => {
      useSettingsStore.getState().setSettings({ theme: "light" });
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe("updateSetting", () => {
    it("updates a single setting", () => {
      // Mock fetch for saveToServer
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      useSettingsStore.getState().updateSetting("compact_mode", true);
      expect(useSettingsStore.getState().settings.compact_mode).toBe(true);
    });
  });

  describe("loadFromServer", () => {
    it("loads settings from the API", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          settings: {
            theme: "light",
            compact_mode: true,
          },
        }),
      });

      await useSettingsStore.getState().loadFromServer();
      expect(useSettingsStore.getState().settings.theme).toBe("light");
      expect(useSettingsStore.getState().settings.compact_mode).toBe(true);
      expect(useSettingsStore.getState().loaded).toBe(true);
    });

    it("handles fetch failure gracefully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

      await useSettingsStore.getState().loadFromServer();
      // Should not crash, settings should remain defaults
      expect(useSettingsStore.getState().settings.theme).toBeTruthy();
    });

    it("handles network error gracefully", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await useSettingsStore.getState().loadFromServer();
      expect(useSettingsStore.getState().settings.theme).toBeTruthy();
    });
  });

  describe("saveToServer", () => {
    it("sends PATCH request with updates", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = mockFetch;

      await useSettingsStore.getState().saveToServer({ theme: "dark" });

      expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: "dark" }),
      });
    });

    it("sets saving flag during save", async () => {
      let resolveFetch: () => void;
      globalThis.fetch = vi.fn().mockImplementation(
        () =>
          new Promise<{ ok: boolean }>((resolve) => {
            resolveFetch = () => resolve({ ok: true });
          })
      );

      const promise = useSettingsStore.getState().saveToServer({ theme: "light" });
      expect(useSettingsStore.getState().saving).toBe(true);

      resolveFetch!();
      await promise;
      expect(useSettingsStore.getState().saving).toBe(false);
    });
  });
});
