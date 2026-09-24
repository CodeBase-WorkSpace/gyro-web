export function applicationServerKeysMatch(current: ArrayBuffer | null, expected: Uint8Array): boolean {
  if (!current) return false;
  const currentBytes = new Uint8Array(current);
  if (currentBytes.length !== expected.length) return false;
  return currentBytes.every((value, index) => value === expected[index]);
}

export async function registerPushSubscriptionWithRecovery(
  register: () => Promise<{error?: string}>,
  isPersisted: () => Promise<boolean>,
  fallbackMessage: string,
): Promise<void> {
  let registrationError: unknown;

  try {
    const result = await register();
    if (!result.error) return;
    registrationError = new Error(result.error);
  } catch (error) {
    // The API can commit the subscription before the Server Action response is
    // interrupted. Reconcile against the backend before reporting a failure.
    registrationError = error;
  }

  try {
    if (await isPersisted()) return;
  } catch {
    // Preserve the original registration failure when reconciliation is also unavailable.
  }

  throw registrationError instanceof Error ? registrationError : new Error(fallbackMessage);
}
