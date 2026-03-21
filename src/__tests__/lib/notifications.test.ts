import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the settings store before importing
const mockGetState = vi.fn();
vi.mock("@/stores/settings-store", () => ({
  useSettingsStore: { getState: () => mockGetState() },
}));

// Mock tauri
vi.mock("@/lib/tauri", () => ({
  isTauri: false,
  sendNativeNotification: vi.fn(),
}));

import { isDndActive } from "@/lib/notifications";

function makeSettings(overrides: Record<string, unknown> = {}) {
  return {
    settings: {
      mute_all_sounds: false,
      notification_schedule_enabled: false,
      notification_schedule_days: "mon,tue,wed,thu,fri",
      notification_schedule_start: "09:00",
      notification_schedule_end: "17:00",
      ...overrides,
    },
  };
}

describe("isDndActive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when mute_all_sounds is enabled", () => {
    mockGetState.mockReturnValue(makeSettings({ mute_all_sounds: true }));
    expect(isDndActive()).toBe(true);
  });

  it("returns false when schedule is disabled and not muted", () => {
    mockGetState.mockReturnValue(makeSettings({
      mute_all_sounds: false,
      notification_schedule_enabled: false,
    }));
    expect(isDndActive()).toBe(false);
  });

  it("returns true when today is not in active days", () => {
    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayNames[now.getDay()];
    // Set active days to NOT include today
    const otherDays = dayNames.filter((d) => d !== today).join(",");

    mockGetState.mockReturnValue(makeSettings({
      notification_schedule_enabled: true,
      notification_schedule_days: otherDays,
    }));

    expect(isDndActive()).toBe(true);
  });

  it("returns false when today is in active days and within time window", () => {
    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayNames[now.getDay()];
    // Set the window to include current time
    const startHour = Math.max(0, now.getHours() - 1);
    const endHour = Math.min(23, now.getHours() + 1);

    mockGetState.mockReturnValue(makeSettings({
      notification_schedule_enabled: true,
      notification_schedule_days: today,
      notification_schedule_start: `${String(startHour).padStart(2, "0")}:00`,
      notification_schedule_end: `${String(endHour).padStart(2, "0")}:59`,
    }));

    expect(isDndActive()).toBe(false);
  });

  it("returns true when current time is before the schedule start", () => {
    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayNames[now.getDay()];
    // Set start to be after current time
    const laterHour = Math.min(23, now.getHours() + 2);

    mockGetState.mockReturnValue(makeSettings({
      notification_schedule_enabled: true,
      notification_schedule_days: today,
      notification_schedule_start: `${String(laterHour).padStart(2, "0")}:00`,
      notification_schedule_end: "23:59",
    }));

    expect(isDndActive()).toBe(true);
  });

  it("returns true when current time is after the schedule end", () => {
    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayNames[now.getDay()];
    // Set end to be before current time
    const earlierHour = Math.max(0, now.getHours() - 2);

    mockGetState.mockReturnValue(makeSettings({
      notification_schedule_enabled: true,
      notification_schedule_days: today,
      notification_schedule_start: "00:00",
      notification_schedule_end: `${String(earlierHour).padStart(2, "0")}:00`,
    }));

    expect(isDndActive()).toBe(true);
  });

  it("handles all days in schedule", () => {
    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayNames[now.getDay()];

    mockGetState.mockReturnValue(makeSettings({
      notification_schedule_enabled: true,
      notification_schedule_days: "sun,mon,tue,wed,thu,fri,sat",
      notification_schedule_start: "00:00",
      notification_schedule_end: "23:59",
    }));

    expect(isDndActive()).toBe(false);
  });

  it("mute_all_sounds takes precedence over schedule", () => {
    mockGetState.mockReturnValue(makeSettings({
      mute_all_sounds: true,
      notification_schedule_enabled: true,
      notification_schedule_days: "sun,mon,tue,wed,thu,fri,sat",
      notification_schedule_start: "00:00",
      notification_schedule_end: "23:59",
    }));

    expect(isDndActive()).toBe(true);
  });
});
