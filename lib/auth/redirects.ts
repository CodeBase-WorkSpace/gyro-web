const FALLBACK_REDIRECT_PATH = "/dashboard";
const CONTROL_CHARACTER = /[\u0000-\u001F\u007F]/;

export function safeRedirectPath(
  value?: FormDataEntryValue | string | string[] | null,
  fallbackPath = FALLBACK_REDIRECT_PATH,
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const safeFallbackPath = isSafeInternalRedirectPath(fallbackPath)
    ? fallbackPath
    : FALLBACK_REDIRECT_PATH;

  return typeof candidate === "string" && isSafeInternalRedirectPath(candidate)
    ? candidate
    : safeFallbackPath;
}

function isSafeInternalRedirectPath(candidate: string) {
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.includes("://") ||
    CONTROL_CHARACTER.test(candidate)
  ) {
    return false;
  }

  try {
    const decoded = decodeURIComponent(candidate);
    return (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.includes("\\") &&
      !decoded.includes("://") &&
      !CONTROL_CHARACTER.test(decoded)
    );
  } catch {
    return false;
  }
}
