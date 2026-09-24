import type { AccessTokenVerification } from "./access-token";

/**
 * How long a cached profile may be served.
 *
 * **This is a deliberate policy choice, and it does widen something.** Before
 * the cache existed, `getSession()` read `/users/me` on every authenticated
 * render, so a disabled or status-changed account stopped rendering on the very
 * next one. A non-admin session can now carry up to a minute of stale account
 * state. Admin sessions are excluded entirely and keep the old behaviour.
 *
 * What makes that acceptable is that the frontend session was never the thing
 * enforcing access. `JwtAuthFilter` on the API runs
 * `select status = 'ACTIVE' from users where id = ?` against the database on
 * every authenticated request, so a disabled user is refused by the backend
 * immediately regardless of what this cache holds. Every data read in the
 * render they are mid-way through fails, refresh fails too — `AuthService`
 * checks the same thing — and they land back on the login page. The cache can
 * make the app briefly *believe* a session exists; it cannot make the API serve
 * one.
 *
 * The residual exposure is therefore a stale display of profile fields, not
 * stale authorization. Keep the window well under the 15-minute access token so
 * this never becomes the widest stale window in the system, and revisit it if a
 * surface ever renders privileged content from session state alone without
 * reading the API.
 */
export const SESSION_PROFILE_TTL_MS = 60_000;

/**
 * Upper bound on cached users, evicting the oldest entry when full.
 *
 * The cache is keyed by user, so without a cap its size follows the number of
 * distinct people who signed in since the process started.
 */
export const SESSION_PROFILE_MAX_ENTRIES = 5_000;

export type SessionProfileCachePlan =
	| { cached: true; userId: string }
	| { cached: false; reason: "unverified" | "privileged" };

/**
 * Decides whether a session profile read may be served from cache.
 *
 * Two cases must always reach the API. An unverified token gives us no
 * trustworthy user id, so there is no safe cache key — and the uncached read is
 * what surfaces the 401 that drives the refresh path. An `ADMIN` token is held
 * fresh deliberately: `proxy.ts` already forces backend validation on admin
 * navigation so a revoked administrator loses access immediately, and caching
 * here would reopen exactly that window.
 */
export function sessionProfileCachePlan(
	verification: AccessTokenVerification,
): SessionProfileCachePlan {
	if (verification.status !== "verified") {
		return { cached: false, reason: "unverified" };
	}

	if (verification.token.role === "ADMIN") {
		return { cached: false, reason: "privileged" };
	}

	return { cached: true, userId: verification.token.userId };
}

type Entry<T> = { value: Promise<T>; expiresAt: number };

/**
 * A per-process cache that also collapses concurrent loads of the same key.
 *
 * The in-flight promise is stored rather than the resolved value, so the nine
 * or so reads a single render performs share one request instead of racing.
 * A rejected load is evicted rather than cached — a failed profile read must
 * not pin an error in front of the user for the whole TTL.
 *
 * Per-process is the right shape here because the deployment is a single Node
 * instance. With more instances each keeps its own copy, which stays correct
 * and simply caches less.
 */
export class TtlCache<T> {
	private readonly entries = new Map<string, Entry<T>>();

	constructor(
		private readonly ttlMs: number,
		private readonly maxEntries: number,
		private readonly now: () => number = Date.now,
	) {}

	get size() {
		return this.entries.size;
	}

	load(key: string, loader: () => Promise<T>): Promise<T> {
		const existing = this.entries.get(key);
		if (existing && existing.expiresAt > this.now()) {
			return existing.value;
		}

		const value = loader();
		this.set(key, value);

		return value.catch((error) => {
			// Only evict if this exact load is still the cached one; a newer load
			// may already have replaced it.
			if (this.entries.get(key)?.value === value) this.entries.delete(key);
			throw error;
		});
	}

	delete(key: string) {
		this.entries.delete(key);
	}

	clear() {
		this.entries.clear();
	}

	private set(key: string, value: Promise<T>) {
		// Re-inserting moves the key to the end of Map iteration order, which is
		// what makes the eviction below oldest-first.
		this.entries.delete(key);
		this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });

		while (this.entries.size > this.maxEntries) {
			const oldest = this.entries.keys().next();
			if (oldest.done) break;
			this.entries.delete(oldest.value);
		}
	}
}
