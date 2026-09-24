export type BrowserNotificationPermission =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export function resolveBrowserNotificationPermission(
  supported: boolean,
  permission?: NotificationPermission,
): BrowserNotificationPermission {
  if (!supported) return "unsupported";
  if (permission === "granted") return "granted";
  if (permission === "denied") return "denied";
  return "default";
}
