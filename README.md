# جوا المنهج — صفحة هبوط تعليمية (Landing Page)

صفحة هبوط عصرية عالية التحويل بالعربية (RTL) لمنصّة مدرّس/تعليمية، مبنية بـ **Next.js App Router + React 19 + TypeScript + Tailwind CSS + Framer Motion + Lucide**.

## المميّزات
- 🎨 **محرّك ثيم ديناميكي** — تبديل بين تخطيطين (Cyber-Glass الداكن / Editorial Bento الفاتح) + 4 بريسيتات لونية + منتقي HEX مخصّص، بمعاينة لحظية من لوحة عائمة (لوحة الأدمن) وحفظ في `localStorage`.
- 🧭 **Navbar عائم كبسولة** — زجاجي، يتقلّص عند التمرير، حبّة ممغنطة تتبع الهوفر (`layoutId`)، شارة «مباشر» نابضة، ودرج موبايل.
- 🦸 **Hero ثلاثي الأبعاد** — إطار سكويركل/قوسي، صورة المدرّس تطلع فوق الإطار (pop-out)، بطاقات زجاجية عائمة، وشريط ثقة بعدّادات.
- ✨ **تفاعلات دقيقة** — موجات تشغيل، نجوم تتلألأ، علامات صح تُرسَم عند الظهور، أسهم نابضة.
- 🧱 **أقسام Bento** — المنهج التفاعلي، لوحة الشرف (سلايدر)، الأسعار (مبدّل شهري/ترم)، وأكورديون الأسئلة.
- 🔎 **SEO ديناميكي** — Open Graph لمعاينات واتساب/فيسبوك + Schema.org JSON-LD (`Course` / `Person` / `FAQPage`).
- 📱 **RTL 100%** ومتجاوب بالكامل.

## التشغيل
```bash
npm install
npm run dev
```
افتح http://localhost:3000

للبناء للإنتاج:
```bash
npm run build && npm start
```

## التخصيص السريع
- **كل المحتوى** (المدرّس، المنهج، الأسعار، الأسئلة، رقم واتساب) في ملف واحد: [`lib/data.ts`](lib/data.ts).
- **الألوان/الثيم**: [`app/globals.css`](app/globals.css) (متغيرات HSL) و[`components/theme/theme-context.tsx`](components/theme/theme-context.tsx).
- **صورة المدرّس**: استبدل `public/teacher.svg` بصورة PNG شفافة مقصوصة باسم `teacher.png` وحدّث `avatar` في `lib/data.ts`.
- **صورة المشاركة**: أضف `public/og-image.png` بمقاس 1200×630.

## البنية
```
app/            layout + page + globals
components/
  theme/        محرّك الثيم + لوحة التبديل
  sections/     navbar, hero, features, curriculum, honor-wall, pricing, faq, cta-footer
  ui/           primitives, animated-icons, video-modal
lib/            data.ts (المحتوى) + seo.ts (الميتا و JSON-LD)
```
