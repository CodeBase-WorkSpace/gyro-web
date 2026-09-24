export function formatExplorerShortDate(value: string) {
	return new Intl.DateTimeFormat("fa-IR", {
		month: "short",
		day: "numeric",
	}).format(new Date(`${value}T12:00:00Z`));
}

export function formatExplorerDateRangeLabel(value: string) {
	return value.replace(
		/(\d{4}-\d{2}-\d{2}) تا (\d{4}-\d{2}-\d{2})/,
		(_, from: string, to: string) =>
			`${formatExplorerShortDate(from)} تا ${formatExplorerShortDate(to)}`,
	);
}

export function daysBetweenInclusive(from: string, to: string) {
	const fromDate = new Date(`${from}T12:00:00Z`);
	const toDate = new Date(`${to}T12:00:00Z`);
	return Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
}
