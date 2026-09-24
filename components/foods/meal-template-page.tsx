import {CopyIcon, PencilIcon} from "lucide-react";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import {MealTemplateForm,} from "@/components/foods/meal-template-form";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import type {MealDetailDto} from "@/lib/api/meals";
import type {Session} from "@/lib/auth/types";
import {mealEditorItemsFrom, type MealTemplateFormItem,} from "@/lib/foods/meal-editor";
import {servingDefinitionDraftFrom} from "@/lib/foods/serving-definition";

export function MealTemplatePage({
	mode,
	meal,
	session,
	initialItems,
}: {
	mode: "edit" | "duplicate";
	meal: MealDetailDto;
	session: Extract<Session, { isAuthenticated: true }>;
	initialItems?: MealTemplateFormItem[];
}) {
	const isDuplicate = mode === "duplicate";
	const Icon = isDuplicate ? CopyIcon : PencilIcon;

	return (
		<main
			id="main-content"
			className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8"
		>
				<AppTopBar
					title={isDuplicate ? "ساخت نسخه جدید" : "ویرایش وعده سفارشی"}
					description={meal.name}
					showDateControl={false}
					showMobileDateAction={false}
					backLink={{ href: `/foods/meals/${meal.id}`, label: "بازگشت به جزئیات وعده" }}
				/>
				<Card className="rounded-3xl border bg-card shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Icon className="size-5 text-primary" aria-hidden="true" />
							{isDuplicate ? "نسخه مستقل از وعده" : "ویرایش کامل الگو"}
						</CardTitle>
						<CardDescription>
							{isDuplicate
								? "نام جدید وارد کنید؛ تغییرات این نسخه به الگوی اصلی منتقل نمی‌شود."
								: "نام و فهرست کامل اجزا جایگزین الگوی فعلی می‌شوند و ثبت‌های قدیمی تغییر نمی‌کنند."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<MealTemplateForm
							mode={mode}
							mealId={meal.id}
							initialName={isDuplicate ? "" : meal.name}
              initialItems={
                initialItems ??
                mealEditorItemsFrom(
                  meal,
                  meal.items.map(() => null),
                )
              }
							originalName={isDuplicate ? meal.name : undefined}
              initialServingDefinition={servingDefinitionDraftFrom(meal.servingDefinition)}
						/>
					</CardContent>
				</Card>
		</main>
	);
}
