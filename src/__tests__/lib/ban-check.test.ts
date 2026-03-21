import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { useBanCheck } from "@/hooks/use-ban-check";

describe("useBanCheck hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Default: not banned
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ banned: false, ban_reason: null, banned_until: null }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with banned: false", () => {
    const { result } = renderHook(() => useBanCheck());
    expect(result.current.banned).toBe(false);
    expect(result.current.ban_reason).toBeNull();
    expect(result.current.banned_until).toBeNull();
  });

  it("calls /api/auth/ban-status on mount", async () => {
    renderHook(() => useBanCheck());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/ban-status");
    });
  });

  it("detects a ban when API returns banned: true", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        banned: true,
        ban_reason: "Spamming",
        banned_until: "2026-12-31T00:00:00Z",
      }),
    });

    const { result } = renderHook(() => useBanCheck());

    await waitFor(() => {
      expect(result.current.banned).toBe(true);
      expect(result.current.ban_reason).toBe("Spamming");
      expect(result.current.banned_until).toBe("2026-12-31T00:00:00Z");
    });
  });

  it("polls at 15 second intervals", async () => {
    const { result } = renderHook(() => useBanCheck());

    // Wait for initial fetch
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Advance 15 seconds
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Advance another 15 seconds
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  it("checks on window focus", async () => {
    renderHook(() => useBanCheck());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Simulate window focus
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it("handles network errors gracefully (stays not banned)", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBanCheck());

    // Should not crash, state stays default
    await waitFor(() => {
      expect(result.current.banned).toBe(false);
    });
  });

  it("handles non-ok response gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useBanCheck());

    await waitFor(() => {
      expect(result.current.banned).toBe(false);
    });
  });

  it("detects ban during polling (user gets banned mid-session)", async () => {
    // Start not banned
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ banned: false, ban_reason: null, banned_until: null }),
    });

    const { result } = renderHook(() => useBanCheck());

    await waitFor(() => {
      expect(result.current.banned).toBe(false);
    });

    // Admin bans user - next poll returns banned
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        banned: true,
        ban_reason: "Inappropriate behavior",
        banned_until: "2026-06-01T00:00:00Z",
      }),
    });

    // Advance to next poll
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    await waitFor(() => {
      expect(result.current.banned).toBe(true);
      expect(result.current.ban_reason).toBe("Inappropriate behavior");
    });
  });

  it("cleans up interval and listener on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useBanCheck());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("focus", expect.any(Function));

    // Verify no more fetches after unmount
    const callCountAtUnmount = mockFetch.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    // No new calls after unmount
    expect(mockFetch).toHaveBeenCalledTimes(callCountAtUnmount);
  });
});
