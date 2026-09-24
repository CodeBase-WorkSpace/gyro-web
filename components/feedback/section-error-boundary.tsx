"use client";

import { unstable_rethrow } from "next/navigation";
import { Component, type ReactNode } from "react";

type Props = {
	children: ReactNode;
	fallback: ReactNode;
	/** Identifies the section in the failure log. */
	label: string;
};

/**
 * Contains one streamed section's failure so it cannot take down the page
 * around it.
 *
 * Suspense only covers the pending state. A rejected promise propagates past it
 * to the nearest route error boundary, which for the dashboard would throw away
 * the diary shell — the thing the user actually came for — because a secondary
 * read failed. Wrapping the boundary keeps that blast radius to the section.
 *
 * `unstable_rethrow` runs first so Next's control-flow errors (redirect,
 * notFound) are never swallowed here.
 */
export class SectionErrorBoundary extends Component<Props, {hasError: boolean}> {
	state = {hasError: false};

	static getDerivedStateFromError(error: unknown) {
		unstable_rethrow(error);
		return {hasError: true};
	}

	componentDidCatch(error: unknown) {
		console.warn(
			`event=section_render outcome=failure section=${this.props.label}`,
			error,
		);
	}

	render() {
		return this.state.hasError ? this.props.fallback : this.props.children;
	}
}
