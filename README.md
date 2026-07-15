# دار الزيوت — Dar Al Zuyut Connect

منصة ولاء وخدمات لمحل تغيير زيوت السيارات في ليبيا. تشمل تسجيل العملاء بالهاتف، بطاقات الولاء (QR)، المواعيد، سجلات الخدمة، التذكيرات، ولوحة تحكم إدارية.

## المتطلبات

- Node.js 20+
- حساب [Supabase](https://supabase.com) جديد
- (اختياري) مفتاح [Resala.ly](https://resala.ly) لإرسال OTP/SMS

## التشغيل المحلي

```bash
npm install
cp .env.example .env
# عدّل .env بمفاتيح مشروع Supabase الجديد
npm run dev
```

يفتح التطبيق على `http://localhost:3000`.

## إعداد Supabase الجديد

### 1. إنشاء المشروع

1. أنشئ مشروعاً جديداً في [Supabase Dashboard](https://supabase.com/dashboard)
2. انسخ **Project URL** و **anon key** من Settings → API
3. ضعها في ملف `.env`

### 2. تطبيق قاعدة البيانات

```bash
# تثبيت Supabase CLI إن لم يكن مثبتاً
npm install -g supabase

# ربط المشروع (استبدل YOUR_PROJECT_ID)
supabase link --project-ref YOUR_PROJECT_ID

# تطبيق كل الـ migrations
supabase db push
```

> **ملاحظة:** لا يوجد حساب اختبار مُضمّن. أول مستخدم يسجّل يصبح **مديراً** تلقائياً.

### 3. نشر Edge Functions

```bash
supabase functions deploy check-phone
supabase functions deploy send-otp
supabase functions deploy verify-otp
supabase functions deploy send-reminder-message
supabase functions deploy sms-status
```

### 4. أسرار Edge Functions (في Supabase Dashboard → Edge Functions → Secrets)

| Secret | الوصف |
|--------|--------|
| `RESALA_API_KEY` | مفتاح Resala.ly لإرسال SMS/OTP |
| `RESALA_SENDER` | اسم المرسل (افتراضي: `DarAlzuyout`) |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح service role من Settings → API |

### 5. إضافة نطاق الإنتاج في CORS

بعد تحديد الدومين النهائي، أضفه في:

- `supabase/functions/_shared/resala.ts`
- `supabase/functions/check-phone/index.ts`

## البناء والنشر

```bash
npm run build    # بناء للإنتاج
npm run preview  # معاينة البناء
```

النشر المستهدف: **Cloudflare Workers** (انظر `wrangler.jsonc`).

## هيكل المشروع

```
src/routes/          # صفحات التطبيق (TanStack Router)
src/components/      # مكوّنات UI ولوحة الإدارة
src/integrations/    # عميل Supabase والمصادقة
supabase/migrations/ # مخطط قاعدة البيانات
supabase/functions/  # Edge Functions (OTP, SMS, تذكيرات)
```

## المسارات الرئيسية

| المسار | الوصف |
|--------|--------|
| `/` | الصفحة الرئيسية |
| `/welcome` | بوابة العملاء |
| `/join` | تسجيل / دخول العميل |
| `/account` | حساب العميل |
| `/portal-9f3k-secure` | دخول الموظفين/الإدارة |
| `/admin/*` | لوحة التحكم |

## التقنيات

- TanStack Start + React 19
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Tailwind CSS 4 + shadcn/ui
- Cloudflare Workers
