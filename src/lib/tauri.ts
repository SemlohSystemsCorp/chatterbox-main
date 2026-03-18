/**
 * Tauri desktop integration layer.
 * All Tauri APIs are gated behind `isTauri` so the web app works identically
 * when running in a browser.
 */

export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Get the port the embedded Next.js server is running on (desktop only). */
export async function getServerPort(): Promise<number | null> {
  if (!isTauri) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<number>("get_server_port");
}

/** Send a native desktop notification. Falls back to browser Notification API. */
export async function sendNativeNotification(
  title: string,
  body: string
): Promise<void> {
  if (!isTauri) {
    // Browser fallback
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    return;
  }

  const {
    sendNotification,
    isPermissionGranted,
    requestPermission,
  } = await import("@tauri-apps/plugin-notification");

  let permitted = await isPermissionGranted();
  if (!permitted) {
    const result = await requestPermission();
    permitted = result === "granted";
  }
  if (permitted) {
    sendNotification({ title, body });
  }
}

/** Open a URL in the user's default browser (works on both web and desktop). */
export async function openExternal(url: string): Promise<void> {
  if (isTauri) {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } else {
    window.open(url, "_blank");
  }
}
