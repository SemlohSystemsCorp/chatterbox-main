import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/stores/ui-store";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      activeModal: null,
      modalData: null,
      commandPaletteOpen: false,
      theme: "system",
    });
  });

  describe("initial state", () => {
    it("starts with default values", () => {
      const state = useUIStore.getState();
      expect(state.activeModal).toBeNull();
      expect(state.modalData).toBeNull();
      expect(state.commandPaletteOpen).toBe(false);
      expect(state.theme).toBe("system");
    });
  });

  describe("openModal / closeModal", () => {
    it("opens a modal", () => {
      useUIStore.getState().openModal("create-box");
      expect(useUIStore.getState().activeModal).toBe("create-box");
    });

    it("opens a modal with data", () => {
      useUIStore.getState().openModal("invite-member", { boxId: "box-1" });
      expect(useUIStore.getState().activeModal).toBe("invite-member");
      expect(useUIStore.getState().modalData).toEqual({ boxId: "box-1" });
    });

    it("closes a modal and clears data", () => {
      useUIStore.getState().openModal("create-channel", { test: true });
      useUIStore.getState().closeModal();
      expect(useUIStore.getState().activeModal).toBeNull();
      expect(useUIStore.getState().modalData).toBeNull();
    });

    it("replaces existing modal", () => {
      useUIStore.getState().openModal("create-box");
      useUIStore.getState().openModal("create-channel");
      expect(useUIStore.getState().activeModal).toBe("create-channel");
    });
  });

  describe("commandPalette", () => {
    it("opens command palette", () => {
      useUIStore.getState().setCommandPaletteOpen(true);
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    });

    it("closes command palette", () => {
      useUIStore.getState().setCommandPaletteOpen(true);
      useUIStore.getState().setCommandPaletteOpen(false);
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe("theme", () => {
    it("sets theme to light", () => {
      useUIStore.getState().setTheme("light");
      expect(useUIStore.getState().theme).toBe("light");
    });

    it("sets theme to dark", () => {
      useUIStore.getState().setTheme("dark");
      expect(useUIStore.getState().theme).toBe("dark");
    });

    it("sets theme to system", () => {
      useUIStore.getState().setTheme("dark");
      useUIStore.getState().setTheme("system");
      expect(useUIStore.getState().theme).toBe("system");
    });
  });
});
