import type {Metadata} from "next";
import Link from "next/link";

import {GuidePage, GuideSection} from "@/components/public/guide-page";
import {articleJsonLd, breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/guides/track-persian-foods";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "چطور غذای ایرانی را ثبت کنیم؟ | راهنمای غذاهای خانگی", description: "روش عملی ثبت غذاهای خانگی، خورش‌ها، برنج، نان و وعده‌های بیرون در دفتر تغذیه فارسی جیرو.", imageAlt: "راهنمای ثبت غذای ایرانی جیرو"});
const jsonLd = jsonLdGraph([articleJsonLd({headline: "چطور غذای ایرانی را ثبت کنیم؟", description: "راهنمای عملی ثبت غذاهای ایرانی و خانگی.", path: canonicalPath, dateModified: "2026-07-12"}), breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "راهنماها", path: "/fa/guides"}, {name: "ثبت غذای ایرانی", path: canonicalPath}])]);
export default function PersianFoodsGuidePage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><GuidePage eyebrow="غذاهای خانگی و ایرانی" title="غذای ایرانی را با یک تخمین ثابت و قابل‌تکرار ثبت کنید." description="برای خورش، پلو و غذای خانگی لازم نیست همه مواد را هر روز از صفر حساب کنید؛ روش ثبت را ساده و یکسان نگه دارید." relatedTools={[{href: "/fa/foods", label: "جدول کالری غذاهای ایرانی"}, {href: "/fa/app/calorie-counter", label: "ثبت غذا در جیرو"}, {href: "/fa/tools/calorie-calculator", label: "محاسبه کالری"}]}>
  <GuideSection title="از اجزای اصلی شروع کنید"><p>برای یک وعده مانند <Link className="text-primary underline" href="/fa/foods/ghormeh-sabzi">قورمه‌سبزی</Link> با <Link className="text-primary underline" href="/fa/foods/berenj-pokhteh">برنج پخته</Link>، برنج و خورش را جداگانه در نظر بگیرید. اگر نان، نوشیدنی یا مخلفات هم دارید، آن‌ها را به‌عنوان بخش‌های مستقل ثبت کنید.</p></GuideSection>
  <GuideSection title="برای غذاهای ترکیبی، یک الگو بسازید"><p>اگر غذایی را در خانه تکرار می‌کنید، مواد اصلی و تعداد سهم‌ها را یک‌بار یادداشت کنید. هر بار لازم نیست به دقت آزمایشگاهی برسید؛ یک تخمین یکنواخت به مقایسه روزها کمک می‌کند.</p></GuideSection>
  <GuideSection title="اندازه سهم را به زبان خودتان نگه دارید"><p>یک پیاله، یک کفگیر برنج، نصف نان یا یک سیخ، برای شروع واحدهای قابل‌فهمی هستند. اگر امکانش را دارید، گاهی وزن‌کردن یک سهم مرجع می‌تواند تخمین‌های بعدی را بهتر کند.</p></GuideSection>
  <GuideSection title="بیرون از خانه"><p>در رستوران، نزدیک‌ترین غذای مشابه را ثبت کنید و مقدار را محتاطانه انتخاب کنید. هدف، ساختن داده کامل نیست؛ دیدن الگوی وعده‌ها و ادامه‌دادن عادت ثبت است.</p></GuideSection>
</GuidePage></>; }
