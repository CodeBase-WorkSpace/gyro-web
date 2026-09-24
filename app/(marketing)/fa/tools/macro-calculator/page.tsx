import type {Metadata} from "next";

import {ToolCalculator} from "@/components/public/tool-calculator";
import {ToolPage, ToolSection} from "@/components/public/tool-page";
import {breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/tools/macro-calculator";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "ماشین حساب ماکرو | پروتئین، کربوهیدرات و چربی روزانه", description: "هدف تقریبی پروتئین، کربوهیدرات و چربی روزانه را بر پایه وزن و هدف کالری خود در ماشین حساب ماکرو فارسی جیرو ببینید.", imageAlt: "ماشین حساب ماکرو جیرو"});
const jsonLd = jsonLdGraph([breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "ابزارها", path: "/fa/tools"}, {name: "ماشین حساب ماکرو", path: canonicalPath}])]);

export default function MacroCalculatorPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><ToolPage eyebrow="ماشین حساب ماکرو" title="کالری را به سه عدد قابل‌پیگیری تبدیل کنید." description="یک تقسیم‌بندی اولیه برای پروتئین، کربوهیدرات و چربی ببینید؛ سپس با غذاهای واقعی و سبک زندگی خودتان آن را عملی کنید." calculator={<ToolCalculator kind="macro" />}>
  <ToolSection title="ماکروها چه هستند؟"><p>پروتئین، کربوهیدرات و چربی درشت‌مغذی‌هایی هستند که بخش اصلی انرژی و مواد موردنیاز روزانه را تأمین می‌کنند. این ابزار پروتئین را با نقطه شروع ۱٫۶ گرم به ازای هر کیلوگرم وزن، چربی را با ۰٫۸ گرم به ازای هر کیلوگرم و باقی انرژی را از کربوهیدرات برآورد می‌کند.</p></ToolSection>
  <ToolSection title="چطور از خروجی استفاده کنم؟"><p>به‌جای تلاش برای رسیدن به هر عدد در هر روز، روند چند هفته را ببینید. برای شروع، پروتئین را میان وعده‌ها پخش کنید و از دفتر تغذیه برای مشاهده الگوی واقعی غذایتان استفاده کنید.</p></ToolSection>
  <ToolSection title="محدودیت‌ها و راهنمای بیشتر"><p>این یک نسخه عمومی نیست. تمرین، ترجیح غذایی، بیماری، بارداری و اهداف ورزشی می‌توانند نیازها را تغییر دهند. درباره مفهوم ماکروها بیشتر در <a className="text-primary underline" href="/fa/app/macro-tracker">ردیاب ماکروی جیرو</a> بخوانید.</p></ToolSection>
</ToolPage></>; }
