import type {Metadata} from "next";

import {GuidePage, GuideSection} from "@/components/public/guide-page";
import {articleJsonLd, breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/guides/what-is-bmr";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "BMR چیست؟ تفاوت BMR و TDEE در محاسبه کالری", description: "BMR و TDEE را ساده بشناسید، تفاوتشان را ببینید و بدانید چرا هر دو فقط برآورد هستند.", imageAlt: "راهنمای BMR و TDEE جیرو"});
const jsonLd = jsonLdGraph([articleJsonLd({headline: "BMR چیست و چه فرقی با TDEE دارد؟", description: "راهنمای تفاوت BMR و TDEE در برآورد انرژی روزانه.", path: canonicalPath, dateModified: "2026-07-12"}), breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "راهنماها", path: "/fa/guides"}, {name: "BMR چیست؟", path: canonicalPath}])]);
export default function BmrGuidePage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><GuidePage eyebrow="کالری پایه" title="BMR انرژی پایه بدن در حالت استراحت است؛ TDEE انرژی یک روز واقعی‌تر." description="هر دو عدد برای شروع برنامه‌ریزی مفیدند، اما هیچ‌کدام جای مشاهده روند واقعی شما را نمی‌گیرند." relatedTools={[{href: "/fa/tools/bmr-calculator", label: "محاسبه BMR"}, {href: "/fa/tools/tdee-calculator", label: "محاسبه TDEE"}]}>
  <GuideSection title="BMR چیست؟"><p>سوخت‌وساز پایه یا BMR، انرژی تقریبی لازم برای عملکردهای حیاتی مانند تنفس و گردش خون در حالت استراحت است. BMR شامل تمرین، راه رفتن، کار روزانه و هضم غذا نمی‌شود.</p></GuideSection>
  <GuideSection title="TDEE چیست؟"><p>TDEE یا مصرف کل انرژی روزانه، BMR را با فعالیت و بخش‌های دیگر مصرف انرژی ترکیب می‌کند. به همین دلیل معمولاً برای تخمین کالری نگهدارنده، TDEE کاربردی‌تر از BMR تنهاست.</p></GuideSection>
  <GuideSection title="چرا عددها فرق می‌کنند؟"><p>فرمول‌ها از سن، قد، وزن و جنسیت استفاده می‌کنند، اما ترکیب بدن، فعالیت واقعی، خواب، بیماری و تغییرات روزانه را کامل نمی‌بینند. خروجی را یک تخمین بدانید و با ثبت غذا و روند وزن تنظیمش کنید.</p></GuideSection>
  <GuideSection title="منبع فرمول"><p><a className="text-primary underline" href="https://pubmed.ncbi.nlm.nih.gov/2305711/">Mifflin et al., 1990</a> فرمول پرکاربردی برای برآورد انرژی در بزرگسالان ارائه کرده است.</p></GuideSection>
</GuidePage></>; }
