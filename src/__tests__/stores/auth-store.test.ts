import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isLoading: true,
    });
  });

  it("starts with null user and loading true", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it("setUser updates the user", () => {
    const mockUser: User = {
      id: "user-1",
      email: "test@test.com",
      full_name: "Test User",
      avatar_url: null,
      status: "online",
      status_message: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("setUser can set user to null", () => {
    const mockUser: User = {
      id: "user-1",
      email: "test@test.com",
      full_name: "Test User",
      avatar_url: null,
      status: "online",
      status_message: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setLoading updates loading state", () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
