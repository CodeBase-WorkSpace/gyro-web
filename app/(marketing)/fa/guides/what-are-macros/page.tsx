import type {Metadata} from "next";

import {GuidePage, GuideSection} from "@/components/public/guide-page";
import {articleJsonLd, breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/guides/what-are-macros";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "ماکرو چیست؟ پروتئین، کربوهیدرات و چربی به زبان ساده", description: "راهنمای ساده ماکروها: نقش پروتئین، کربوهیدرات و چربی و نمونه‌های آشنا از غذاهای روزمره ایرانی.", imageAlt: "راهنمای ماکروها جیرو"});
const jsonLd = jsonLdGraph([articleJsonLd({headline: "ماکرو چیست؟", description: "راهنمای پروتئین، کربوهیدرات و چربی.", path: canonicalPath, dateModified: "2026-07-12"}), breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "راهنماها", path: "/fa/guides"}, {name: "ماکرو چیست؟", path: canonicalPath}])]);
export default function MacrosGuidePage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><GuidePage eyebrow="پروتئین، کربوهیدرات و چربی" title="ماکروها سه بخش اصلی انرژی غذای روزانه‌اند." description="ماکروها را برای دیدن الگوی غذا بشناسید، نه برای کامل‌کردن یک عدد بی‌نقص در هر وعده." relatedTools={[{href: "/fa/tools/macro-calculator", label: "محاسبه ماکرو"}, {href: "/fa/app/macro-tracker", label: "ردیاب ماکرو"}]}>
  <GuideSection title="پروتئین"><p>پروتئین در غذاهایی مانند مرغ، تخم‌مرغ، ماست، عدس و لوبیا وجود دارد. پخش‌کردن آن میان وعده‌ها می‌تواند راهی عملی برای دیدن مقدار دریافتی در طول روز باشد.</p></GuideSection>
  <GuideSection title="کربوهیدرات"><p>کربوهیدرات از منابعی مانند برنج، نان سنگک، سیب‌زمینی، میوه و حبوبات می‌آید. مقدار مناسب به فعالیت، ترجیح غذایی و نیازهای فردی بستگی دارد؛ هیچ ماده غذایی به‌تنهایی خوب یا بد نیست.</p></GuideSection>
  <GuideSection title="چربی"><p>چربی در مغزها، دانه‌ها، روغن‌ها، لبنیات و بسیاری از غذاهای ترکیبی وجود دارد. ثبت مقدار مصرفی کمک می‌کند سهم آن را در کالری روزانه بهتر ببینید.</p></GuideSection>
  <GuideSection title="چطور شروع کنم؟"><p>یک یا دو وعده معمولی را ثبت کنید و فقط الگو را ببینید. سپس از ماشین حساب ماکرو به‌عنوان نقطه شروع استفاده کنید، نه نسخه ثابت. اگر بیماری یا هدف ورزشی خاص دارید، برنامه شخصی را با متخصص تنظیم کنید.</p></GuideSection>
</GuidePage></>; }
