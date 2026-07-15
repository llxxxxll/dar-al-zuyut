-- ============================================
-- 1) Roles enum + user_roles table (security best practice)
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: is staff or admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'staff')
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 2) Profiles
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  weekly_fuel_fills NUMERIC NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 3) Cars
-- ============================================
CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT,
  year INT,
  plate_number TEXT,
  preferred_oil TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cars"
  ON public.cars FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Users manage own cars"
  ON public.cars FOR ALL
  USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));

-- ============================================
-- 4) Service records (oil changes)
-- ============================================
CREATE TABLE public.service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  oil_type TEXT,
  filter_changed BOOLEAN DEFAULT false,
  additives TEXT,
  staff_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own services"
  ON public.service_records FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff manage all services"
  ON public.service_records FOR ALL
  USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- ============================================
-- 5) Reminders
-- ============================================
CREATE TYPE public.reminder_status AS ENUM ('pending', 'due', 'sent', 'snoozed', 'completed');

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  service_record_id UUID REFERENCES public.service_records(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  status reminder_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff manage all reminders"
  ON public.reminders FOR ALL
  USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- ============================================
-- 6) App settings (key-value)
-- ============================================
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage settings"
  ON public.app_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Default settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('tank_capacity_liters', '60', 'سعة خزان الوقود الافتراضية باللتر'),
  ('km_per_tank', '400', 'المسافة بالكم لكل خزان كامل'),
  ('oil_change_km', '5000', 'المسافة بالكم لتغيير الزيت'),
  ('reminder_buffer_days', '7', 'عدد الأيام قبل الموعد لإرسال التذكير'),
  ('company_name', '"دار الزيوت"', 'اسم الشركة'),
  ('company_phone', '"0927527000"', 'رقم هاتف الشركة'),
  ('company_address', '"الزاوية الساحلي - بعد إشارة الضمان، طريق الخدمات غرباً"', 'عنوان الشركة');

-- ============================================
-- 7) Message templates
-- ============================================
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view templates"
  ON public.message_templates FOR SELECT
  USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Admins manage templates"
  ON public.message_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.message_templates (name, body, is_active) VALUES
  ('تذكير تغيير الزيت', 'عميلنا العزيز {{name}}، نذكركم بأن موعد تغيير زيت سيارتكم قد اقترب حسب آخر زيارة لكم إلى دار الزيوت. نسعد بخدمتكم. ☎ 0927527000', true);

-- ============================================
-- 8) Message logs
-- ============================================
CREATE TYPE public.message_status AS ENUM ('queued', 'sent', 'failed', 'delivered');

CREATE TABLE public.message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status message_status NOT NULL DEFAULT 'queued',
  provider_response TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view all messages"
  ON public.message_logs FOR SELECT
  USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Admins manage messages"
  ON public.message_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 9) Auto-create profile + customer role on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, weekly_fuel_fills)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    COALESCE((NEW.raw_user_meta_data->>'weekly_fuel_fills')::numeric, 1)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 10) updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cars_updated_at BEFORE UPDATE ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER message_templates_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();