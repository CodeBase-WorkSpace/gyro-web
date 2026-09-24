export type FoodServing = {
  label: string;
  grams: number;
};

export type FoodCategory = "grain" | "bread" | "protein" | "dairy" | "fruit" | "dish";

export const foodCategoryLabels: Record<FoodCategory, string> = {
  grain: "غلات",
  bread: "نان‌ها",
  protein: "منابع پروتئین",
  dairy: "لبنیات",
  fruit: "میوه‌ها",
  dish: "غذاهای ایرانی",
};

export type PublicFood = {
  slug: string;
  nameFa: string;
  nameEn: string;
  category: FoodCategory;
  /** One-sentence answer-first summary rendered at the top of the page. */
  summary: string;
  /** Per 100 grams of the edible, prepared food. */
  per100: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  servings: FoodServing[];
  loggingTips: string[];
  /** Mixed dishes vary by recipe; approximate values are labeled on the page. */
  approximate: boolean;
  similarSlugs: string[];
  /** Optional approved Content Studio illustration shown on the public food pages. */
  artwork?: { src: string; alt: string };
  source: {label: string; url?: string};
  updatedAt: string;
  updatedAtFa: string;
};

export const publicFoods: PublicFood[] = [
  {
    slug: "nan-barbari",
    nameFa: "نان بربری",
    nameEn: "Barbari bread",
    category: "bread",
    summary:
      "هر ۱۰۰ گرم نان بربری حدود ۲۷۲ کیلوکالری دارد؛ یک تکه به اندازه کف دست معمولاً نزدیک ۳۵ گرم و حدود ۹۵ کیلوکالری است.",
    per100: {calories: 272, protein: 8.4, carbs: 59.5, fat: 0.6},
    servings: [
      {label: "یک کف دست", grams: 35},
      {label: "یک‌چهارم نان متوسط", grams: 75},
      {label: "نصف نان متوسط", grams: 150},
    ],
    loggingTips: [
      "بربری تازه به‌خاطر ضخامت و رطوبت، از لواش سنگین‌تر است؛ اگر می‌توانید یک بار تکه همیشگی‌تان را وزن کنید.",
      "کنجد، کره یا پنیرِ کنار نان را جدا ثبت کنید تا مقدار هر کدام روشن بماند.",
    ],
    approximate: true,
    similarSlugs: ["nan-sangak", "noon-lavash", "berenj-pokhteh"],
    artwork: {src: "/images/foods/nan-barbari.webp", alt: "تصویرسازی نان بربری"},
    source: {label: "برآورد بر اساس جدول ترکیبات غذایی نان‌های ایرانی و نمونه‌های رایج"},
    updatedAt: "2026-07-22",
    updatedAtFa: "۳۱ تیر ۱۴۰۵",
  },
  {
    slug: "shir-bedoon-charb",
    nameFa: "شیر بدون چربی",
    nameEn: "Skim milk",
    category: "dairy",
    summary:
      "هر لیوان شیر بدون چربی (حدود ۲۵۰ گرم) نزدیک ۸۵ کیلوکالری و ۸.۵ گرم پروتئین دارد؛ تفاوت اصلی آن با شیر کامل، چربی کمتر است.",
    per100: {calories: 34, protein: 3.4, carbs: 5, fat: 0.1},
    servings: [
      {label: "یک لیوان", grams: 250},
      {label: "نصف لیوان", grams: 125},
      {label: "یک فنجان", grams: 180},
    ],
    loggingTips: [
      "روی بسته‌بندی، درصد چربی را بررسی کنید؛ شیر بدون چربی، کم‌چرب و کامل در جیرو رکوردهای جدا دارند.",
      "اگر شیر را با عسل، شکر یا پودر کاکائو می‌خورید، افزودنی‌ها را جدا ثبت کنید.",
    ],
    approximate: true,
    similarSlugs: ["shir-porcharb", "mast", "kashk"],
    artwork: {src: "/images/foods/shir-bedoon-charb.webp", alt: "تصویرسازی شیر بدون چربی"},
    source: {label: "برآورد بر اساس برچسب محصولات رایج"},
    updatedAt: "2026-07-22",
    updatedAtFa: "۳۱ تیر ۱۴۰۵",
  },
  {
    slug: "shir-porcharb",
    nameFa: "شیر کامل",
    nameEn: "Whole milk",
    category: "dairy",
    summary:
      "هر لیوان شیر کامل (حدود ۲۵۰ گرم) نزدیک ۱۶۵ کیلوکالری و حدود ۸ گرم پروتئین دارد؛ کالری بیشتر آن عمدتاً از چربی شیر می‌آید.",
    per100: {calories: 66, protein: 3.2, carbs: 4.8, fat: 3.9},
    servings: [
      {label: "یک لیوان", grams: 250},
      {label: "نصف لیوان", grams: 125},
      {label: "یک فنجان", grams: 180},
    ],
    loggingTips: [
      "شیر کامل و شیر بدون چربی پروتئین نزدیک به هم دارند؛ نوعی را ثبت کنید که واقعاً مصرف کرده‌اید.",
      "برای قهوه یا چای شیر، مقدار شیر را جدا از شکر، سیروپ یا خامه ثبت کنید.",
    ],
    approximate: true,
    similarSlugs: ["shir-bedoon-charb", "mast", "panir-feta"],
    artwork: {src: "/images/foods/shir-porcharb.webp", alt: "تصویرسازی شیر کامل"},
    source: {label: "برآورد بر اساس برچسب محصولات رایج"},
    updatedAt: "2026-07-22",
    updatedAtFa: "۳۱ تیر ۱۴۰۵",
  },
  {
    slug: "kashk",
    nameFa: "کشک",
    nameEn: "Kashk",
    category: "dairy",
    summary:
      "هر ۱۰۰ گرم کشک مایع پاستوریزه حدود ۹۸ کیلوکالری و ۱۱ گرم پروتئین دارد؛ مقدار مصرف معمول آن در غذاها کمتر از ۱۰۰ گرم است.",
    per100: {calories: 98, protein: 11, carbs: 3.4, fat: 4.3},
    servings: [
      {label: "یک قاشق غذاخوری", grams: 15},
      {label: "دو قاشق غذاخوری", grams: 30},
      {label: "یک‌چهارم لیوان", grams: 60},
    ],
    loggingTips: [
      "کشک خشک، مایع و محصول‌های مختلف غلظت یکسانی ندارند؛ اگر برچسب دارید، همان محصول را مبنا بگیرید.",
      "برای کشک بادمجان یا آش، کشک را جدا از روغن و سایر مواد ثبت کنید تا برآورد دقیق‌تر شود.",
    ],
    approximate: true,
    similarSlugs: ["mast", "shir-bedoon-charb", "panir-feta"],
    artwork: {src: "/images/foods/kashk.webp", alt: "تصویرسازی کشک"},
    source: {label: "برآورد بر اساس برچسب محصولات پاستوریزه رایج"},
    updatedAt: "2026-07-22",
    updatedAtFa: "۳۱ تیر ۱۴۰۵",
  },
  {
    slug: "panir-feta",
    nameFa: "پنیر فتا",
    nameEn: "Feta cheese",
    category: "dairy",
    summary:
      "هر ۱۰۰ گرم پنیر فتا حدود ۲۶۵ کیلوکالری و ۱۴.۲ گرم پروتئین دارد؛ یک قوطی کبریت پنیر معمولاً نزدیک ۳۰ گرم است.",
    per100: {calories: 265, protein: 14.2, carbs: 3.9, fat: 21.5},
    servings: [
      {label: "یک قوطی کبریت", grams: 30},
      {label: "دو قوطی کبریت", grams: 60},
      {label: "یک برش نازک", grams: 20},
    ],
    loggingTips: [
      "پنیرهای فتا از نظر چربی و نمک تفاوت زیادی دارند؛ در صورت دسترسی، برچسب همان محصول را بررسی کنید.",
      "گردو، نان و سبزی صبحانه را جدا ثبت کنید تا سهم هر بخش از وعده مشخص بماند.",
    ],
    approximate: true,
    similarSlugs: ["kashk", "mast", "shir-porcharb"],
    artwork: {src: "/images/foods/panir-feta.webp", alt: "تصویرسازی پنیر فتا"},
    source: {label: "برآورد بر اساس برچسب محصولات رایج"},
    updatedAt: "2026-07-22",
    updatedAtFa: "۳۱ تیر ۱۴۰۵",
  },
  {
    slug: "berenj-pokhteh",
    nameFa: "برنج پخته",
    nameEn: "Cooked white rice",
    category: "grain",
    summary:
      "هر ۱۰۰ گرم برنج سفید پخته (کته یا آبکش بدون روغن) حدود ۱۳۰ کیلوکالری دارد؛ یک کفگیر متوسط تقریباً ۱۲۰ گرم است.",
    per100: {calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4},
    servings: [
      {label: "یک کفگیر متوسط", grams: 120},
      {label: "یک لیوان", grams: 160},
      {label: "یک بشقاب معمول خانگی", grams: 250},
    ],
    loggingTips: [
      "برنج را بعد از پخت وزن کنید؛ وزن خشک حدود سه برابر کالری بیشتری در هر گرم نشان می‌دهد و باعث خطای ثبت می‌شود.",
      "روغن یا کره روی برنج را جدا ثبت کنید؛ یک قاشق روغن حدود ۱۲۰ کیلوکالری به وعده اضافه می‌کند.",
    ],
    approximate: false,
    similarSlugs: ["nan-sangak", "noon-lavash", "adasi"],
    source: {label: "USDA FoodData Central", url: "https://fdc.nal.usda.gov/"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "nan-sangak",
    nameFa: "نان سنگک",
    nameEn: "Sangak bread",
    category: "bread",
    summary:
      "هر ۱۰۰ گرم نان سنگک حدود ۲۷۰ کیلوکالری دارد؛ یک کف دست سنگک تقریباً ۳۰ گرم و حدود ۸۰ کیلوکالری است.",
    per100: {calories: 270, protein: 9.5, carbs: 54, fat: 1.5, fiber: 4.5},
    servings: [
      {label: "یک کف دست", grams: 30},
      {label: "نصف نان متوسط", grams: 150},
      {label: "یک نان کامل متوسط", grams: 300},
    ],
    loggingTips: [
      "نان‌های سنتی وزن یکسانی ندارند؛ یک بار نان محلی خودتان را وزن کنید و همان را معیار «کف دست» بگیرید.",
      "سنگک به دلیل آرد سبوس‌دارتر، فیبر بیشتری از نان لواش دارد و معمولاً سیرکننده‌تر است.",
    ],
    approximate: true,
    similarSlugs: ["noon-lavash", "berenj-pokhteh"],
    source: {label: "برآورد بر اساس جدول ترکیبات غذایی ایران و نمونه‌های رایج"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "noon-lavash",
    nameFa: "نان لواش",
    nameEn: "Lavash bread",
    category: "bread",
    summary:
      "هر ۱۰۰ گرم نان لواش حدود ۲۸۰ کیلوکالری دارد؛ یک کف دست لواش تقریباً ۱۰ گرم و حدود ۳۰ کیلوکالری است.",
    per100: {calories: 280, protein: 9, carbs: 57, fat: 1.2, fiber: 2.5},
    servings: [
      {label: "یک کف دست", grams: 10},
      {label: "یک نان کامل متوسط", grams: 60},
    ],
    loggingTips: [
      "لواش نازک و سبک است و شمردن «تعداد نان» گمراه‌کننده می‌شود؛ چند کف دست خوردید را بشمارید یا وزن کنید.",
      "برای صبحانه‌های پرتکرار، یک وعده ذخیره‌شده در جیرو بسازید تا ثبت روزانه یک‌ضربه‌ای شود.",
    ],
    approximate: true,
    similarSlugs: ["nan-sangak", "berenj-pokhteh"],
    source: {label: "برآورد بر اساس جدول ترکیبات غذایی ایران و نمونه‌های رایج"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "morgh",
    nameFa: "سینه مرغ پخته",
    nameEn: "Cooked chicken breast",
    category: "protein",
    summary:
      "هر ۱۰۰ گرم سینه مرغ پخته بدون پوست حدود ۱۶۵ کیلوکالری و ۳۱ گرم پروتئین دارد — یکی از متراکم‌ترین منابع پروتئین سفره ایرانی.",
    per100: {calories: 165, protein: 31, carbs: 0, fat: 3.6},
    servings: [
      {label: "یک فیله متوسط پخته", grams: 120},
      {label: "نصف سینه کامل پخته", grams: 170},
    ],
    loggingTips: [
      "وزن پخته حدود ۲۵ تا ۳۰ درصد کمتر از وزن خام است؛ مشخص کنید کدام را ثبت می‌کنید و همیشه همان را ادامه دهید.",
      "پوست مرغ کالری را به‌شکل قابل توجهی بالا می‌برد؛ مرغ با پوست را جداگانه برآورد کنید.",
    ],
    approximate: false,
    similarSlugs: ["tokhm-morgh", "kebab-koobideh", "mast"],
    source: {label: "USDA FoodData Central", url: "https://fdc.nal.usda.gov/"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "tokhm-morgh",
    nameFa: "تخم‌مرغ",
    nameEn: "Egg (boiled)",
    category: "protein",
    summary:
      "یک تخم‌مرغ کامل آب‌پز (حدود ۵۰ گرم) تقریباً ۷۸ کیلوکالری و ۶.۵ گرم پروتئین دارد؛ هر ۱۰۰ گرم آن ۱۵۵ کیلوکالری است.",
    per100: {calories: 155, protein: 13, carbs: 1.1, fat: 11},
    servings: [
      {label: "یک عدد متوسط آب‌پز", grams: 50},
      {label: "دو عدد متوسط آب‌پز", grams: 100},
      {label: "سفیده یک عدد", grams: 33},
    ],
    loggingTips: [
      "نیمرو را با روغنش ثبت کنید؛ همان یک قاشق روغن می‌تواند کالری وعده را دو برابر کند.",
      "سفیده تنها حدود ۵۲ کیلوکالری در ۱۰۰ گرم دارد و برای افزایش پروتئین بدون کالری زیاد گزینه خوبی است.",
    ],
    approximate: false,
    similarSlugs: ["morgh", "mast", "adasi"],
    source: {label: "USDA FoodData Central", url: "https://fdc.nal.usda.gov/"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "mast",
    nameFa: "ماست ساده",
    nameEn: "Plain yogurt",
    category: "dairy",
    summary:
      "هر ۱۰۰ گرم ماست ساده کم‌چرب حدود ۶۰ کیلوکالری و ۴ گرم پروتئین دارد؛ یک کاسه کوچک ماست تقریباً ۱۵۰ گرم است.",
    per100: {calories: 60, protein: 4, carbs: 5, fat: 2.5},
    servings: [
      {label: "یک قاشق غذاخوری", grams: 20},
      {label: "یک کاسه کوچک", grams: 150},
      {label: "یک کاسه بزرگ", grams: 250},
    ],
    loggingTips: [
      "چرب یا کم‌چرب بودن ماست را از برچسب بخوانید؛ ماست پرچرب محلی می‌تواند تا دو برابر کالری داشته باشد.",
      "ماست یونانی با حدود ۹ گرم پروتئین در ۱۰۰ گرم، جایگزین پرپروتئین‌تری برای همان حجم است.",
    ],
    approximate: false,
    similarSlugs: ["tokhm-morgh", "morgh"],
    source: {label: "USDA FoodData Central", url: "https://fdc.nal.usda.gov/"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "mooz",
    nameFa: "موز",
    nameEn: "Banana",
    category: "fruit",
    summary:
      "یک موز متوسط (حدود ۱۲۰ گرم بدون پوست) تقریباً ۱۰۵ کیلوکالری دارد؛ هر ۱۰۰ گرم موز ۸۹ کیلوکالری است.",
    per100: {calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6},
    servings: [
      {label: "یک عدد کوچک", grams: 90},
      {label: "یک عدد متوسط", grams: 120},
      {label: "یک عدد بزرگ", grams: 150},
    ],
    loggingTips: [
      "وزن موز را بدون پوست حساب کنید؛ پوست حدود یک‌سوم وزن کل است.",
      "موز میان‌وعده مناسبی قبل از تمرین است؛ کربوهیدرات سریع با فیبر متوسط.",
    ],
    approximate: false,
    similarSlugs: ["mast", "adasi"],
    source: {label: "USDA FoodData Central", url: "https://fdc.nal.usda.gov/"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "adasi",
    nameFa: "عدسی",
    nameEn: "Adasi (lentil stew)",
    category: "dish",
    summary:
      "هر ۱۰۰ گرم عدسی خانگی ساده حدود ۱۰۰ کیلوکالری و ۶ گرم پروتئین دارد؛ یک کاسه متوسط تقریباً ۲۵۰ گرم است.",
    per100: {calories: 100, protein: 6, carbs: 15, fat: 2, fiber: 4},
    servings: [
      {label: "یک کاسه کوچک", grams: 180},
      {label: "یک کاسه متوسط", grams: 250},
    ],
    loggingTips: [
      "غلظت عدسی خیلی متغیر است؛ عدسی آبکی‌تر در همان حجم کالری کمتری دارد. با کاسه خانه خودتان یک بار وزن کنید.",
      "روغنِ تفت پیاز را از قلم نیندازید؛ عدسی پرروغن می‌تواند تا ۵۰ درصد کالری بیشتری داشته باشد.",
      "عدسی از ارزان‌ترین منابع پروتئین گیاهی است و فیبر آن سیری را طولانی می‌کند.",
    ],
    approximate: true,
    similarSlugs: ["ghormeh-sabzi", "tokhm-morgh", "berenj-pokhteh"],
    source: {label: "برآورد جیرو بر اساس دستور رایج خانگی (عدس، آب، پیاز، روغن کم)"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "ghormeh-sabzi",
    nameFa: "قورمه‌سبزی",
    nameEn: "Ghormeh sabzi",
    category: "dish",
    summary:
      "هر ۱۰۰ گرم خورش قورمه‌سبزی (بدون برنج) حدود ۱۳۵ کیلوکالری دارد؛ یک ملاقه متوسط خورش تقریباً ۱۸۰ گرم است.",
    per100: {calories: 135, protein: 8, carbs: 6, fat: 9, fiber: 2.5},
    servings: [
      {label: "یک ملاقه متوسط", grams: 180},
      {label: "یک پیش‌دستی خورش", grams: 250},
    ],
    loggingTips: [
      "بیشترین اختلاف کالری از میزان روغنِ سرخ‌کردن سبزی می‌آید؛ نسخه کم‌روغن می‌تواند تا یک‌سوم کالری کمتری داشته باشد.",
      "خورش و برنج را جدا ثبت کنید تا سهم هر کدام در روزتان روشن باشد.",
      "لوبیا قرمزِ خورش، فیبر و پروتئین گیاهی خوبی به وعده اضافه می‌کند.",
    ],
    approximate: true,
    similarSlugs: ["adasi", "kebab-koobideh", "berenj-pokhteh"],
    source: {label: "برآورد جیرو بر اساس دستور رایج خانگی (گوشت، لوبیا، سبزی، روغن متوسط)"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
  {
    slug: "kebab-koobideh",
    nameFa: "کباب کوبیده",
    nameEn: "Kebab koobideh",
    category: "dish",
    summary:
      "هر سیخ کباب کوبیده رستورانی (حدود ۱۰۰ گرم پخته) تقریباً ۲۶۰ کیلوکالری و ۱۷ گرم پروتئین دارد.",
    per100: {calories: 260, protein: 17, carbs: 2, fat: 20},
    servings: [
      {label: "یک سیخ متوسط", grams: 100},
      {label: "دو سیخ (یک پرس معمول)", grams: 200},
    ],
    loggingTips: [
      "کوبیده معمولاً با گوشت پرچرب (حدود ۲۰ تا ۲۵ درصد چربی) درست می‌شود؛ همین چربی است که کالری را بالا می‌برد.",
      "برنجِ پرس و کره روی آن را جدا ثبت کنید؛ یک پرس کامل کوبیده با برنج و کره به‌راحتی از ۹۰۰ کیلوکالری می‌گذرد.",
      "کوبیده مرغ در همان وزن حدود یک‌سوم کالری کمتری دارد و گزینه پرپروتئین‌تری نسبت به کالری است.",
    ],
    approximate: true,
    similarSlugs: ["morgh", "ghormeh-sabzi", "berenj-pokhteh"],
    source: {label: "برآورد جیرو بر اساس ترکیب رایج رستورانی (گوشت چرخ‌کرده پرچرب و پیاز)"},
    updatedAt: "2026-07-21",
    updatedAtFa: "۳۰ تیر ۱۴۰۵",
  },
];

export function findPublicFood(slug: string): PublicFood | undefined {
  return publicFoods.find((food) => food.slug === slug);
}

export function similarFoods(food: PublicFood): PublicFood[] {
  return food.similarSlugs
    .map((slug) => findPublicFood(slug))
    .filter((entry): entry is PublicFood => entry !== undefined);
}

/** The honest protein-density metric: grams of protein per 1000 kcal. */
export function proteinPer1000Kcal(food: PublicFood): number {
  if (food.per100.calories <= 0) return 0;
  return Math.round((food.per100.protein / food.per100.calories) * 1000);
}

export function servingNutrition(food: PublicFood, grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.per100.calories * factor),
    protein: Math.round(food.per100.protein * factor * 10) / 10,
    carbs: Math.round(food.per100.carbs * factor * 10) / 10,
    fat: Math.round(food.per100.fat * factor * 10) / 10,
  };
}
