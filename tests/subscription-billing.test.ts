import assert from "node:assert/strict";
import test from "node:test";

import {
	getSubscriptionCatalog,
	parseSubscriptionCatalog,
	type SubscriptionCatalogDto,
} from "../lib/api/subscription-catalog";
import { parseEntitlement } from "../lib/api/entitlement";
import { localizedApiErrorMessage } from "../lib/api/errors";
import {
	type AccountRecoveryCode,
	accountRecoveryView,
	accountRecoveryViewForApiError,
	parseAccountRecoveryCode,
} from "../lib/subscription/account-recovery";
import {
	billingStatusForSubscription,
	billingStatusFromApiError,
	parseBillingStatusCode,
} from "../lib/subscription/billing";
import {
	demoSubscriptionState,
	parseSubscriptionTier,
	subscriptionStateFromEntitlement,
} from "../lib/subscription/entitlements";
import {
	currentPlanFromSubscription,
	catalogPricePresentation,
	defaultDisplayPrice,
	formatPlanPrice,
	planForTier,
	plansWithCatalog,
	subscriptionPlans,
} from "../lib/subscription/plans";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("future date errors localize the maximum date", () => {
	const message = localizedApiErrorMessage({
		code: "FUTURE_DATE_LIMIT",
		message: "Date is outside the available diary window.",
		metadata: {maximumDate: "2026-07-12"},
	});

	assert.match(message, /تیر|۱۴۰۵/);
	assert.doesNotMatch(message, /2026-07-12/);
});

const catalogResponse: SubscriptionCatalogDto = {
	plans: [
		{
			code: "FREE",
			name: "Free",
			free: true,
			gracePeriodDays: 0,
			displayName: "رایگان",
			shortDescription: "ردیابی روزانه کالری و درشت‌مغذی‌ها",
			featureSummary: null,
			locale: "fa-IR",
			features: [
				{
					key: "premium_schedules",
					description: "Advanced scheduling",
					enabled: false,
				},
			],
			prices: [],
		},
		{
			code: "ADVANCED",
			name: "Advanced",
			free: false,
			gracePeriodDays: 7,
			displayName: "پیشرفته",
			shortDescription: "برنامه‌ریزی، تحلیل و صادرات داده",
			featureSummary: null,
			locale: "fa-IR",
			features: [
				{
					key: "premium_schedules",
					description: "Advanced scheduling",
					enabled: true,
				},
			],
			prices: [
				{
					id: 10,
					billingPeriodDays: 30,
					baseAmount: 1990000,
					discountPercent: 0,
					amount: 1990000,
					currency: "IRR",
					badge: null,
				},
				{
					id: 11,
					billingPeriodDays: 90,
					baseAmount: 6000000,
					discountPercent: 8.5,
					amount: 5490000,
					currency: "IRR",
					badge: "RECOMMENDED",
				},
				{
					id: 12,
					billingPeriodDays: 365,
					baseAmount: 19900000,
					discountPercent: 0,
					amount: 19900000,
					currency: "IRR",
					badge: "BEST_VALUE",
				},
			],
		},
	],
};

test("subscription plan catalog exposes Free and Advanced tiers", () => {
	assert.equal(subscriptionPlans.length, 2);

	const free = planForTier("FREE");
	const advanced = planForTier("ADVANCED");

	assert.equal(free.name, "Free");
	assert.equal(free.localizedName, "رایگان");
	assert.equal(
		free.features.some((feature) => feature.label === "ثبت نامحدود غذا"),
		true,
	);
	assert.equal(
		free.features.some((feature) => feature.label === "تا ۲ غذای سفارشی"),
		true,
	);

	assert.equal(advanced.name, "Advanced");
	assert.equal(advanced.localizedName, "پیشرفته");
	assert.equal(
		advanced.features.some(
			(feature) => feature.label === "خروجی داده CSV/JSON",
		),
		true,
	);
	assert.equal(
		advanced.entitlements.includes("ADVANCED_NUTRITION_DESIGNER"),
		true,
	);
});

test("subscription catalog parser accepts prices badges and optional fields", () => {
	const parsed = parseSubscriptionCatalog(catalogResponse);
	const advanced = parsed.plans.find((plan) => plan.code === "ADVANCED");

	assert.ok(advanced);
	assert.equal(advanced.prices.length, 3);
	assert.equal(advanced.prices[0].billingPeriodDays, 30);
	assert.equal(advanced.prices[0].badge, null);
	assert.equal(advanced.prices[1].badge, "RECOMMENDED");
	assert.equal(formatPlanPrice(advanced.prices[0]), "۱۹۹٬۰۰۰ تومان");
});

test("defaultDisplayPrice prefers recommended price over sorted monthly price", () => {
	const advanced = parseSubscriptionCatalog(catalogResponse).plans.find(
		(plan) => plan.code === "ADVANCED",
	);

	assert.ok(advanced);
	const displayPrice = defaultDisplayPrice(advanced.prices);

	assert.ok(displayPrice);
	assert.equal(displayPrice.billingPeriodDays, 90);
	assert.equal(displayPrice.badge, "RECOMMENDED");
	assert.equal(formatPlanPrice(displayPrice), "۵۴۹٬۰۰۰ تومان");
});

test("catalog price presentation uses backend list price and discount only", () => {
	const advanced = parseSubscriptionCatalog(catalogResponse).plans.find(
		(plan) => plan.code === "ADVANCED",
	);
	assert.ok(advanced);
	const quarterly = advanced.prices.find((price) => price.billingPeriodDays === 90);
	const monthly = advanced.prices.find((price) => price.billingPeriodDays === 30);
	assert.ok(quarterly);
	assert.ok(monthly);

	assert.deepEqual(catalogPricePresentation(quarterly), {
		discounted: true,
		basePrice: "۶۰۰٬۰۰۰ تومان",
		finalPrice: "۵۴۹٬۰۰۰ تومان",
		discountLabel: "۸٫۵٪ تخفیف",
	});
	assert.equal(catalogPricePresentation(monthly).basePrice, null);
});

test("subscription catalog parser rejects malformed backend responses", () => {
	assert.throws(() => parseSubscriptionCatalog({ plans: null }));
	assert.throws(() =>
		parseSubscriptionCatalog({ plans: [{ code: "ADVANCED" }] }),
	);
	assert.throws(() =>
		parseSubscriptionCatalog({
			plans: [
				{
					...catalogResponse.plans[1],
					prices: [
						{
							id: 1,
							billingPeriodDays: "30",
							amount: 1990000,
							currency: "IRR",
						},
					],
				},
			],
		}),
	);
});

test("getSubscriptionCatalog requests public billing plans endpoint", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";

	global.fetch = async (input) => {
		requestedUrl = String(input);

		return new Response(JSON.stringify(catalogResponse), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		}) as Response;
	};

	try {
		const catalog = await getSubscriptionCatalog("fa-IR");

		assert.equal(
			requestedUrl,
			"http://localhost:8080/api/v1/billing/plans?locale=fa-IR",
		);
		assert.equal(catalog.plans.length, 2);
	} finally {
		global.fetch = originalFetch;
	}
});

test("getSubscriptionCatalog accepts catalog-specific fetch caching options", async () => {
	const originalFetch = global.fetch;
	let requestedInit:
		| (RequestInit & { next?: { revalidate?: number | false } })
		| undefined;

	global.fetch = async (_input, init) => {
		requestedInit = init as RequestInit & {
			next?: { revalidate?: number | false };
		};

		return new Response(JSON.stringify(catalogResponse), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		}) as Response;
	};

	try {
		await getSubscriptionCatalog("fa-IR", {
			cache: "force-cache",
			next: { revalidate: 300 },
			timeoutMs: 3_000,
		});

		assert.equal(requestedInit?.cache, "force-cache");
		assert.equal(requestedInit?.next?.revalidate, 300);
	} finally {
		global.fetch = originalFetch;
	}
});

test("plansWithCatalog merges backend prices with local plan presentation copy", () => {
	const plans = plansWithCatalog(catalogResponse);
	const advanced = plans.find((plan) => plan.tier === "ADVANCED");

	assert.ok(advanced);
	assert.equal(advanced.localizedName, "پیشرفته");
	assert.equal(advanced.summary, "برنامه‌ریزی، تحلیل و خروجی داده");
	assert.equal(advanced.cta, "فعال‌سازی پریمیوم");
	assert.equal(advanced.prices.length, 3);
	assert.deepEqual(advanced.catalogFeatures, [
		{
			label: "Advanced scheduling",
			included: true,
			key: "premium_schedules",
		},
	]);
	assert.equal(
		advanced.features.some(
			(feature) => feature.label === "خروجی داده CSV/JSON",
		),
		true,
	);
});

test("current plan resolves from subscription entitlement state", () => {
	const freeSubscription = demoSubscriptionState(
		parseSubscriptionTier("free"),
	);
	const advancedSubscription = demoSubscriptionState(
		parseSubscriptionTier("advanced"),
	);
	const legacyPremiumSubscription = demoSubscriptionState(
		parseSubscriptionTier("premium"),
	);

	assert.equal(currentPlanFromSubscription(freeSubscription).tier, "FREE");
	assert.equal(
		currentPlanFromSubscription(advancedSubscription).tier,
		"ADVANCED",
	);
	assert.equal(advancedSubscription.entitlements.length > 0, true);
	assert.equal(legacyPremiumSubscription.tier, "ADVANCED");
});

test("billing status parser accepts supported status previews", () => {
	assert.equal(parseBillingStatusCode("past_due"), "PAST_DUE");
	assert.equal(parseBillingStatusCode("backend_error"), "BACKEND_ERROR");
	assert.equal(
		parseBillingStatusCode("provider_unavailable"),
		"PROVIDER_UNAVAILABLE",
	);
	assert.equal(parseBillingStatusCode("unknown"), null);
});

test("billing status defaults from current subscription", () => {
	assert.equal(
		billingStatusForSubscription(demoSubscriptionState("FREE")).code,
		"FREE",
	);
	assert.equal(
		billingStatusForSubscription(demoSubscriptionState("ADVANCED")).code,
		"ACTIVE",
	);
	assert.equal(
		billingStatusForSubscription({
			...demoSubscriptionState("ADVANCED"),
			status: "GRACE_PERIOD",
		}).code,
		"PAST_DUE",
	);
	assert.equal(
		billingStatusForSubscription({
			...demoSubscriptionState("ADVANCED"),
			status: "BILLED_BLOCKED",
		}).code,
		"PAYMENT_ACTION_FAILED",
	);
	assert.equal(
		billingStatusForSubscription(
			demoSubscriptionState("ADVANCED"),
			"expired",
		).code,
		"EXPIRED",
	);
});

test("entitlement parser maps backend features into subscription state", () => {
	const entitlement = parseEntitlement({
		planKey: "ADVANCED",
		status: "ACTIVE",
		features: [
			"premium_schedules",
			"advanced_analytics",
			"goal_recalibration",
			"unknown_future_feature",
		],
		currentPeriodEnd: "2026-08-01T00:00:00Z",
		gracePeriodEnd: null,
		cancelAtPeriodEnd: false,
		supportReasonCode: null,
		source: "SUBSCRIPTION",
	});
	const subscription = subscriptionStateFromEntitlement(entitlement);

	assert.equal(subscription.tier, "ADVANCED");
	assert.equal(subscription.status, "ACTIVE");
	assert.equal(subscription.source, "backend");
	assert.equal(subscription.entitlements.includes("premium_schedules"), true);
	assert.equal(
		subscription.entitlements.includes("advanced_analytics"),
		true,
	);
	assert.equal(
		subscription.entitlements.includes("goal_recalibration"),
		true,
	);
	assert.equal(
		subscription.entitlements.includes("unknown_future_feature" as never),
		false,
	);
	assert.equal(subscription.entitlements.includes("data_export"), false);
	assert.equal(subscription.entitlements.includes("higher_limits"), false);
	assert.equal(
		subscription.entitlements.includes("ADVANCED_NUTRITION_DESIGNER"),
		true,
	);
});

test("grace subscriptions retain only backend-granted features", () => {
	const subscription = subscriptionStateFromEntitlement(
		parseEntitlement({
			planKey: "ADVANCED",
			status: "GRACE_PERIOD",
			features: ["future_meal_planning"],
			currentPeriodEnd: "2026-07-01T00:00:00Z",
			gracePeriodEnd: "2026-07-04T00:00:00Z",
			cancelAtPeriodEnd: false,
			supportReasonCode: "PAYMENT_PAST_DUE",
			source: "SUBSCRIPTION",
		}),
	);

	assert.equal(subscription.entitlements.includes("future_meal_planning"), true);
	assert.equal(subscription.entitlements.includes("premium_schedules"), false);
	assert.equal(subscription.entitlements.includes("higher_limits"), false);
});

test("entitlement parser rejects malformed backend responses", () => {
	assert.throws(() => parseEntitlement({ status: "ACTIVE" }));
	assert.throws(() =>
		parseEntitlement({
			planKey: "ADVANCED",
			status: "UNKNOWN",
			features: [],
			currentPeriodEnd: null,
			gracePeriodEnd: null,
			cancelAtPeriodEnd: false,
			supportReasonCode: null,
			source: "SUBSCRIPTION",
		}),
	);
});

test("billing status maps backend error codes into user-facing states", () => {
	assert.equal(
		billingStatusFromApiError("SUBSCRIPTION_REQUIRED").code,
		"EMPTY",
	);
	assert.equal(
		billingStatusFromApiError("SUBSCRIPTION_EXPIRED").code,
		"EXPIRED",
	);
	assert.equal(
		billingStatusFromApiError("PAYMENT_PAST_DUE").code,
		"PAST_DUE",
	);
	assert.equal(billingStatusFromApiError("GRACE_PERIOD").code, "PAST_DUE");
	assert.equal(
		billingStatusFromApiError("BILLING_PROVIDER_UNAVAILABLE").code,
		"PROVIDER_UNAVAILABLE",
	);
	assert.equal(
		billingStatusFromApiError("PAYMENT_ACTION_FAILED").code,
		"PAYMENT_ACTION_FAILED",
	);
	assert.equal(
		billingStatusFromApiError("BILLING_BLOCKED").code,
		"PAYMENT_ACTION_FAILED",
	);
	assert.equal(
		billingStatusFromApiError("BILLED_BLOCKED").code,
		"PAYMENT_ACTION_FAILED",
	);
	assert.equal(
		billingStatusFromApiError("UNEXPECTED_ERROR").code,
		"BACKEND_ERROR",
	);
});

test("account recovery parser accepts stoppage ban billing and feature states", () => {
	assert.equal(
		parseAccountRecoveryCode("account_stopped"),
		"ACCOUNT_STOPPED",
	);
	assert.equal(parseAccountRecoveryCode("ACCOUNT_BANNED"), "ACCOUNT_BANNED");
	assert.equal(
		parseAccountRecoveryCode("payment_past_due"),
		"PAYMENT_PAST_DUE",
	);
	assert.equal(parseAccountRecoveryCode("past_due"), "PAYMENT_PAST_DUE");
	assert.equal(
		parseAccountRecoveryCode("subscription_expired"),
		"SUBSCRIPTION_EXPIRED",
	);
	assert.equal(parseAccountRecoveryCode("expired"), "SUBSCRIPTION_EXPIRED");
	assert.equal(
		parseAccountRecoveryCode("provider_unavailable"),
		"PROVIDER_UNAVAILABLE",
	);
	assert.equal(
		parseAccountRecoveryCode("feature_temporarily_disabled"),
		"FEATURE_TEMPORARILY_DISABLED",
	);
	assert.equal(
		parseAccountRecoveryCode("feature_disabled"),
		"FEATURE_TEMPORARILY_DISABLED",
	);
	assert.equal(
		parseAccountRecoveryCode("internal_authorization_stack"),
		null,
	);
});

test("account recovery states expose support copy safe actions and request ids", () => {
	const states: AccountRecoveryCode[] = [
		"ACCOUNT_STOPPED",
		"ACCOUNT_BANNED",
		"PAYMENT_PAST_DUE",
		"SUBSCRIPTION_EXPIRED",
		"PROVIDER_UNAVAILABLE",
		"FEATURE_TEMPORARILY_DISABLED",
	];

	for (const state of states) {
		const recovery = accountRecoveryView(state, "req-123");

		assert.ok(recovery);
		assert.equal(recovery.code, state);
		assert.equal(recovery.requestId, "req-123");
		assert.equal(Boolean(recovery.title), true);
		assert.equal(Boolean(recovery.description), true);
		assert.equal(recovery.safeActions.length > 0, true);
		assert.equal(Boolean(recovery.supportPath), true);
		assert.equal(Boolean(recovery.primaryAction.label), true);
	}
});

test("account recovery distinguishes recoverable temporary and hard-block states", () => {
	assert.equal(accountRecoveryView("PAYMENT_PAST_DUE")?.kind, "recoverable");
	assert.equal(
		accountRecoveryView("SUBSCRIPTION_EXPIRED")?.kind,
		"recoverable",
	);
	assert.equal(
		accountRecoveryView("PROVIDER_UNAVAILABLE")?.kind,
		"temporary",
	);
	assert.equal(
		accountRecoveryView("FEATURE_TEMPORARILY_DISABLED")?.kind,
		"temporary",
	);
	assert.equal(accountRecoveryView("ACCOUNT_STOPPED")?.kind, "hard_block");
	assert.equal(accountRecoveryView("ACCOUNT_BANNED")?.kind, "hard_block");
});

test("account recovery maps backend error codes without exposing internals", () => {
	assert.equal(
		accountRecoveryViewForApiError("ACCOUNT_SUSPENDED", "req-suspended")
			?.code,
		"ACCOUNT_STOPPED",
	);
	assert.equal(
		accountRecoveryViewForApiError("ACCOUNT_BANNED", "req-banned")
			?.requestId,
		"req-banned",
	);
	assert.equal(
		accountRecoveryViewForApiError("FEATURE_DISABLED")?.code,
		"FEATURE_TEMPORARILY_DISABLED",
	);
	assert.equal(
		accountRecoveryViewForApiError("SPRING_ACCESS_DENIED_EXCEPTION"),
		null,
	);
});
