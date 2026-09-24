/**
 * Chooses which axis labels stay visible when points are unevenly spaced.
 *
 * Selection is deterministic and expressed in fractions of the plot width, so it does
 * not depend on measured text width or on the rendered pixel size — the chart scales as
 * a whole from a fixed viewBox, so a gap chosen in those units holds at every size.
 *
 * Hidden labels are still rendered for assistive technology by the caller; this decides
 * visibility only, never whether the date exists.
 */
export function selectVisibleLabelIndices(
	xFractions: number[],
	minGapFraction: number,
): number[] {
	if (xFractions.length === 0) return [];
	if (xFractions.length === 1) return [0];

	const lastIndex = xFractions.length - 1;
	const kept = [0];

	for (let index = 1; index < lastIndex; index += 1) {
		const previous = xFractions[kept[kept.length - 1]] ?? 0;
		if ((xFractions[index] ?? 0) - previous >= minGapFraction) {
			kept.push(index);
		}
	}

	// The last label is never the one dropped: it anchors the end of the range, and a
	// missing final date reads as a truncated chart. Anything it would collide with is
	// removed instead.
	while (
		kept.length > 1 &&
		(xFractions[lastIndex] ?? 0) - (xFractions[kept[kept.length - 1]] ?? 0) <
			minGapFraction
	) {
		kept.pop();
	}
	kept.push(lastIndex);

	return kept;
}
