import {ApiClientError, toFieldErrorMap} from "./errors";
import type {ApiErrorResponse} from "./types";
import {debugError, debugLog} from "../debug/logger";
import {apiUrl} from "./base-url";

// The API answers in 20–130 ms when it answers at all, so anything approaching
// this bound is a stalled connection rather than slow work. 20 s outlasted the
// patience of every real user, and the render was holding the page hostage the
// whole time. Route error boundaries now turn an expiry into a retry the user
// can act on, which is what makes failing early better than waiting.
const DEFAULT_TIMEOUT_MS = 6_000;
const REQUEST_ID_HEADER = "X-Request-Id";

export { getApiBaseUrl } from "./base-url";

type ApiRequestOptions = {
  accessToken?: string;
  body?: unknown;
  cache?: RequestCache;
  headers?: Record<string, string>;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  timeoutMs?: number;
};

export async function apiGet<T>(
  path: string,
  accessTokenOrOptions?: string | Omit<ApiRequestOptions, "body" | "method">
): Promise<T> {
  const options = typeof accessTokenOrOptions === "string"
    ? {accessToken: accessTokenOrOptions}
    : accessTokenOrOptions;

  return apiFetch<T>(path, { ...options, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: Omit<ApiRequestOptions, "body" | "method">
): Promise<T> {
  return apiFetch<T>(path, { ...options, body, method: "POST" });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: Omit<ApiRequestOptions, "body" | "method">
): Promise<T> {
  return apiFetch<T>(path, { ...options, body, method: "PATCH" });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: Omit<ApiRequestOptions, "body" | "method">
): Promise<T> {
  return apiFetch<T>(path, { ...options, body, method: "PUT" });
}

export async function apiDelete<T>(
  path: string,
  options?: Omit<ApiRequestOptions, "body" | "method">
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "DELETE" });
}

export async function apiFetch<T>(
  path: string,
  {
    accessToken,
    body,
    cache = "no-store",
    headers,
    method = "GET",
    next,
    timeoutMs = DEFAULT_TIMEOUT_MS
  }: ApiRequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const resolvedApiUrl = apiUrl(path);
  const requestId = resolveRequestId(headers);
  const requestHeaders = {
    ...(body === undefined ? undefined : { "Content-Type": "application/json" }),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    ...headers,
    [REQUEST_ID_HEADER]: requestId
  };

  debugLog("api", "request", {
    apiUrl: resolvedApiUrl,
    method,
    requestId
  });

  try {
    const response = await fetch(resolvedApiUrl, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache,
      next,
      signal: controller.signal
    });
    const backendRequestId = response.headers.get(REQUEST_ID_HEADER) ?? undefined;
    const responseMetadata = {
      apiUrl: resolvedApiUrl,
      method,
      status: response.status,
      requestId,
      backendRequestId,
      requestIdChanged: Boolean(backendRequestId && backendRequestId !== requestId)
    };

    if (!response.ok) {
      const apiError = await toApiClientError(response, backendRequestId);
      debugLog("api", "response", {
        ...responseMetadata,
        backendErrorCode: apiError.code
      });
      throw apiError;
    }

    debugLog("api", "response", responseMetadata);

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      debugError("api", "request-timeout", error, {
        apiUrl: resolvedApiUrl,
        method,
        requestId
      });
      throw new ApiClientError("ارتباط با سرور بیش از حد طول کشید. لطفا دوباره تلاش کنید.", 408, "REQUEST_TIMEOUT");
    }

    debugError("api", "request-failed", error, {
      apiUrl: resolvedApiUrl,
      method,
      requestId
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function toApiClientError(response: Response, backendRequestId?: string) {
  let error: ApiErrorResponse | undefined;

  try {
    error = await response.json();
  } catch {
    error = undefined;
  }

  return new ApiClientError(
    error?.message || "ارتباط با سرور برقرار نشد. لطفا دوباره تلاش کنید.",
    response.status,
    error?.code,
    toFieldErrorMap(error),
    error?.requestId ?? backendRequestId,
    error?.metadata,
    error?.reasonCode,
  );
}

function resolveRequestId(headers?: Record<string, string>) {
  const existingRequestId = Object.entries(headers ?? {}).find(
    ([header]) => header.toLowerCase() === REQUEST_ID_HEADER.toLowerCase()
  )?.[1];

  if (existingRequestId) {
    return existingRequestId;
  }

  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `frontend-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
