const API_PATH_SUFFIX = "/api/v1";

export function getApiBaseUrl(): string {
  const configuredUrl = typeof window === "undefined"
    ? process.env.API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!configuredUrl) {
    throw new Error(typeof window === "undefined" ? "API_BASE_URL is not configured." : "NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  const url = new URL(configuredUrl);
  url.pathname = url.pathname.replace(/\/+$/, "");
  if (!url.pathname.endsWith(API_PATH_SUFFIX)) throw new Error("API base URLs must end with /api/v1.");
  return url.toString().replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), `${getApiBaseUrl()}/`).toString();
}
