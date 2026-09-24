"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import {
	createDiaryEntry,
	createDiaryEntriesBatch,
	copyDiaryDay,
	deleteDiaryEntry,
	repeatDiaryEntry,
	updateDiaryEntry,
	type CreateDiaryEntriesBatchRequestDto,
	type CreateDiaryEntryRequestDto,
	type DiaryDayResponseDto,
	type DiaryEntrySourceType,
	type DiaryMealType,
} from "@/lib/api/diary";
import { ApiClientError, localizedApiErrorMessage } from "@/lib/api/errors";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { isIsoDiaryDate } from "@/lib/diary/persian-calendar";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const allowedMealTypes = new Set<DiaryMealType>([
	"BREAKFAST",
	"LUNCH",
	"DINNER",
	"SNACK",
	"CUSTOM",
]);
const allowedSourceTypes = new Set<DiaryEntrySourceType>(["FOOD", "MEAL"]);

export type QuickAddEntryInput = {
	date: string;
	mealType: DiaryMealType;
	sourceType: Extract<DiaryEntrySourceType, "FOOD" | "MEAL">;
	sourceId: string;
	servingQuantity: number;
	servingUnit?: string;
	nextPath: string;
	/**
	 * Supplied by the caller so a retry reuses it, exactly like the batch
	 * action. Generating one here made every attempt look like a new write, so
	 * retrying a partly-failed multi-item save re-logged whatever had already
	 * succeeded. Derive it from something stable across retries — not a value
	 * the user can edit between attempts, so an edited retry surfaces as a
	 * conflict instead of silently writing twice.
	 */
	idempotencyKey: string;
	/**
	 * Defaults to true. Set false when this write is one of several in a single
	 * user gesture — revalidating per write makes Next re-render the whole route
	 * once per call, so logging a five-item meal cost five full page renders.
	 * The caller is then responsible for revalidating after the last write.
	 */
	revalidate?: boolean;
};

export type QuickAddEntryResult =
	| {
			ok: true;
			day: DiaryDayResponseDto;
	  }
	| {
			ok: false;
			message: string;
			requestId?: string;
			reason?: "source-unavailable";
	  };

export type BatchQuickAddInput = {
	date: string;
	mealType: Exclude<DiaryMealType, "CUSTOM">;
	entries: CreateDiaryEntriesBatchRequestDto["entries"];
	quickPlate?: CreateDiaryEntriesBatchRequestDto["quickPlate"];
	idempotencyKey: string;
	nextPath: string;
	/** See {@link QuickAddEntryInput.revalidate}. */
	revalidate?: boolean;
};

export type EditDiaryEntryInput = {
	date: string;
	entryId: string;
	request: CreateDiaryEntryRequestDto;
	idempotencyKey: string;
	nextPath: string;
};

export type DeleteDiaryEntryInput = {
	date: string;
	entryId: string;
	idempotencyKey: string;
	nextPath: string;
};

export type RepeatDiaryEntryInput = {
	targetDate: string;
	entryId: string;
	idempotencyKey: string;
	nextPath: string;
};

export type CopyDiaryDayInput = {
	targetDate: string;
	sourceDate: string;
	idempotencyKey: string;
	nextPath: string;
};

export async function saveBatchQuickAddEntriesAction(
	input: BatchQuickAddInput,
): Promise<QuickAddEntryResult> {
	const nextPath = sanitizeNextPath(input.nextPath, input.date);
	const validationMessage = validateBatchQuickAddInput(input);
	if (validationMessage) return { ok: false, message: validationMessage };

	const request: CreateDiaryEntriesBatchRequestDto = {
		mealType: input.mealType,
		entries: input.entries,
		quickPlate: input.quickPlate,
	};

	try {
		const day = await authenticatedServerRequest(
			(accessToken) => createDiaryEntriesBatch(input.date, request, accessToken, input.idempotencyKey),
			{ nextPath, retryPolicy: "idempotent" },
		);
		if (input.revalidate !== false) revalidateQuickAddPaths();
		return { ok: true, day };
	} catch (error) { return quickAddFailureState(error); }
}

export async function saveQuickAddEntryAction(
	input: QuickAddEntryInput,
): Promise<QuickAddEntryResult> {
	const nextPath = sanitizeNextPath(input.nextPath, input.date);
	const validationMessage = validateQuickAddInput(input);

	if (validationMessage) {
		return {
			ok: false,
			message: validationMessage,
		};
	}

	const request = createDiaryEntryRequestFrom(input);

	try {
		const day = await authenticatedServerRequest(
			(accessToken) => createDiaryEntry(input.date, request, accessToken, input.idempotencyKey),
			{ nextPath, retryPolicy: "idempotent" },
		);
		if (input.revalidate !== false) revalidateQuickAddPaths();
		return { ok: true, day };
	} catch (error) { return quickAddFailureState(error); }
}

export async function updateDiaryEntryAction(
	input: EditDiaryEntryInput,
): Promise<QuickAddEntryResult> {
	const nextPath = sanitizeNextPath(input.nextPath, input.date);
	const validationMessage = validateEditDiaryEntryInput(input);
	if (validationMessage) return { ok: false, message: validationMessage };

	try {
		const day = await authenticatedServerRequest(
			(accessToken) => updateDiaryEntry(input.date, input.entryId, input.request, accessToken, input.idempotencyKey),
			{ nextPath, retryPolicy: "idempotent" },
		);
		revalidateQuickAddPaths();
		return { ok: true, day };
	} catch (error) { return quickAddFailureState(error); }
}

export async function deleteDiaryEntryAction(
	input: DeleteDiaryEntryInput,
): Promise<QuickAddEntryResult> {
	const nextPath = sanitizeNextPath(input.nextPath, input.date);
	if (!ISO_DATE.test(input.date)) return { ok: false, message: "تاریخ دفتر روزانه معتبر نیست." };
	if (!input.entryId.trim() || input.entryId.length > 80)
		return { ok: false, message: "شناسه ثبت معتبر نیست." };
	if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 160)
		return { ok: false, message: "شناسه حذف معتبر نیست." };

	try {
		const day = await authenticatedServerRequest(
			(accessToken) => deleteDiaryEntry(input.date, input.entryId, accessToken, input.idempotencyKey),
			{ nextPath, retryPolicy: "idempotent" },
		);
		revalidateQuickAddPaths();
		return { ok: true, day };
	} catch (error) { return quickAddFailureState(error); }
}

export async function repeatDiaryEntryAction(
	input: RepeatDiaryEntryInput,
): Promise<QuickAddEntryResult> {
	const nextPath = sanitizeNextPath(input.nextPath, input.targetDate);
	if (!ISO_DATE.test(input.targetDate)) return { ok: false, message: "تاریخ هدف معتبر نیست." };
	if (!input.entryId.trim() || input.entryId.length > 80)
		return { ok: false, message: "شناسه ثبت معتبر نیست." };
	if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 160)
		return { ok: false, message: "شناسه تکرار معتبر نیست." };

	try {
		const day = await authenticatedServerRequest(
			(accessToken) => repeatDiaryEntry(input.targetDate, input.entryId, accessToken, input.idempotencyKey),
			{ nextPath, retryPolicy: "idempotent" },
		);
		revalidateQuickAddPaths();
		return { ok: true, day };
	} catch (error) { return quickAddFailureState(error); }
}

export async function copyDiaryDayAction(
	input: CopyDiaryDayInput,
): Promise<QuickAddEntryResult> {
	const nextPath = sanitizeNextPath(input.nextPath, input.targetDate);
	if (!isIsoDiaryDate(input.targetDate) || !isIsoDiaryDate(input.sourceDate))
		return { ok: false, message: "تاریخ مبدأ یا مقصد معتبر نیست." };
	if (input.targetDate === input.sourceDate)
		return { ok: false, message: "تاریخ مبدأ باید با تاریخ مقصد متفاوت باشد." };
	if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 160)
		return { ok: false, message: "شناسه کپی معتبر نیست." };

	try {
		const day = await authenticatedServerRequest(
			(accessToken) => copyDiaryDay(input.targetDate, input.sourceDate, accessToken, input.idempotencyKey),
			{ nextPath, retryPolicy: "idempotent" },
		);
		revalidateQuickAddPaths();
		return { ok: true, day };
	} catch (error) {
		unstable_rethrow(error);
		if (error instanceof ApiClientError) {
			const message = error.code === "RESOURCE_NOT_FOUND"
				? "در تاریخ مبدأ ثبت غذایی قابل کپی پیدا نشد."
				: error.code === "IDEMPOTENCY_KEY_CONFLICT"
					? "این درخواست با اطلاعات متفاوت تکرار شده است. تاریخ را دوباره انتخاب کنید."
					: localizedApiErrorMessage(error) || "کپی دفتر غذایی انجام نشد.";
			return { ok: false, message, requestId: error.requestId };
		}
		return { ok: false, message: "کپی دفتر غذایی انجام نشد. کمی بعد دوباره تلاش کنید." };
	}
}

function validateQuickAddInput(input: QuickAddEntryInput) {
	if (!ISO_DATE.test(input.date)) return "تاریخ دفتر روزانه معتبر نیست.";
	if (!allowedMealTypes.has(input.mealType)) return "وعده انتخاب‌شده معتبر نیست.";
	if (!allowedSourceTypes.has(input.sourceType)) return "نوع منبع برای ثبت سریع معتبر نیست.";
	if (!input.sourceId.trim()) return "برای ثبت در دفتر روزانه، ابتدا یک غذا را انتخاب کنید.";
	if (!Number.isFinite(input.servingQuantity) || input.servingQuantity <= 0)
		return "مقدار سروینگ معتبر نیست.";
	if (input.sourceType === "FOOD" && !input.servingUnit?.trim())
		return "واحد سروینگ معتبر نیست.";
	if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 160)
		return "شناسه ثبت معتبر نیست.";
	return undefined;
}

function validateBatchQuickAddInput(input: BatchQuickAddInput) {
	if (!ISO_DATE.test(input.date)) return "تاریخ دفتر روزانه معتبر نیست.";
	if (!allowedMealTypes.has(input.mealType))
		return "وعده انتخاب‌شده معتبر نیست.";
	if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 160)
		return "شناسه ثبت گروهی معتبر نیست.";
	if (input.entries.length === 0 || input.entries.length > 100)
		return "بین ۱ تا ۱۰۰ غذا را برای ثبت انتخاب کنید.";
	for (const entry of input.entries) {
		if (entry.sourceType !== "FOOD" || !entry.sourceId.trim())
			return "یکی از غذاهای انتخاب‌شده معتبر نیست.";
		if (!Number.isFinite(entry.quantity) || entry.quantity <= 0)
			return "مقدار یکی از غذاها معتبر نیست.";
		if (!entry.servingUnitId.trim()) return "واحد یکی از غذاها معتبر نیست.";
	}
	if (input.quickPlate && !input.quickPlate.name.trim()) return "نام بشقاب آماده را وارد کنید.";
	return undefined;
}

function validateEditDiaryEntryInput(input: EditDiaryEntryInput) {
	if (!ISO_DATE.test(input.date)) return "تاریخ دفتر روزانه معتبر نیست.";
	if (!input.entryId.trim() || input.entryId.length > 80) return "شناسه ثبت معتبر نیست.";
	if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 160)
		return "شناسه ویرایش معتبر نیست.";
	const request = input.request;
	if (!allowedMealTypes.has(request.mealType)) return "وعده انتخاب‌شده معتبر نیست.";
	if (!new Set<DiaryEntrySourceType>(["FOOD", "MEAL", "MANUAL"]).has(request.sourceType))
		return "نوع ثبت معتبر نیست.";
	if (!Number.isFinite(request.servingQuantity) || request.servingQuantity <= 0)
		return "مقدار سروینگ معتبر نیست.";
	return undefined;
}

function createDiaryEntryRequestFrom(
	input: QuickAddEntryInput,
): CreateDiaryEntryRequestDto {
	return {
		mealType: input.mealType,
		sourceType: input.sourceType,
		sourceFoodId: input.sourceType === "FOOD" ? input.sourceId : null,
		sourceMealId: input.sourceType === "MEAL" ? input.sourceId : null,
		servingQuantity: input.servingQuantity,
		servingUnit: input.sourceType === "FOOD" ? input.servingUnit : null,
	};
}

function quickAddFailureState(error: unknown): QuickAddEntryResult {
	unstable_rethrow(error);
	if (error instanceof ApiClientError) {
		const sourceUnavailable = error.code === "RESOURCE_NOT_FOUND" || /food was not found/i.test(error.message);
		return {
			ok: false,
			message: sourceUnavailable
				? "غذای انتخاب‌شده دیگر در دسترس نیست. به جستجو برگردید و آن را جایگزین کنید."
				: localizedApiErrorMessage(error) || "ثبت غذا در دفتر روزانه ناموفق بود.",
			requestId: error.requestId,
			reason: sourceUnavailable ? "source-unavailable" : undefined,
		};
	}

	return {
		ok: false,
		message: "ثبت غذا در دفتر روزانه ناموفق بود. کمی بعد دوباره تلاش کنید.",
	};
}

/**
 * Revalidates the diary routes once, after a gesture that issued several
 * writes.
 *
 * Callers that batch writes pass `revalidate: false` on each one and call this
 * instead, so the route re-renders once rather than once per write. It must run
 * after a partial failure too — earlier writes in the gesture did land, and the
 * user needs to see them.
 */
export async function revalidateDiaryPathsAction() {
	revalidateQuickAddPaths();
}

function revalidateQuickAddPaths() {
	logQuickAddStage("route_revalidation", "started", { pathCount: 2 });
	revalidatePath("/dashboard");
	revalidatePath("/foods");
	logQuickAddStage("route_revalidation", "succeeded", { pathCount: 2 });
}

function logQuickAddStage(
	stage: string,
	outcome: string,
	fields: Record<string, number | string | boolean> = {},
) {
	console.info(JSON.stringify({
		event: "quick_add_mutation",
		stage,
		outcome,
		...fields,
	}));
}

function sanitizeNextPath(nextPath: string, date: string) {
	if (nextPath.startsWith("/")) return nextPath;
	return `/dashboard?date=${date}`;
}
