"use client";

import {useMemo, useRef, useState} from "react";

import {Button} from "@/components/ui/button";
import {trackEvent, withUtmParams} from "@/lib/analytics";

type ToolKind = "calorie" | "macro" | "bmr" | "tdee";

const activityLevels = [
  {value: 1.2, label: "کم‌تحرک یا بیشتر نشسته"},
  {value: 1.375, label: "فعالیت سبک (۱ تا ۳ روز در هفته)"},
  {value: 1.55, label: "فعالیت متوسط (۳ تا ۵ روز در هفته)"},
  {value: 1.725, label: "فعالیت زیاد (۶ تا ۷ روز در هفته)"},
];

function persianNumber(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString("fa-IR");
}

function calculateBmr(age: number, weight: number, height: number, sex: string) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return base + (sex === "male" ? 5 : -161);
}

export function ToolCalculator({kind}: {kind: ToolKind}) {
  const [age, setAge] = useState("30");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("170");
  const [sex, setSex] = useState("female");
  const [activity, setActivity] = useState("1.375");
  const [goal, setGoal] = useState("maintain");

  // Defaults yield a valid result on mount, so "started" only counts real
  // user interaction, not renders.
  const started = useRef(false);
  const touched = (set: (value: string) => void) => (value: string) => {
    if (!started.current) {
      started.current = true;
      trackEvent("seo_tool_started", {tool: kind});
    }
    set(value);
  };

  const result = useMemo(() => {
    const numericAge = Number(age);
    const numericWeight = Number(weight);
    const numericHeight = Number(height);
    const valid = numericAge >= 18 && numericAge <= 100 && numericWeight >= 30 && numericWeight <= 300 && numericHeight >= 120 && numericHeight <= 230;
    if (!valid) return null;

    const bmr = calculateBmr(numericAge, numericWeight, numericHeight, sex);
    const tdee = bmr * Number(activity);
    const target = tdee + (goal === "lose" ? -400 : goal === "gain" ? 300 : 0);
    const calories = kind === "bmr" ? bmr : kind === "tdee" ? tdee : target;
    const protein = numericWeight * 1.6;
    const fat = numericWeight * 0.8;
    const carbs = Math.max(0, (target - protein * 4 - fat * 9) / 4);
    return {bmr, tdee, target, calories, protein, fat, carbs};
  }, [activity, age, goal, height, kind, sex, weight]);

  const title = {
    calorie: "هدف تقریبی روزانه",
    macro: "هدف‌های تقریبی ماکرو",
    bmr: "سوخت‌وساز پایه تقریبی",
    tdee: "کالری نگهدارنده تقریبی",
  }[kind];

  return (
    <section className="rounded-[2rem] border border-primary/25 bg-card p-5 shadow-[0_20px_65px_color-mix(in_oklch,var(--primary)_10%,transparent)] sm:p-7" aria-labelledby={`${kind}-calculator-title`}>
      <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <p className="text-sm font-black text-primary">محاسبه در همین صفحه</p>
          <h2 id={`${kind}-calculator-title`} className="mt-1 text-2xl font-black">{title}</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">برآورد</span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="سن" value={age} onChange={touched(setAge)} suffix="سال" />
        <Field label="وزن" value={weight} onChange={touched(setWeight)} suffix="کیلوگرم" />
        <Field label="قد" value={height} onChange={touched(setHeight)} suffix="سانتی‌متر" />
        <label className="grid gap-2 text-sm font-black">
          جنسیت برای فرمول
          <select value={sex} onChange={(event) => touched(setSex)(event.target.value)} className="h-12 rounded-2xl border border-border bg-background px-3 font-semibold outline-none focus:border-primary">
            <option value="female">زن</option>
            <option value="male">مرد</option>
          </select>
        </label>
        {kind !== "bmr" ? <label className="grid gap-2 text-sm font-black sm:col-span-2">
          سطح فعالیت
          <select value={activity} onChange={(event) => touched(setActivity)(event.target.value)} className="h-12 rounded-2xl border border-border bg-background px-3 font-semibold outline-none focus:border-primary">
            {activityLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
          </select>
        </label> : null}
        {(kind === "calorie" || kind === "macro" || kind === "tdee") ? <label className="grid gap-2 text-sm font-black sm:col-span-2">
          هدف فعلی
          <select value={goal} onChange={(event) => touched(setGoal)(event.target.value)} className="h-12 rounded-2xl border border-border bg-background px-3 font-semibold outline-none focus:border-primary">
            <option value="maintain">حفظ وزن</option>
            <option value="lose">کاهش وزن تدریجی</option>
            <option value="gain">افزایش وزن تدریجی</option>
          </select>
        </label> : null}
      </div>

      {result ? <div className="mt-6 rounded-3xl bg-primary/10 p-5">
        {kind === "macro" ? <div className="grid gap-3 sm:grid-cols-3">
          <Result label="پروتئین" value={`${persianNumber(result.protein)} گرم`} />
          <Result label="کربوهیدرات" value={`${persianNumber(result.carbs)} گرم`} />
          <Result label="چربی" value={`${persianNumber(result.fat)} گرم`} />
          <p className="sm:col-span-3 pt-2 text-sm font-bold text-muted-foreground">بر پایه هدف تقریبی {persianNumber(result.target)} کیلوکالری در روز</p>
        </div> : <>
          <p className="text-sm font-black text-primary">خروجی شما</p>
          <p className="mt-1 text-4xl font-black tabular-nums sm:text-5xl">{persianNumber(result.calories)} <span className="text-lg text-muted-foreground">کیلوکالری</span></p>
          <p className="mt-3 text-sm font-bold leading-7 text-muted-foreground">این عدد نقطه شروع برنامه‌ریزی است؛ روند واقعی وزن، گرسنگی، سلامت و توصیه متخصص را در نظر بگیرید.</p>
        </>}
      </div> : <p className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold">لطفاً سن، قد و وزن معتبر وارد کنید. این ابزار برای افراد ۱۸ سال به بالا طراحی شده است.</p>}

      <Button
        type="button"
        className="mt-6 h-12 w-full rounded-full"
        onClick={() => {
          trackEvent("seo_tool_save_goal_clicked", {tool: kind});
          window.location.assign(withUtmParams("/auth/signup"));
        }}
      >نتیجه را در جیرو ذخیره کن</Button>
    </section>
  );
}

function Field({label, value, onChange, suffix}: {label: string; value: string; onChange: (value: string) => void; suffix: string}) {
  return <label className="grid gap-2 text-sm font-black">{label}<span className="relative"><input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" className="h-12 w-full rounded-2xl border border-border bg-background px-3 pl-16 font-semibold tabular-nums outline-none focus:border-primary" /><span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-xs font-bold text-muted-foreground">{suffix}</span></span></label>;
}

function Result({label, value}: {label: string; value: string}) {
  return <div className="rounded-2xl border border-border/70 bg-background/50 p-4"><p className="text-xs font-black text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black tabular-nums">{value}</p></div>;
}
