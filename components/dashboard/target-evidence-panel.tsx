import type { ReactNode } from "react";

export type TargetEvidenceRow = {
	label: string;
	value: ReactNode;
	emphasized?: boolean;
};

export function TargetEvidencePanel({
	summary,
	rows,
	footer,
	defaultOpen = false,
}: {
	summary: string;
	rows: TargetEvidenceRow[];
	footer?: ReactNode;
	defaultOpen?: boolean;
}) {
	if (!rows.length) return null;

	return (
		<details
			className="group mt-4 rounded-xl border border-border/70 bg-background/55"
			open={defaultOpen}
			dir="rtl"
		>
			<summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-bold marker:content-none">
				<span className="flex items-center justify-between gap-3">
					{summary}
					<span
						className="text-muted-foreground transition-transform group-open:rotate-180"
						aria-hidden="true"
					>
						⌄
					</span>
				</span>
			</summary>
			<div className="border-t border-border/70 px-3 py-3">
				<div className="max-w-full overflow-x-auto">
					<dl className="min-w-full text-sm">
						{rows.map((row, index) => (
							<div
								key={`${row.label}-${index}`}
								className={
									row.emphasized
										? "grid grid-cols-[auto_auto] gap-4 border-t border-border py-2 font-bold"
										: "grid grid-cols-[auto_auto] gap-4 py-1.5"
								}
							>
								<dt className="text-muted-foreground">
									{row.label}
								</dt>
								<dd className="whitespace-nowrap text-left tabular-nums">
									{row.value}
								</dd>
							</div>
						))}
					</dl>
				</div>
				{footer ? (
					<p className="mt-3 text-xs leading-6 text-muted-foreground">
						{footer}
					</p>
				) : null}
			</div>
		</details>
	);
}
