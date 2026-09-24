import type {Metadata} from "next";

import {ToolCalculator} from "@/components/public/tool-calculator";
import {ToolPage, ToolSection} from "@/components/public/tool-page";
import {breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/tools/calorie-calculator";
const faqs = [{question: "هدف کالری چطور محاسبه می‌شود؟", answer: "ابتدا BMR با فرمول میفلین-سن ژور برآورد می‌شود، سپس ضریب فعالیت اعمال و متناسب با هدف، تعدیل کوچکی انجام می‌شود."}, {question: "آیا باید دقیقاً همان عدد را بخورم؟", answer: "خیر. این عدد نقطه شروع است. روند وزن، سطح انرژی، گرسنگی و نظر متخصص می‌تواند نیاز به تنظیم ایجاد کند."}];
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "ماشین حساب کالری روزانه | محاسبه کالری برای کاهش یا حفظ وزن", description: "هدف کالری روزانه خود را با سن، قد، وزن، فعالیت و هدف فعلی تخمین بزنید و منطق و محدودیت‌های محاسبه را بخوانید.", imageAlt: "ماشین حساب کالری روزانه جیرو"});
const jsonLd = jsonLdGraph([breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "ابزارها", path: "/fa/tools"}, {name: "ماشین حساب کالری", path: canonicalPath}]), faqPageJsonLd(faqs)]);

export default function CalorieCalculatorPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><ToolPage eyebrow="ماشین حساب کالری" title="برای هدف روزانه‌تان یک نقطه شروع قابل‌فهم بسازید." description="سن، قد، وزن و فعالیتتان را وارد کنید تا یک هدف تقریبی برای حفظ، کاهش یا افزایش تدریجی وزن ببینید." calculator={<ToolCalculator kind="calorie" />}>
  <ToolSection title="این عدد چه می‌گوید؟"><p>هدف کالری روزانه، برآوردی از انرژی موردنیاز شما در یک روز معمولی است. برای کاهش یا افزایش وزن، این ابزار نسبت به کالری نگهدارنده تعدیل محافظه‌کارانه‌ای پیشنهاد می‌دهد؛ وعده‌های خیلی کم‌کالری راه‌حل عمومی نیستند.</p></ToolSection>
  <ToolSection title="روش و فرض‌ها"><p>محاسبه از فرمول Mifflin–St Jeor برای برآورد BMR آغاز می‌شود و سپس با ضریب فعالیت ترکیب می‌شود. این فرمول برای بزرگسالان طراحی شده و ترکیب بدن، بیماری، دارو، خواب و تغییرات روزانه را به‌طور کامل پوشش نمی‌دهد.</p></ToolSection>
  <ToolSection title="منابع"><p><a className="text-primary underline" href="https://pubmed.ncbi.nlm.nih.gov/2305711/">Mifflin et al., 1990</a>؛ <a className="text-primary underline" href="https://www.nationalacademies.org/read/10490/chapter/1">Dietary Reference Intakes</a>.</p></ToolSection>
  <ToolSection title="پرسش‌های رایج">{faqs.map((faq) => <div key={faq.question}><h3 className="font-black text-foreground">{faq.question}</h3><p>{faq.answer}</p></div>)}</ToolSection>
</ToolPage></>; }
