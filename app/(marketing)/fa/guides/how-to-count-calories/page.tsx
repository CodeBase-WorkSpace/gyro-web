import type {Metadata} from "next";

import {GuidePage, GuideSection} from "@/components/public/guide-page";
import {articleJsonLd, breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/guides/how-to-count-calories";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "چطور کالری بشماریم؟ | راهنمای ثبت غذای روزانه", description: "یک روش عملی و بدون وسواس برای ثبت غذا، انتخاب مقدار و بررسی کالری روزانه با جیرو.", imageAlt: "راهنمای شمارش کالری جیرو"});
const jsonLd = jsonLdGraph([articleJsonLd({headline: "چطور کالری بشماریم؟", description: "راهنمای عملی شروع ثبت غذای روزانه.", path: canonicalPath, dateModified: "2026-07-12"}), breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "راهنماها", path: "/fa/guides"}, {name: "چطور کالری بشماریم؟", path: canonicalPath}])]);
export default function CountCaloriesGuidePage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><GuidePage eyebrow="ثبت غذای روزانه" title="شمارش کالری را با ثبت چند وعده معمولی شروع کنید." description="هدف اولیه، ساختن تصویر واضح‌تری از غذاهای روزمره‌تان است؛ نه دقیق‌بودن وسواس‌گونه در همان روز اول." relatedTools={[{href: "/fa/tools/calorie-calculator", label: "محاسبه کالری"}, {href: "/fa/foods", label: "جدول کالری غذاهای ایرانی"}, {href: "/auth/signup", label: "شروع رایگان ثبت غذا"}]}>
  <GuideSection title="۱. یک هدف تقریبی داشته باشید"><p>با ماشین حساب کالری، یک نقطه شروع برای کالری روزانه بسازید. عدد را فرضیه بدانید و بعداً بر اساس روند واقعی خودتان بازبینی کنید.</p></GuideSection>
  <GuideSection title="۲. غذا را همان زمان ثبت کنید"><p>ثبت وعده نزدیک به زمان خوردن، یادآوری مقدار و مواد اولیه را ساده‌تر می‌کند. از صبحانه یا یک وعده ثابت شروع کنید؛ لازم نیست همه چیز از روز اول کامل باشد.</p></GuideSection>
  <GuideSection title="۳. مقدار را واقع‌بینانه انتخاب کنید"><p>اگر ترازو ندارید، از واحدهای آشنا مانند یک کف دست، یک لیوان یا یک پیاله استفاده کنید و تخمین خود را ثابت نگه دارید. ثبات، از دقت ظاهری مهم‌تر است.</p></GuideSection>
  <GuideSection title="۴. روند را نگاه کنید"><p>در پایان چند روز، به الگوی کالری و ماکروها نگاه کنید. یک وعده پرکالری شکست نیست؛ داده‌ای است برای تصمیم بعدی. اگر شمارش غذا باعث اضطراب یا محدودیت شدید می‌شود، توقف و گفتگو با متخصص انتخاب امن‌تری است.</p></GuideSection>
</GuidePage></>; }
