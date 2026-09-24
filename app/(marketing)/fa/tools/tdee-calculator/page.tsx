import type {Metadata} from "next";

import {ToolCalculator} from "@/components/public/tool-calculator";
import {ToolPage, ToolSection} from "@/components/public/tool-page";
import {breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/tools/tdee-calculator";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "ماشین حساب TDEE | محاسبه کالری نگهدارنده", description: "کالری نگهدارنده یا TDEE خود را با در نظر گرفتن BMR و سطح فعالیت تخمین بزنید و برای کاهش یا افزایش تدریجی وزن برنامه‌ریزی کنید.", imageAlt: "ماشین حساب TDEE جیرو"});
const jsonLd = jsonLdGraph([breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "ابزارها", path: "/fa/tools"}, {name: "ماشین حساب TDEE", path: canonicalPath}])]);

export default function TdeeCalculatorPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><ToolPage eyebrow="ماشین حساب TDEE" title="کالری نگهدارنده‌تان را با فعالیت روزانه ببینید." description="TDEE انرژی تقریبی مصرفی شما در یک روز معمولی است؛ از آن می‌توان برای ساختن هدف حفظ، کاهش یا افزایش تدریجی وزن استفاده کرد." calculator={<ToolCalculator kind="tdee" />}>
  <ToolSection title="TDEE چگونه ساخته می‌شود؟"><p>TDEE از BMR و ضریب سطح فعالیت به دست می‌آید. به همین دلیل دو نفر با قد و وزن مشابه اما الگوی حرکت متفاوت می‌توانند به عددهای متفاوتی برسند.</p></ToolSection>
  <ToolSection title="کسری و مازاد با احتیاط"><p>برای کاهش یا افزایش وزن، ابزار یک تغییر کوچک نسبت به نگهدارنده نشان می‌دهد. سرعت تغییر وزن را با ثبت چند هفته‌ای بررسی کنید و از تغییرهای شدید و ناگهانی پرهیز کنید.</p></ToolSection>
  <ToolSection title="از تخمین به داده واقعی"><p>سطح فعالیت انتخاب‌شده تنها یک تخمین است. کالری و وزن خود را در جیرو ثبت کنید تا بر اساس روند واقعی، هدف را بازبینی کنید. برای جزئیات بیشتر، <a className="text-primary underline" href="/fa/guides/calorie-deficit">راهنمای کسری کالری</a> و <a className="text-primary underline" href="/fa/tools/calorie-calculator">ماشین حساب کالری</a> را ببینید.</p></ToolSection>
</ToolPage></>; }
