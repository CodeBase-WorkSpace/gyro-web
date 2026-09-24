type RatioEntry<T> = {
	target: T;
	intersectionRatio: number;
};

/**
 * Picks the slide that should be marked selected from one batch of
 * IntersectionObserver entries, or null when none qualifies.
 *
 * Two things make this less obvious than it looks:
 *
 * `isIntersecting` is true for any non-zero overlap — it does NOT mean "still
 * meets the observer's threshold". A slide crossing *downward* through the
 * threshold fires a callback while `isIntersecting` is still true, so filtering
 * on that flag alone lets a slide the user is swiping away from re-select
 * itself. Comparing the ratio is what actually enforces the contract.
 *
 * And a batch can carry several entries, delivered in an order the spec does
 * not pin down. Taking the largest qualifying ratio rather than calling the
 * setter for each entry makes the outcome independent of that order.
 *
 * Returning null leaves the current selection alone, which is what should
 * happen mid-drag when no slide covers enough of the viewport.
 */
export function selectVisibleSlide<T>(
	entries: readonly RatioEntry<T>[],
	minimumRatio: number,
): T | null {
	let best: RatioEntry<T> | null = null;

	for (const entry of entries) {
		if (entry.intersectionRatio < minimumRatio) continue;
		if (best === null || entry.intersectionRatio > best.intersectionRatio) {
			best = entry;
		}
	}

	return best === null ? null : best.target;
}
