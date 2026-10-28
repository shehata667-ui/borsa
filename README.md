# مصر فاينانس | Masr Finance

الأسواق والاستثمارات والادخار في مصر. واجهة عربية RTL (React + TypeScript + Tailwind) وخادم Fastify يفصل مصادر البيانات عن الواجهة.

> **حالة المشروع:** كُتب الكود بدون بناء أو اختبار (لم يُشغَّل `npm install` ولا `npm test` ولا `npm run build`). شغّلها أولًا وأصلح أي أخطاء قد تظهر.
> **البيانات:** يوجد adapterان فقط، غير مختبرين على الصفحات الحية: الذهب من آي صاغة (`ISAGHA_SCRAPE_ENABLED=true`) والصناديق من SNDUK (`SNDUK_ENABLED=true`). باقي الصفحات تعرض «المصدر غير مهيأ» بدل أي رقم. راجع `docs/DATA_SOURCES.md`.

## التشغيل المحلي
```bash
npm install
cp env.example .env  # (الملف اسمه env.example في هذه النسخة)        # ثم ضع المفاتيح عند توفرها (للخادم فقط)
npm run dev:server          # الخادم على :8787
npm run dev                 # الواجهة على :5173 (تمرّر /api للخادم)
```

## الأوامر
| الأمر | الوظيفة |
|---|---|
| `npm run typecheck` / `npm run lint` | فحص TypeScript (Strict) |
| `npm test` | اختبارات Vitest للحسابات والتقادم |
| `npm run build` | فحص الأنواع ثم بناء الواجهة في `dist/` |

## كيف تضيف مصدر بيانات حقيقي
1. تحقق من أن المزود يدعم الأصول المطلوبة وأن ترخيصه يسمح بالعرض العام. حدّث `docs/DATA_SOURCES.md`.
2. في `server/`، اكتب دالة تجلب البيانات وتُرجع `Quote[]` وفق `src/types/data.ts` (مع `source_timestamp` الحقيقي من المصدر و`data_mode` الصادق).
3. اربطها بالمسار `/api/data/:domain` في `server/index.ts` وفعّل `adapter_implemented` في `server/sources.ts`.
4. استخدم هذه المعرّفات لتظهر بطاقات الرئيسية: `EGX30`, `EGX70EWI`, `EGX100EWI`, `GOLD_21`, `USDEGP`, `CBE_OVERNIGHT_DEPOSIT`.

الواجهة تُسقط LIVE إلى STALE تلقائيًا إذا تقادم التوقيت (`src/utils/freshness.ts`).

## النشر
- GitHub يستضيف الكود فقط. 
- الواجهة: Vercel أو أي استضافة ثابتة (`vercel.json` يوجّه المسارات إلى `index.html`). اضبط `/api` ليشير إلى خادمك (rewrite أو نطاق خادم مع `ALLOWED_ORIGIN`).
- الخادم: Node 20 على استضافة تدعم عملية دائمة (Render/Railway/Fly...): `npm run start:server`. Health check: `GET /api/health`.
- المفاتيح في متغيرات بيئة المنصة فقط.

## رفع المشروع إلى GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<user>/masr-finance.git
git push -u origin main
```
اختر ترخيصًا (`LICENSE`) قبل النشر العام؛ لم يُضف ترخيص.

## Android APK (Capacitor)
المتطلبات: JDK 17 وAndroid Studio/SDK.
```bash
npm run cap:add:android   # مرة واحدة
npm run cap:sync
npx cap open android      # ثم Build > Build APK(s)
```
الـ APK يحتاج عنوان خادم منشور: الواجهة تستدعي `/api` نسبيًا، فاضبط في التطبيق عنوانًا مطلقًا للخادم قبل البناء (لم يُضف إعداد لذلك بعد). لا تضع أي مفاتيح في الـ APK. لم تُنشأ أيقونات Android.

## التنبيه
المعلومات للتوعية والمقارنة وليست توصية استثمارية.

## بناء APK على GitHub (بدون Android Studio وبدون خادم)
1. أنشئ ملف الـ workflow `.github/workflows/build-apk.yml` (نصه في `HIDDEN-FILES.md`).
2. Actions ← Build Android APK ← Run workflow. بعد انتهائه نزّل `masr-finance-debug-apk` من قسم Artifacts.

داخل التطبيق يعمل **الوضع المباشر**: الهاتف نفسه يجلب أسعار الذهب (آي صاغة) والصناديق (SNDUK: الأهلي ومصر) بطلبات HTTP أصلية ويخزنها محليًا (الذهب 5 دقائق، الصناديق 6 ساعات). لا حاجة لخادم. باقي الأقسام تظهر «غير متاح».
- الناتج APK تجريبي (debug) غير موقّع للمتجر.
- إن أردت خادمًا بدل الوضع المباشر فأضف متغير `API_BASE_URL` (Settings ← Secrets and variables ← Variables) وسيُستخدم بدل الجلب المباشر.
- الاستخدام بدون إذن كتابي من الموقعين، وكل هاتف يزورهما بنفسه؛ لا تعمم التطبيق على ناس كثيرين قبل الحصول على إذن.
