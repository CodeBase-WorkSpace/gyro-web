"use client";

import {CopyIcon, PencilIcon} from "lucide-react";
import {useState} from "react";

import {MealTemplateForm} from "@/components/foods/meal-template-form";
import {buttonVariants} from "@/components/ui/button";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,} from "@/components/ui/sheet";
import {ScrollArea} from "@/components/ui/scroll-area";
import type {MealDetailDto} from "@/lib/api/meals";
import type {MealTemplateFormItem} from "@/lib/foods/meal-editor";
import {servingDefinitionDraftFrom} from "@/lib/foods/serving-definition";

export function CustomMealEditDialog({
                                       meal,
                                       initialItems,
                                     }: {
  meal: MealDetailDto;
  initialItems: MealTemplateFormItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={buttonVariants({variant: "outline"})}>
        <PencilIcon data-icon="inline-start"/>
        ویرایش
      </SheetTrigger>
      <SheetContent side="bottom"
                    className="mx-auto w-full max-w-3xl p-4 sm:p-5"
                    dir="rtl">
        <SheetHeader className="shrink-0 gap-1 pl-10">
          <SheetTitle>ویرایش وعده سفارشی</SheetTitle>
          <SheetDescription>
            نام و فهرست کامل اجزا جایگزین الگوی فعلی می‌شوند و ثبت‌های قدیمی
            تغییر نمی‌کنند.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex min-h-0 flex-1" viewportClassName="flex min-h-0 flex-1 flex-col pb-2 pe-1">
          <MealTemplateForm
            mode="edit"
            mealId={meal.id}
            initialName={meal.name}
            initialItems={initialItems}
            initialServingDefinition={servingDefinitionDraftFrom(meal.servingDefinition)}
            onSaved={() => setOpen(false)}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function CustomMealDuplicateSheet({meal, initialItems}: {
  meal: MealDetailDto;
  initialItems: MealTemplateFormItem[]
}) {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger className={buttonVariants({variant: "outline"})}>
      <CopyIcon data-icon="inline-start"/>کپی
    </SheetTrigger>
    <SheetContent side="bottom" className="mx-auto w-full max-w-3xl p-4 sm:p-5" dir="rtl">
      <SheetHeader className="shrink-0 gap-1 pl-10">
        <SheetTitle>نسخه جدید وعده سفارشی</SheetTitle>
        <SheetDescription>نام را تغییر دهید؛ نسخه جدید مستقل است و وعده اصلی تغییر نمی‌کند.</SheetDescription>
      </SheetHeader>
      <ScrollArea className="flex min-h-0 flex-1" viewportClassName="flex min-h-0 flex-1 flex-col pb-2 pe-1">
        <MealTemplateForm mode="duplicate" mealId={meal.id} initialName={`کپی ${meal.name}`} originalName={meal.name}
                          initialItems={initialItems}
                          initialServingDefinition={servingDefinitionDraftFrom(meal.servingDefinition)}
                          onSaved={() => setOpen(false)}/>
      </ScrollArea>
    </SheetContent>
  </Sheet>;
}
