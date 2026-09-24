import type {Metadata} from "next";

import {GuidePage, GuideSection} from "@/components/public/guide-page";
import {articleJsonLd, breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/guides/calorie-deficit";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "کسری کالری چیست؟ | راهنمای کاهش وزن محتاطانه", description: "کسری کالری را ساده و بدون وعده‌های غیرواقعی بشناسید؛ چگونه یک نقطه شروع بسازید و چه زمانی هدف را بازبینی کنید.", imageAlt: "راهنمای کسری کالری جیرو"});
const jsonLd = jsonLdGraph([articleJsonLd({headline: "کسری کالری چیست؟", description: "راهنمای عملی و محتاطانه برای درک کسری کالری.", path: canonicalPath, dateModified: "2026-07-12"}), breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "راهنماها", path: "/fa/guides"}, {name: "کسری کالری", path: canonicalPath}])]);
export default function CalorieDeficitGuidePage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><GuidePage eyebrow="کالری و تغییر وزن" title="کسری کالری یعنی انرژی دریافتی، از مصرف روزانه کمتر باشد." description="این مفهوم فقط یک نقطه شروع برای برنامه‌ریزی است؛ کاهش وزن پایدار به غذای کافی، حرکت، خواب و شرایط فردی هم وابسته است." relatedTools={[{href: "/fa/tools/calorie-calculator", label: "محاسبه کالری"}, {href: "/fa/tools/tdee-calculator", label: "محاسبه TDEE"}, {href: "/fa/foods", label: "جدول کالری غذاهای ایرانی"}]}>
  <GuideSection title="کسری کالری به زبان ساده"><p>بدن برای کارهای پایه، حرکت و هضم غذا انرژی مصرف می‌کند. وقتی در یک بازه زمانی، انرژی غذا و نوشیدنی کمتر از مصرف بدن باشد، کسری انرژی شکل می‌گیرد. این به‌تنهایی برنامه غذایی یا تضمین نتیجه نیست.</p></GuideSection>
  <GuideSection title="چطور محتاطانه شروع کنم؟"><p>اول کالری نگهدارنده را تخمین بزنید. سپس یک تغییر تدریجی انتخاب کنید و چند هفته روند وزن، گرسنگی، انرژی و کیفیت غذا را ببینید. تغییرهای شدید معمولاً برای برنامه عمومی مناسب نیستند و در شرایط پزشکی باید با متخصص بررسی شوند.</p></GuideSection>
  <GuideSection title="به چه چیزهایی توجه کنم؟"><p>غذاهای متنوع، پروتئین کافی، سبزیجات، میوه، حبوبات و خواب، فقط عدد کالری نیستند. اگر کاهش وزن ناخواسته، خستگی شدید یا نگرانی درباره رابطه با غذا دارید، هدف را متوقف و از متخصص کمک بگیرید.</p></GuideSection>
  <GuideSection title="منابع"><p><a className="text-primary underline" href="https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity/eating-physical-activity">NIDDK: Eating & Physical Activity</a> و <a className="text-primary underline" href="https://www.ncbi.nlm.nih.gov/books/NBK591020/">National Academies: Dietary Reference Intakes for Energy</a>.</p></GuideSection>
</GuidePage></>; }
