import type {Metadata} from "next";

import {ToolCalculator} from "@/components/public/tool-calculator";
import {ToolPage, ToolSection} from "@/components/public/tool-page";
import {breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/tools/bmr-calculator";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "ماشین حساب BMR | محاسبه سوخت‌وساز پایه بدن", description: "BMR یا سوخت‌وساز پایه بدن خود را با فرمول میفلین-سن ژور تخمین بزنید و تفاوت آن با کالری روزانه را درک کنید.", imageAlt: "ماشین حساب BMR جیرو"});
const jsonLd = jsonLdGraph([breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "ابزارها", path: "/fa/tools"}, {name: "ماشین حساب BMR", path: canonicalPath}])]);

export default function BmrCalculatorPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><ToolPage eyebrow="ماشین حساب BMR" title="بدن در حالت استراحت تقریباً چقدر انرژی مصرف می‌کند؟" description="BMR یک تخمین از انرژی لازم برای عملکردهای پایه بدن در حالت استراحت است؛ نه هدف نهایی کالری روزانه." calculator={<ToolCalculator kind="bmr" />}>
  <ToolSection title="BMR چیست؟"><p>سوخت‌وساز پایه یا BMR به انرژی لازم برای عملکردهای حیاتی بدن مانند تنفس و گردش خون در شرایط استراحت اشاره دارد. فعالیت روزانه، راه رفتن، تمرین و هضم غذا در این عدد نیستند.</p></ToolSection>
  <ToolSection title="فرمول و احتیاط"><p>این ابزار از فرمول Mifflin–St Jeor استفاده می‌کند. فرمول‌ها میانگین جمعیت را توصیف می‌کنند و نمی‌توانند ترکیب بدنی یا شرایط پزشکی هر فرد را دقیقاً بازتاب دهند. BMR را به‌عنوان حداقل کالری پیشنهادی تلقی نکنید.</p></ToolSection>
  <ToolSection title="قدم بعدی"><p>برای دیدن اثر فعالیت روزانه، از <a className="text-primary underline" href="/fa/tools/tdee-calculator">ماشین حساب TDEE</a> استفاده کنید. تفاوت این دو عدد را در <a className="text-primary underline" href="/fa/guides/what-is-bmr">راهنمای BMR و TDEE</a> بخوانید.</p></ToolSection>
</ToolPage></>; }
