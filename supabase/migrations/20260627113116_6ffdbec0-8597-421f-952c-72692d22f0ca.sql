
-- =========================================================
-- PHASE 1 MIGRATION: Dynamic services, OTP, odometer, reminders
-- =========================================================

-- ---------- 1) profiles: phone_verified ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

-- ---------- 2) car_makes & car_models ----------
CREATE TABLE IF NOT EXISTS public.car_makes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_ar text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.car_makes TO anon, authenticated;
GRANT ALL ON public.car_makes TO service_role;
ALTER TABLE public.car_makes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "car_makes_read_all" ON public.car_makes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "car_makes_admin_write" ON public.car_makes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.car_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make_id uuid NOT NULL REFERENCES public.car_makes(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (make_id, name)
);
GRANT SELECT ON public.car_models TO anon, authenticated;
GRANT ALL ON public.car_models TO service_role;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "car_models_read_all" ON public.car_models FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "car_models_admin_write" ON public.car_models FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------- 3) cars: odometer + relations ----------
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS make_id uuid REFERENCES public.car_makes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.car_models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS odometer_value numeric,
  ADD COLUMN IF NOT EXISTS odometer_unit text NOT NULL DEFAULT 'km' CHECK (odometer_unit IN ('km','mile')),
  ADD COLUMN IF NOT EXISTS last_service_date date,
  ADD COLUMN IF NOT EXISTS last_service_odometer numeric,
  ADD COLUMN IF NOT EXISTS next_service_odometer numeric,
  ADD COLUMN IF NOT EXISTS default_oil_interval_km numeric NOT NULL DEFAULT 5000;

-- ---------- 4) services ----------
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric,
  duration_minutes int,
  image_url text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_read_all" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "services_admin_write" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 5) service_records: add fields ----------
ALTER TABLE public.service_records
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS odometer_value numeric,
  ADD COLUMN IF NOT EXISTS odometer_unit text NOT NULL DEFAULT 'km' CHECK (odometer_unit IN ('km','mile')),
  ADD COLUMN IF NOT EXISTS next_odometer_value numeric,
  ADD COLUMN IF NOT EXISTS next_odometer_unit text CHECK (next_odometer_unit IS NULL OR next_odometer_unit IN ('km','mile')),
  ADD COLUMN IF NOT EXISTS oil_brand text,
  ADD COLUMN IF NOT EXISTS oil_viscosity text,
  ADD COLUMN IF NOT EXISTS total_amount numeric,
  ADD COLUMN IF NOT EXISTS discount_amount numeric,
  ADD COLUMN IF NOT EXISTS customer_notes text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- ---------- 6) appointments: link to service ----------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

-- ---------- 7) otp_codes ----------
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'registration' CHECK (purpose IN ('registration','login','reset')),
  expires_at timestamptz NOT NULL,
  attempts_count int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  consumed_at timestamptz,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_codes_phone_purpose_idx ON public.otp_codes (phone, purpose, created_at DESC);
GRANT ALL ON public.otp_codes TO service_role;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- No policies: clients have no direct access; only Edge Functions with service role.

-- ---------- 8) faqs ----------
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs_read_active" ON public.faqs FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff_or_admin(auth.uid()));
CREATE POLICY "faqs_admin_write" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 9) loyalty_cards ----------
CREATE OR REPLACE FUNCTION public.gen_loyalty_code() RETURNS text
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c text;
BEGIN
  LOOP
    c := upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.loyalty_cards WHERE card_code = c);
  END LOOP;
  RETURN c;
END$$;

CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_cards TO authenticated;
GRANT ALL ON public.loyalty_cards TO service_role;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_own_read" ON public.loyalty_cards FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_or_admin(auth.uid()));
CREATE POLICY "loyalty_staff_write" ON public.loyalty_cards FOR ALL TO authenticated
  USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE TRIGGER loyalty_cards_updated_at BEFORE UPDATE ON public.loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 10) broadcasts ----------
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  image_url text,
  link_url text,
  target_type text NOT NULL DEFAULT 'all_customers'
    CHECK (target_type IN ('all_customers','specific_customers','oil_type','service_type')),
  target_filter jsonb,
  send_in_app boolean NOT NULL DEFAULT true,
  send_sms boolean NOT NULL DEFAULT false,
  send_whatsapp boolean NOT NULL DEFAULT false,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','cancelled')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "broadcasts_admin_all" ON public.broadcasts FOR ALL TO authenticated
  USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE TRIGGER broadcasts_updated_at BEFORE UPDATE ON public.broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 11) app_settings defaults ----------
INSERT INTO public.app_settings (key, value, description) VALUES
  ('oil_reminder_days', '{"v":21}'::jsonb, 'الأيام بعد آخر خدمة لإرسال تذكير'),
  ('oil_interval_km', '{"v":5000}'::jsonb, 'مسافة تغيير الزيت الافتراضية (كم)'),
  ('sms_provider', '{"v":"resala"}'::jsonb, 'مزود الرسائل'),
  ('sms_enabled', '{"v":false}'::jsonb, 'تفعيل إرسال SMS'),
  ('whatsapp_enabled', '{"v":false}'::jsonb, 'تفعيل واتساب'),
  ('otp_enabled', '{"v":true}'::jsonb, 'تفعيل OTP'),
  ('otp_required_for_registration', '{"v":true}'::jsonb, 'OTP إجباري للتسجيل'),
  ('resala_sender_name', '{"v":"DarAlzuyout"}'::jsonb, 'اسم المرسل في Resala'),
  ('otp_template', '{"v":"كود التحقق الخاص بك في دار الزيوت: {code}\nالكود صالح لمدة 5 دقائق."}'::jsonb, 'قالب رسالة OTP'),
  ('reminder_template', '{"v":"مرّ حوالي {days} يوم من آخر تغيير زيت لسيارتك. يرجى مراجعة عداد السيارة والدخول إلى التطبيق. دار الزيوت"}'::jsonb, 'قالب رسالة التذكير')
ON CONFLICT (key) DO NOTHING;

-- ---------- 12) Trigger: after service_record insert ----------
CREATE OR REPLACE FUNCTION public.after_service_record_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reminder_days int := 21;
  interval_km numeric := 5000;
  v jsonb;
  next_val numeric;
  next_unit text;
BEGIN
  -- read settings
  SELECT value INTO v FROM public.app_settings WHERE key='oil_reminder_days';
  IF v IS NOT NULL THEN reminder_days := COALESCE((v->>'v')::int, 21); END IF;
  SELECT value INTO v FROM public.app_settings WHERE key='oil_interval_km';
  IF v IS NOT NULL THEN interval_km := COALESCE((v->>'v')::numeric, 5000); END IF;

  -- compute next odometer if not provided
  IF NEW.next_odometer_value IS NULL AND NEW.odometer_value IS NOT NULL THEN
    IF NEW.odometer_unit = 'mile' THEN
      next_val := NEW.odometer_value + ROUND(interval_km / 1.60934);
      next_unit := 'mile';
    ELSE
      next_val := NEW.odometer_value + interval_km;
      next_unit := 'km';
    END IF;
    UPDATE public.service_records
      SET next_odometer_value = next_val, next_odometer_unit = next_unit
      WHERE id = NEW.id;
  ELSE
    next_val := NEW.next_odometer_value;
    next_unit := NEW.next_odometer_unit;
  END IF;

  -- update car
  IF NEW.car_id IS NOT NULL THEN
    UPDATE public.cars SET
      last_service_date = NEW.service_date,
      last_service_odometer = COALESCE(NEW.odometer_value, last_service_odometer),
      odometer_value = COALESCE(NEW.odometer_value, odometer_value),
      odometer_unit = COALESCE(NEW.odometer_unit, odometer_unit),
      next_service_odometer = COALESCE(next_val, next_service_odometer),
      updated_at = now()
    WHERE id = NEW.car_id;
  END IF;

  -- create reminder
  INSERT INTO public.reminders (user_id, car_id, service_record_id, due_date, status, notes)
  VALUES (NEW.user_id, NEW.car_id, NEW.id, (NEW.service_date + (reminder_days || ' days')::interval)::date, 'pending', 'تذكير تلقائي بعد ' || reminder_days || ' يوم');

  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_after_service_record_insert ON public.service_records;
CREATE TRIGGER trg_after_service_record_insert
  AFTER INSERT ON public.service_records
  FOR EACH ROW EXECUTE FUNCTION public.after_service_record_insert();

-- ---------- 13) Seed car_makes + car_models ----------
INSERT INTO public.car_makes (name, name_ar, sort_order) VALUES
  ('Toyota','تويوتا',1),('Hyundai','هيونداي',2),('Kia','كيا',3),('Nissan','نيسان',4),
  ('Honda','هوندا',5),('Mitsubishi','ميتسوبيشي',6),('Mazda','مازدا',7),('Ford','فورد',8),
  ('Chevrolet','شيفروليه',9),('Mercedes-Benz','مرسيدس',10),('BMW','بي ام دبليو',11),
  ('Audi','أودي',12),('Volkswagen','فولكسفاجن',13),('Peugeot','بيجو',14),('Renault','رينو',15),
  ('Suzuki','سوزوكي',16),('Geely','جيلي',17),('Chery','شيري',18),('Other','أخرى',999)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.car_models (make_id, name, sort_order)
SELECT m.id, x.name, x.sort_order FROM (VALUES
  ('Toyota','Corolla',1),('Toyota','Camry',2),('Toyota','Hilux',3),('Toyota','Land Cruiser',4),('Toyota','Yaris',5),('Toyota','RAV4',6),('Toyota','Prado',7),
  ('Hyundai','Elantra',1),('Hyundai','Sonata',2),('Hyundai','Tucson',3),('Hyundai','Accent',4),('Hyundai','Santa Fe',5),
  ('Kia','Cerato',1),('Kia','Sportage',2),('Kia','Sorento',3),('Kia','Rio',4),('Kia','Picanto',5),
  ('Nissan','Sunny',1),('Nissan','Altima',2),('Nissan','Patrol',3),('Nissan','X-Trail',4),('Nissan','Navara',5),
  ('Honda','Civic',1),('Honda','Accord',2),('Honda','CR-V',3),
  ('Mitsubishi','Lancer',1),('Mitsubishi','Pajero',2),('Mitsubishi','L200',3),('Mitsubishi','Outlander',4),
  ('Mazda','3',1),('Mazda','6',2),('Mazda','CX-5',3),
  ('Ford','Focus',1),('Ford','Ranger',2),('Ford','Explorer',3),('Ford','F-150',4),
  ('Chevrolet','Cruze',1),('Chevrolet','Tahoe',2),('Chevrolet','Silverado',3),
  ('Mercedes-Benz','C-Class',1),('Mercedes-Benz','E-Class',2),('Mercedes-Benz','S-Class',3),('Mercedes-Benz','GLE',4),
  ('BMW','3 Series',1),('BMW','5 Series',2),('BMW','X5',3),
  ('Audi','A4',1),('Audi','A6',2),('Audi','Q5',3),
  ('Volkswagen','Golf',1),('Volkswagen','Passat',2),('Volkswagen','Tiguan',3),
  ('Peugeot','301',1),('Peugeot','3008',2),('Peugeot','508',3),
  ('Renault','Megane',1),('Renault','Duster',2),('Renault','Symbol',3),
  ('Suzuki','Swift',1),('Suzuki','Vitara',2),
  ('Geely','Emgrand',1),('Geely','Coolray',2),
  ('Chery','Tiggo',1),('Chery','Arrizo',2)
) AS x(make, name, sort_order)
JOIN public.car_makes m ON m.name = x.make
ON CONFLICT (make_id, name) DO NOTHING;

-- ---------- 14) Seed services catalog ----------
INSERT INTO public.services (name, slug, description, price, duration_minutes, icon, is_active, sort_order) VALUES
  ('تغيير زيت سيارة', 'oil-change-car', 'تغيير زيت محرك السيارة مع فحص أولي', NULL, 20, 'Droplet', true, 1),
  ('تغيير زيت شاحنة', 'oil-change-truck', 'تغيير زيت محرك الشاحنات', NULL, 35, 'Truck', true, 2),
  ('تغيير زيت دراجة نارية', 'oil-change-bike', 'تغيير زيت محرك الدراجات النارية', NULL, 15, 'Bike', true, 3),
  ('فلتر زيت', 'oil-filter', 'تغيير فلتر الزيت', NULL, 10, 'Filter', true, 4),
  ('فلتر هواء', 'air-filter', 'تغيير فلتر الهواء', NULL, 10, 'Wind', true, 5),
  ('مواد مضافة', 'additives', 'إضافة محسّنات أداء المحرك', NULL, 5, 'FlaskConical', true, 6)
ON CONFLICT (slug) DO NOTHING;
