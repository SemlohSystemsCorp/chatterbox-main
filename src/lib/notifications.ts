"use client";

import { isTauri, sendNativeNotification } from "@/lib/tauri";
import { useSettingsStore } from "@/stores/settings-store";

// ── Push Notification Utilities (via Service Worker) ──

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

/** Check if browser supports notifications + service workers */
export function isNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

/** Get current notification permission state */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** Request notification permission from the user */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/** Register the service worker. Returns the registration or null. */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    if (registration.active) return registration;

    return new Promise((resolve) => {
      const sw = registration.installing || registration.waiting;
      if (!sw) {
        resolve(registration);
        return;
      }
      sw.addEventListener("statechange", () => {
        if (sw.state === "activated") resolve(registration);
      });
      setTimeout(() => resolve(registration), 3000);
    });
  } catch {
    return null;
  }
}

export interface PushNotificationData {
  title: string;
  body?: string | null;
  type?: string;
  tag?: string;
  url?: string;
  /** Actor avatar URL for rich notifications */
  avatarUrl?: string | null;
}

// ── Notification sound ──

let notificationAudio: HTMLAudioElement | null = null;

/** Play a short notification sound */
export function playNotificationSound() {
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio(
        "data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToFAAB4eHh6fH5+fn5+fHp4eHZ0cnBubGpqampsbnBydHZ4eHp8fn5+fn5+fHp4eHZ0cnBubGpqampsbnBydHZ4eHp8fn5+fn5+fHp4dnd4eXt9fn5+fn18enh2dHJwbmxqamtrbW9xc3V3eXt8fn5+fn58e3l3dXNxb21ramprb3N3e35+fn5+fHh0cG1qampsbnJ2ent+fn5+fnx4dHBtamhoa25yeHx+fn5+fnx4dHBsaGhqbnJ4fH5+fn5+fHh0cGxoaGpucnh8fn5+fn58eHRwbGhoam5yeHx+fn5+fnx4dHBsaGhqbXF2en5+fn5+fHl1cW1paWtucnZ6fn5+fn59e3hzcGxqamxuc3d7fn5+fn5+fHl1cW1qa2xvdHh8fn5+fn59e3h0cG1ra21wdHh8fn5+fn59e3h0cGxqbG5xdXl8fn5+fn59e3h0cGxqbG5xdXl8fn5+fn5+fHl2cm9tbW9xdHd6fH5+fn5+fXt5dnRxb29wcnR3eXx+fn5+fn18e3l3dXNxcHBxc3V3eXt9fn5+fn59fHt5d3V0c3JycnN0dnl7fX5+fn5+fn18e3p4d3Z1dHR1dnd5e3x+fn5+fn5+fXx7enh3d3Z2d3d4ent8fn5+fn5+fn59fHt6eXh4eHh4eXp7fH1+fn5+fn5+fn18fHt6eXl5eXl6e3x8fX5+fn5+fn5+fn19fHt7enp6ent7fHx9fn5+fn5+fn5+fn19fXx8e3t7e3x8fH19fn5+fn5+fn5+fn5+fX19fHx8fHx8fX19fn5+fn5+fn5+fn5+fn59fX19fX19fX19fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+"
      );
      notificationAudio.volume = 0.3;
    }
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(() => {});
  } catch {
    // Audio playback failed silently
  }
}

/** Check if Do Not Disturb is active based on user settings. */
export function isDndActive(): boolean {
  const { settings: s } = useSettingsStore.getState();
  if (s.mute_all_sounds) return true;
  if (!s.notification_schedule_enabled) return false;

  const now = new Date();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = dayNames[now.getDay()];
  const activeDays = s.notification_schedule_days.split(",").map((d) => d.trim().toLowerCase());

  // If today isn't an active notification day, suppress
  if (!activeDays.includes(today)) return true;

  // Check if current time is outside the allowed notification window
  const [startH, startM] = s.notification_schedule_start.split(":").map(Number);
  const [endH, endM] = s.notification_schedule_end.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Outside the start-end window means DND
  if (currentMinutes < startMinutes || currentMinutes > endMinutes) return true;

  return false;
}

/**
 * Show a desktop notification via the service worker.
 * Falls back to the Notification API if the SW isn't available.
 * Also plays a notification sound. Respects DND/schedule settings.
 */
export async function showPushNotification(data: PushNotificationData): Promise<boolean> {
  // Respect Do Not Disturb mode
  if (isDndActive()) return false;
  // Desktop app: use native OS notifications via Tauri
  if (isTauri) {
    const tabFocused = document.visibilityState === "visible" && document.hasFocus();
    if (tabFocused) return false;
    await sendNativeNotification(data.title, data.body ?? "");
    playNotificationSound();
    return true;
  }

  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  // Don't show OS notification or play sound if the tab is focused — user is looking at the app
  const tabFocused = document.visibilityState === "visible" && document.hasFocus();

  if (tabFocused) return false;

  // Try to send via service worker
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (registration?.active) {
    registration.active.postMessage({
      type: "SHOW_NOTIFICATION",
      payload: {
        title: data.title,
        body: data.body ?? undefined,
        tag: data.tag ?? `chatterbox-${Date.now()}`,
        icon: data.avatarUrl || "/icon.png",
        data: { url: data.url },
      },
    });
  } else {
    // Fallback: direct Notification API
    const notification = new Notification(data.title, {
      body: data.body ?? undefined,
      tag: data.tag ?? `chatterbox-${Date.now()}`,
      icon: data.avatarUrl || "/icon.png",
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    setTimeout(() => notification.close(), 6000);
  }

  playNotificationSound();
  return true;
}

/**
 * Initialize notifications: register SW + request permission.
 * Call once on app mount.
 */
export async function initNotifications(): Promise<NotificationPermissionState> {
  // Desktop app: request permission via Tauri plugin
  if (isTauri) {
    try {
      const {
        isPermissionGranted,
        requestPermission,
      } = await import("@tauri-apps/plugin-notification");
      let permitted = await isPermissionGranted();
      if (!permitted) {
        const result = await requestPermission();
        permitted = result === "granted";
      }
      return permitted ? "granted" : "denied";
    } catch {
      return "unsupported";
    }
  }

  if (!isNotificationSupported()) return "unsupported";

  // Register the service worker
  await registerServiceWorker();

  if (Notification.permission !== "default") return Notification.permission;

  // Brief delay so the prompt doesn't fire immediately on page load
  await new Promise((r) => setTimeout(r, 2000));
  return requestNotificationPermission();
}
