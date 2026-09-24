import type {Metadata} from "next";
import {redirect} from "next/navigation";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import {GoalEditForm} from "@/components/progress/goal-edit-form";
import {GoalTargetExplainer} from "@/components/progress/goal-target-explainer";
import {getCurrentEntitlement} from "@/lib/api/entitlement";
import {getGoals} from "@/lib/api/goals";
import {getNutritionCoachState} from "@/lib/api/nutrition-coach";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";
import {resolveDiaryDate} from "@/lib/diary/dashboard-loader";
import {goalFormValuesFromGoal} from "@/lib/goals/goal-form";
import {isOnboardingMode} from "@/lib/onboarding";
import {demoSubscriptionState} from "@/lib/subscription/entitlements";
import {finiteNumber} from "@/lib/recalibration/evidence";

export const metadata: Metadata = {
	title: "Gyro | اهداف تغذیه",
  description: "تنظیم هدف کالری، ماکروها و برنامه روزانه",
};

export default async function GoalsPage({
	searchParams,
}: {
	searchParams: Promise<{ onboarding?: string; wizard?: string }>;
}) {
	const session = await getSession();

	if (!session.isAuthenticated) {
		redirect("/auth/login?next=%2Fprogress%2Fgoals&expired=1");
	}

	const [goal, subscription, nutritionCoach] = await Promise.all([
		authenticatedServerRequest(
			(accessToken) => getGoals(accessToken),
			{ nextPath: "/progress/goals", retryPolicy: "idempotent" },
		),
		loadCurrentEntitlement(),
		loadNutritionCoach(),
	]);
	const {onboarding, wizard} = await searchParams;
	const onboardingMode = isOnboardingMode(onboarding, goal.status);
	const openWizard = onboardingMode || wizard === "1";
	const today = resolveDiaryDate(undefined, session.user.timezone);
	const formValues = goalFormValuesFromGoal(
		goal.status === "CONFIGURED"
			? goal
			: {
					status: "UNCONFIGURED",
					activePlan: {
						id: "draft",
						goalType: "MAINTAIN_WEIGHT",
						startDate: today,
						baseTargets: {
							calories: 2000,
							protein: 120,
							carbs: 220,
							fat: 65,
							fiber: null,
						},
						calculator: null,
						schedule: {
							type: "FLAT",
							activeFrom: today,
							activeTo: null,
						},
					},
      },
	);

	return (
		<main
			id="main-content"
			className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
			aria-label="اهداف تغذیه"
		>
				<AppTopBar
					title="اهداف تغذیه"
          description="کالری، ماکروها و برنامه روزانه"
					backLink={{ href: "/progress", label: "بازگشت به پیشرفت" }}
					showDateControl={false}
					showMobileDateAction={false}
				/>

        <GoalTargetExplainer
          goal={goal}
          measuredTdee={
            nutritionCoach?.measuredTdee ??
            finiteNumber(
              nutritionCoach?.recommendation?.basis["estimatedTdee"],
            )
          }
        />

        <GoalEditForm
          goal={goal}
          initialValues={formValues}
          initialConfigured={goal.status === "CONFIGURED"}
          subscription={subscription}
          onboarding={onboardingMode}
          openWizard={openWizard}
        />
		</main>
	);
}

async function loadCurrentEntitlement() {
	try {
		return await authenticatedServerRequest(
			(accessToken) => getCurrentEntitlement(accessToken),
			{ nextPath: "/progress/goals", retryPolicy: "idempotent" },
		);
	} catch (error) {
		console.warn("event=entitlement_fetch outcome=failure surface=goals", error);
		return demoSubscriptionState("FREE");
	}
}

async function loadNutritionCoach() {
	try {
		return await authenticatedServerRequest(
			(accessToken) => getNutritionCoachState(accessToken),
			{ nextPath: "/progress/goals", retryPolicy: "idempotent" },
		);
	} catch (error) {
		console.warn("event=nutrition_coach_fetch outcome=failure surface=goals", error);
		return null;
	}
}
