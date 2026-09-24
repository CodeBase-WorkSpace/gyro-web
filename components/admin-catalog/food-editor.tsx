"use client";

import {useMemo, useState, useTransition} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArchiveIcon, ArchiveRestoreIcon, CopyIcon, PlusIcon, Trash2Icon} from "lucide-react";

import {
  createAdminCategoryAction,
  createAdminFoodAction,
  setAdminFoodArchivedAction,
  updateAdminFoodAction,
} from "@/app/_actions/admin-catalog";
import {Button, buttonVariants} from "@/components/ui/button";
import {Field, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import type {
  AdminCatalogWarning,
  AdminFoodCategoryDto,
  AdminFoodDetailDto,
  AdminFoodPayload,
  AdminServingUnitDto,
} from "@/lib/api/admin-catalog";

type LocalizationRow = { locale: "en" | "fa"; displayName: string };
type AliasRow = { locale: "en" | "fa"; alias: string };
type PortionRow = {
  servingUnitCode: string;
  amount: string;
  gramWeight: string;
  portionDescription: string;
};
type NutritionState = {
  baseQuantity: string;
  baseUnitCode: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
};

export function AdminFoodEditor({
                                  mode,
                                  food,
                                  servingUnits,
                                  categories,
                                }: {
  mode: "create" | "edit";
  food: AdminFoodDetailDto | null;
  servingUnits: AdminServingUnitDto[];
  categories: AdminFoodCategoryDto[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const readOnly = mode === "edit" && food != null && !food.editable;

  const [name, setName] = useState(food?.name ?? "");
  const [brandName, setBrandName] = useState(food?.brandName ?? "");
  const [categoryId, setCategoryId] = useState(food?.categoryId ?? "");
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [curationStatus, setCurationStatus] = useState(food?.curationStatus ?? "REVIEWED");
  const [isSearchable, setIsSearchable] = useState(food?.isSearchable ?? true);
  const [lockVersion, setLockVersion] = useState(food?.lockVersion ?? 0);
  const [archived, setArchived] = useState(food?.archived ?? false);

  const [localizations, setLocalizations] = useState<LocalizationRow[]>(
    food?.localizations.length
      ? food.localizations.map((localization) => ({
        locale: localization.locale === "fa" ? "fa" : "en",
        displayName: localization.displayName,
      }))
      : [{locale: "fa", displayName: ""}, {locale: "en", displayName: ""}],
  );
  const [aliases, setAliases] = useState<AliasRow[]>(
    food?.aliases.map((alias) => ({locale: alias.locale === "fa" ? "fa" : "en", alias: alias.alias})) ?? [],
  );
  const [nutrition, setNutrition] = useState<NutritionState>({
    baseQuantity: numberToInput(food?.nutrition?.baseQuantity, "100"),
    baseUnitCode: food?.nutrition?.baseUnitCode ?? "GRAM",
    calories: numberToInput(food?.nutrition?.calories, "0"),
    protein: numberToInput(food?.nutrition?.protein, "0"),
    carbs: numberToInput(food?.nutrition?.carbs, "0"),
    fat: numberToInput(food?.nutrition?.fat, "0"),
    fiber: numberToInput(food?.nutrition?.fiber, "0"),
    sugar: numberToInput(food?.nutrition?.sugar, "0"),
    sodium: numberToInput(food?.nutrition?.sodium, "0"),
  });
  const macroCalories = useMemo(
    () => macroCaloriesFrom(nutrition),
    [nutrition.protein, nutrition.carbs, nutrition.fat],
  );
  const calorieDifference = useMemo(() => {
    const enteredCalories = nonNegativeInputNumber(nutrition.calories);
    return enteredCalories == null || macroCalories == null
      ? null
      : Math.round(enteredCalories - macroCalories);
  }, [nutrition.calories, macroCalories]);
  const [portions, setPortions] = useState<PortionRow[]>(
    food?.portions.length
      ? food.portions.map((portion) => ({
        servingUnitCode: portion.servingUnitCode ?? "",
        amount: numberToInput(portion.amount, "1"),
        gramWeight: portion.gramWeight != null ? numberToInput(portion.gramWeight, "") : "",
        portionDescription: portion.portionDescription ?? "",
      }))
      : [{servingUnitCode: "GRAM", amount: "100", gramWeight: "", portionDescription: ""}],
  );

  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [warnings, setWarnings] = useState<AdminCatalogWarning[]>([]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("نام غذا الزامی است.");
    if (!nutrition.baseUnitCode) errors.push("واحد پایه ارزش غذایی الزامی است.");
    if (!isPositiveNumber(nutrition.baseQuantity)) errors.push("مقدار پایه ارزش غذایی باید عددی مثبت باشد.");
    (["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"] as const).forEach((key) => {
      if (!isNonNegativeNumber(nutrition[key])) errors.push(`مقدار ${nutritionLabels[key]} معتبر نیست.`);
    });
    localizations.forEach((localization, index) => {
      if (!localization.displayName.trim()) errors.push(`نام نمایشی ترجمه ${index + 1} خالی است.`);
    });
    const locales = localizations.map((localization) => localization.locale);
    if (new Set(locales).size !== locales.length) errors.push("برای هر زبان فقط یک ترجمه مجاز است.");
    aliases.forEach((alias, index) => {
      if (!alias.alias.trim()) errors.push(`نام مستعار ${index + 1} خالی است.`);
    });
    portions.forEach((portion, index) => {
      if (!isPositiveNumber(portion.amount)) errors.push(`مقدار سروینگ ${index + 1} باید عددی مثبت باشد.`);
      if (portion.gramWeight && !isPositiveNumber(portion.gramWeight)) {
        errors.push(`وزن گرمی سروینگ ${index + 1} معتبر نیست.`);
      }
      if (!portion.servingUnitCode && !portion.portionDescription.trim()) {
        errors.push(`سروینگ ${index + 1} به واحد یا توضیح نیاز دارد.`);
      }
    });
    return errors;
  }, [name, nutrition, localizations, aliases, portions]);

  const buildPayload = (): AdminFoodPayload => ({
    name: name.trim(),
    brandName: brandName.trim() || null,
    categoryId: categoryId || null,
    curationStatus,
    isSearchable,
    localizations: localizations
      .filter((localization) => localization.displayName.trim())
      .map((localization) => ({locale: localization.locale, displayName: localization.displayName.trim()})),
    aliases: aliases
      .filter((alias) => alias.alias.trim())
      .map((alias) => ({locale: alias.locale, alias: alias.alias.trim()})),
    nutrition: {
      baseQuantity: Number(nutrition.baseQuantity),
      baseUnitCode: nutrition.baseUnitCode,
      calories: Number(nutrition.calories),
      protein: Number(nutrition.protein),
      carbs: Number(nutrition.carbs),
      fat: Number(nutrition.fat),
      fiber: Number(nutrition.fiber),
      sugar: Number(nutrition.sugar),
      sodium: Number(nutrition.sodium),
    },
    portions: portions.map((portion, index) => ({
      servingUnitCode: portion.servingUnitCode || null,
      amount: Number(portion.amount),
      gramWeight: portion.gramWeight ? Number(portion.gramWeight) : null,
      portionDescription: portion.portionDescription.trim() || null,
      sortOrder: index,
    })),
  });

  const handleSave = () => {
    if (validationErrors.length) {
      setMessage({tone: "error", text: validationErrors[0]});
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const payload = buildPayload();
      const result = mode === "create"
        ? await createAdminFoodAction(payload)
        : await updateAdminFoodAction(food!.id, {...payload, expectedLockVersion: lockVersion});

      if (!result.ok) {
        setMessage({
          tone: "error",
          text: result.conflict
            ? "این غذا همزمان توسط شخص دیگری ویرایش شده است. صفحه را دوباره بارگذاری کنید."
            : result.message,
        });
        return;
      }

      setWarnings(result.warnings);
      setLockVersion(result.food.lockVersion);
      if (mode === "create") {
        setMessage({tone: "success", text: "غذا ساخته شد؛ در حال انتقال به صفحه ویرایش..."});
        router.push(`/admin/catalog/${result.food.id}`);
      } else {
        setMessage({tone: "success", text: "تغییرات ذخیره شد."});
        router.refresh();
      }
    });
  };

  const handleArchiveToggle = () => {
    if (!food) return;
    startTransition(async () => {
      const result = await setAdminFoodArchivedAction(food.id, !archived);
      if (!result.ok) {
        setMessage({tone: "error", text: result.message});
        return;
      }
      setArchived(result.archived);
      setLockVersion((version) => version + 1);
      setMessage({tone: "success", text: result.archived ? "غذا آرشیو شد." : "غذا بازیابی شد."});
      router.refresh();
    });
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    startTransition(async () => {
      const result = await createAdminCategoryAction(newCategoryName);
      if (!result.ok) {
        setMessage({tone: "error", text: result.message});
        return;
      }
      setCategoryOptions((options) =>
        options.some((option) => option.id === result.category.id) ? options : [...options, result.category],
      );
      setCategoryId(result.category.id);
      setNewCategoryName("");
    });
  };

  return (
    <div className="grid gap-5">
      {readOnly && food ? (
        <section
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4"
          aria-label="غذای کاربر"
        >
          <p className="text-sm font-bold leading-6 text-amber-700 dark:text-amber-300">
            این غذا توسط یک کاربر ساخته شده و فقط‌خواندنی است؛ برای افزودن نسخه کاتالوگی، از روی آن کپی بسازید.
          </p>
          <Link
            href={`/admin/catalog/new?copyFrom=${encodeURIComponent(food.id)}`}
            className={buttonVariants({className: "h-10 rounded-full font-black"})}
          >
            <CopyIcon className="size-4"/>
            کپی به کاتالوگ
          </Link>
        </section>
      ) : null}

      {message ? (
        <p
          role="status"
          className={message.tone === "error"
            ? "rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive"
            : "rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm font-bold text-primary"}
        >
          {message.text}
        </p>
      ) : null}

      {warnings.length ? (
        <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4" aria-label="هشدارهای اعتبارسنجی">
          <p className="text-sm font-black text-amber-600 dark:text-amber-400">هشدارهای اعتبارسنجی (ذخیره انجام شد)</p>
          <ul className="mt-2 grid gap-1 text-xs font-bold leading-6 text-amber-700 dark:text-amber-300">
            {warnings.map((warning) => (
              <li key={`${warning.code}-${warning.message}`}>{warning.code}: {warning.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <fieldset disabled={readOnly} className="contents">
      <EditorSection eyebrow="گام ۱" title="هویت غذا و برند">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="food-name">نام پایه (انگلیسی یا فارسی)</FieldLabel>
            <Input id="food-name" value={name} maxLength={500} onChange={(event) => setName(event.target.value)}/>
          </Field>
          <Field>
            <FieldLabel htmlFor="food-brand">برند (اختیاری)</FieldLabel>
            <Input id="food-brand" value={brandName} maxLength={255}
                   onChange={(event) => setBrandName(event.target.value)}/>
          </Field>
          <Field>
            <FieldLabel htmlFor="food-category">دسته‌بندی</FieldLabel>
            <select
              id="food-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={selectClassName}
            >
              <option value="">بدون دسته‌بندی</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="food-new-category">دسته‌بندی جدید</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="food-new-category"
                value={newCategoryName}
                maxLength={255}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="مثلاً لبنیات"
              />
              <Button type="button" variant="outline" className="h-10 shrink-0 rounded-full font-black"
                      disabled={isPending || !newCategoryName.trim()} onClick={handleCreateCategory}>
                افزودن
              </Button>
            </div>
          </Field>
        </div>
      </EditorSection>

      <EditorSection eyebrow="گام ۲" title="ترجمه‌ها و نام‌های مستعار">
        <div className="grid gap-3">
          {localizations.map((localization, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border bg-background/45 p-3 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
              <select
                aria-label="زبان ترجمه"
                value={localization.locale}
                onChange={(event) => setLocalizations(updateRow(localizations, index, {
                  ...localization,
                  locale: event.target.value === "fa" ? "fa" : "en",
                }))}
                className={selectClassName}
              >
                <option value="fa">فارسی</option>
                <option value="en">انگلیسی</option>
              </select>
              <Input
                aria-label="نام نمایشی"
                value={localization.displayName}
                maxLength={500}
                placeholder="نام نمایشی در این زبان"
                onChange={(event) => setLocalizations(updateRow(localizations, index, {
                  ...localization,
                  displayName: event.target.value,
                }))}
              />
              <RemoveRowButton
                label="حذف ترجمه"
                onClick={() => setLocalizations(localizations.filter((_, rowIndex) => rowIndex !== index))}
              />
            </div>
          ))}
          <AddRowButton
            label="افزودن ترجمه"
            disabled={localizations.length >= 2}
            onClick={() => setLocalizations([...localizations, {locale: "en", displayName: ""}])}
          />
        </div>

        <div className="mt-4 grid gap-3">
          <p className="text-sm font-black text-muted-foreground">نام‌های مستعار (برای جستجو)</p>
          {aliases.map((alias, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border bg-background/45 p-3 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
              <select
                aria-label="زبان نام مستعار"
                value={alias.locale}
                onChange={(event) => setAliases(updateRow(aliases, index, {
                  ...alias,
                  locale: event.target.value === "fa" ? "fa" : "en",
                }))}
                className={selectClassName}
              >
                <option value="fa">فارسی</option>
                <option value="en">انگلیسی</option>
              </select>
              <Input
                aria-label="نام مستعار"
                value={alias.alias}
                maxLength={500}
                placeholder="مثلاً ماست چکیده"
                onChange={(event) => setAliases(updateRow(aliases, index, {...alias, alias: event.target.value}))}
              />
              <RemoveRowButton
                label="حذف نام مستعار"
                onClick={() => setAliases(aliases.filter((_, rowIndex) => rowIndex !== index))}
              />
            </div>
          ))}
          <AddRowButton
            label="افزودن نام مستعار"
            onClick={() => setAliases([...aliases, {locale: "fa", alias: ""}])}
          />
        </div>
      </EditorSection>

      <EditorSection eyebrow="گام ۳" title="ارزش غذایی پایه">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="nutrition-base-quantity">مقدار پایه</FieldLabel>
            <Input id="nutrition-base-quantity" inputMode="decimal" value={nutrition.baseQuantity}
                   onChange={(event) => setNutrition({...nutrition, baseQuantity: event.target.value})}/>
          </Field>
          <Field>
            <FieldLabel htmlFor="nutrition-base-unit">واحد پایه</FieldLabel>
            <select
              id="nutrition-base-unit"
              value={nutrition.baseUnitCode}
              onChange={(event) => setNutrition({...nutrition, baseUnitCode: event.target.value})}
              className={selectClassName}
            >
              {servingUnits.map((unit) => (
                <option key={unit.id} value={unit.code}>{unit.code}</option>
              ))}
            </select>
          </Field>
          {(Object.keys(nutritionLabels) as Array<keyof typeof nutritionLabels>).map((key) => (
            <Field key={key}>
              <FieldLabel htmlFor={`nutrition-${key}`}>{nutritionLabels[key]}</FieldLabel>
              <Input id={`nutrition-${key}`} inputMode="decimal" value={nutrition[key]}
                     onChange={(event) => setNutrition({...nutrition, [key]: event.target.value})}/>
            </Field>
          ))}
        </div>
        <div
          className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs font-bold"
          aria-label="مقایسه کالری واردشده با کالری محاسبه‌شده از درشت‌مغذی‌ها"
        >
          <span className="text-muted-foreground">برآورد از درشت‌مغذی‌ها</span>
          <output aria-live="polite" className="tabular-nums text-primary">
            {macroCalories == null ? "—" : `${formatNutritionNumber(macroCalories)} کیلوکالری`}
          </output>
          {calorieDifference != null ? (
            <span
              className={calorieDifference === 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
              {calorieDifference === 0
                ? "هم‌خوان با مقدار واردشده"
                : `اختلاف با مقدار واردشده: ${formatSignedNutritionNumber(calorieDifference)} کیلوکالری`}
            </span>
          ) : null}
          <span className="text-muted-foreground">(۴×پروتئین + ۴×کربوهیدرات + ۹×چربی)</span>
        </div>
      </EditorSection>

      <EditorSection eyebrow="گام ۴" title="گزینه‌های سروینگ (چندتایی)">
        <div className="grid gap-3">
          {portions.map((portion, index) => (
            <div key={index}
                 className="grid gap-2 rounded-2xl border bg-background/45 p-3 md:grid-cols-[140px_110px_130px_minmax(0,1fr)_auto]">
              <select
                aria-label="واحد سروینگ"
                value={portion.servingUnitCode}
                onChange={(event) => setPortions(updateRow(portions, index, {
                  ...portion,
                  servingUnitCode: event.target.value,
                }))}
                className={selectClassName}
              >
                <option value="">بدون واحد</option>
                {servingUnits.map((unit) => (
                  <option key={unit.id} value={unit.code}>{unit.code}</option>
                ))}
              </select>
              <Input
                aria-label="مقدار"
                inputMode="decimal"
                value={portion.amount}
                placeholder="مقدار"
                onChange={(event) => setPortions(updateRow(portions, index, {...portion, amount: event.target.value}))}
              />
              <Input
                aria-label="وزن گرمی"
                inputMode="decimal"
                value={portion.gramWeight}
                placeholder="وزن گرمی"
                onChange={(event) => setPortions(updateRow(portions, index, {
                  ...portion,
                  gramWeight: event.target.value,
                }))}
              />
              <Input
                aria-label="توضیح سروینگ"
                value={portion.portionDescription}
                maxLength={500}
                placeholder="مثلاً یک کاسه متوسط"
                onChange={(event) => setPortions(updateRow(portions, index, {
                  ...portion,
                  portionDescription: event.target.value,
                }))}
              />
              <RemoveRowButton
                label="حذف سروینگ"
                onClick={() => setPortions(portions.filter((_, rowIndex) => rowIndex !== index))}
              />
            </div>
          ))}
          <AddRowButton
            label="افزودن گزینه سروینگ"
            onClick={() => setPortions([...portions, {servingUnitCode: "", amount: "1", gramWeight: "", portionDescription: ""}])}
          />
        </div>
      </EditorSection>

      <EditorSection eyebrow="گام ۵" title="نمایش و بازبینی">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="food-curation">وضعیت بازبینی</FieldLabel>
            <select
              id="food-curation"
              value={curationStatus}
              onChange={(event) => setCurationStatus(event.target.value)}
              className={selectClassName}
            >
              <option value="REVIEWED">بازبینی‌شده</option>
              <option value="UNREVIEWED">بازبینی‌نشده</option>
              <option value="HIDDEN">مخفی</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="food-searchable">قابلیت جستجو</FieldLabel>
            <label
              className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm font-bold"
              htmlFor="food-searchable"
            >
              <input
                id="food-searchable"
                type="checkbox"
                checked={isSearchable}
                onChange={(event) => setIsSearchable(event.target.checked)}
                className="size-4 accent-primary"
              />
              در جستجوی کاربران نمایش داده شود
            </label>
          </Field>
        </div>
      </EditorSection>
      </fieldset>

      {validationErrors.length && !readOnly ? (
        <section className="rounded-2xl border border-dashed p-4" aria-label="بررسی پیش از ذخیره">
          <p className="text-sm font-black text-muted-foreground">پیش از ذخیره برطرف کنید:</p>
          <ul className="mt-2 grid gap-1 text-xs font-bold leading-6 text-destructive">
            {validationErrors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {mode === "edit" && food && !readOnly ? (
          <Link
            href={`/admin/catalog/new?copyFrom=${encodeURIComponent(food.id)}`}
            className={buttonVariants({variant: "outline", className: "h-11 rounded-full font-black"})}
          >
            <CopyIcon className="size-4"/>
            ساخت کپی
          </Link>
        ) : null}
        {mode === "edit" && !readOnly ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full font-black"
            disabled={isPending}
            onClick={handleArchiveToggle}
          >
            {archived ? <ArchiveRestoreIcon className="size-4"/> : <ArchiveIcon className="size-4"/>}
            {archived ? "بازیابی از آرشیو" : "آرشیو غذا"}
          </Button>
        ) : null}
        {!readOnly ? (
          <Button
            type="button"
            className="h-11 rounded-full font-black"
            disabled={isPending || validationErrors.length > 0}
            onClick={handleSave}
          >
            {isPending ? "در حال ذخیره..." : mode === "create" ? "ساخت غذا" : "ذخیره تغییرات"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function EditorSection({eyebrow, title, children}: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-black text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AddRowButton({label, onClick, disabled = false}: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button type="button" variant="outline" className="h-10 w-fit rounded-full font-black" disabled={disabled}
            onClick={onClick}>
      <PlusIcon className="size-4"/>
      {label}
    </Button>
  );
}

function RemoveRowButton({label, onClick}: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" className="h-10 rounded-full text-destructive" aria-label={label}
            onClick={onClick}>
      <Trash2Icon className="size-4"/>
    </Button>
  );
}

function updateRow<T>(rows: T[], index: number, value: T): T[] {
  return rows.map((row, rowIndex) => (rowIndex === index ? value : row));
}

function numberToInput(value: number | undefined | null, fallback: string): string {
  return value != null && Number.isFinite(value) ? String(value) : fallback;
}

function isPositiveNumber(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function isNonNegativeNumber(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

function nonNegativeInputNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function macroCaloriesFrom(nutrition: Pick<NutritionState, "protein" | "carbs" | "fat">): number | null {
  const protein = nonNegativeInputNumber(nutrition.protein);
  const carbs = nonNegativeInputNumber(nutrition.carbs);
  const fat = nonNegativeInputNumber(nutrition.fat);
  if (protein == null || carbs == null || fat == null) return null;
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

function formatNutritionNumber(value: number): string {
  return value.toLocaleString("fa-IR");
}

function formatSignedNutritionNumber(value: number): string {
  const sign = value > 0 ? "+" : "−";
  return `${sign}${formatNutritionNumber(Math.abs(value))}`;
}

const nutritionLabels = {
  calories: "کالری",
  protein: "پروتئین (گرم)",
  carbs: "کربوهیدرات (گرم)",
  fat: "چربی (گرم)",
  fiber: "فیبر (گرم)",
  sugar: "قند (گرم)",
  sodium: "سدیم (میلی‌گرم)",
} as const;

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm font-bold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
