type DebugScope = "api" | "auth" | "session";

type DebugMetadata = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /authorization|password|token|secret|credential/i;

export function debugLog(scope: DebugScope, event: string, metadata?: DebugMetadata) {
  if (!isDebugLoggingEnabled()) {
    return;
  }

  if (metadata) {
    console.debug(`[Gyro:${scope}] ${event}`, sanitizeMetadata(metadata));
    return;
  }

  console.debug(`[Gyro:${scope}] ${event}`);
}

export function debugError(scope: DebugScope, event: string, error: unknown, metadata?: DebugMetadata) {
  if (!isDebugLoggingEnabled()) {
    return;
  }

  console.debug(`[Gyro:${scope}] ${event}`, {
    ...sanitizeMetadata(metadata ?? {}),
    error: sanitizeError(error),
  });
}

function isDebugLoggingEnabled() {
  if (process.env.GYRO_DEBUG_LOGS === "true" || process.env.NEXT_PUBLIC_GYRO_DEBUG_LOGS === "true") {
    return true;
  }

  if (process.env.GYRO_DEBUG_LOGS === "false" || process.env.NEXT_PUBLIC_GYRO_DEBUG_LOGS === "false") {
    return false;
  }

  return process.env.NODE_ENV === "development";
}

function sanitizeMetadata(metadata: DebugMetadata): DebugMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeValue(value),
    ])
  );
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return sanitizeMetadata(value as DebugMetadata);
  }

  return value;
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return sanitizeValue(error);
}
