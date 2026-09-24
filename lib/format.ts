const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value: string | number) {
	return String(value).replace(
		/\d/g,
		(digit) => persianDigits[Number(digit)],
	);
}

export function formatPersianNumber(
	value: number,
	options?: Intl.NumberFormatOptions,
) {
	return value.toLocaleString("fa-IR", {
		maximumFractionDigits: 2,
		...options,
	});
}

export function formatIrr(value: number) {
	return `${formatPersianNumber(value)} ریال`;
}

const persianServingUnitLabels: Record<string, string> = {
	GRAM: "گرم",
	MILLILITER: "میلی‌لیتر",
	PIECE: "عدد",
	SERVING: "وعده",
	TABLESPOON: "قاشق غذاخوری",
	TEASPOON: "قاشق چای‌خوری",
	CUP: "فنجان",
	OUNCE: "اونس",
	SLICE: "برش",
};

export function localizedServingUnit(code: string, fallback?: string) {
	return persianServingUnitLabels[code] ?? fallback ?? code;
}

const persianDayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
	weekday: "long",
	day: "numeric",
	month: "long",
	year: "numeric",
});

const persianGregorianFormatter = new Intl.DateTimeFormat(
	"fa-IR-u-ca-gregory",
	{
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	},
);

export function formatPersianDayLabel(date: Date) {
	const parts = persianDayFormatter.formatToParts(date);
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((item) => item.type === type)?.value ?? "";

	return `${part("weekday")}، ${part("day")} ${part("month")} ${part("year")}`;
}

export function formatPersianGregorianDate(date: Date) {
	return persianGregorianFormatter.format(date);
}
