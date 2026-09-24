export type AnchorRect = {
	top: number;
	left: number;
	width: number;
	height: number;
};

/**
 * Re-runs `update` when the viewport moves, without the two costs that a naive
 * scroll listener carries on low-end phones:
 *
 * - the listener is passive, so it never blocks the compositor while the user
 *   is dragging (a non-passive scroll listener forces the browser to wait for
 *   the handler before it can scroll);
 * - calls are coalesced to one per animation frame, so a handler that reads
 *   layout runs at most 60 times a second instead of once per scroll event.
 *
 * Returns a cleanup function. Capture phase is on so scrolling inside a nested
 * container still reaches the handler.
 */
export function trackViewportChanges(update: () => void): () => void {
	let frame = 0;

	const schedule = () => {
		if (frame) return;
		frame = window.requestAnimationFrame(() => {
			frame = 0;
			update();
		});
	};

	const scrollOptions: AddEventListenerOptions = {passive: true, capture: true};
	window.addEventListener("resize", schedule, {passive: true});
	window.addEventListener("scroll", schedule, scrollOptions);

	return () => {
		if (frame) window.cancelAnimationFrame(frame);
		window.removeEventListener("resize", schedule);
		window.removeEventListener("scroll", schedule, scrollOptions);
	};
}

/**
 * True when both rects describe the same box. Callers use this to skip a
 * setState that would re-render for no visible change — most scroll frames
 * leave a fixed-position anchor exactly where it was.
 */
export function isSameRect(a: AnchorRect | null, b: AnchorRect | null): boolean {
	if (a === null || b === null) return a === b;
	return (
		a.top === b.top &&
		a.left === b.left &&
		a.width === b.width &&
		a.height === b.height
	);
}
