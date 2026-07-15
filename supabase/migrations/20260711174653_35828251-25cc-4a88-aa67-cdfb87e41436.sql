
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.is_staff_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff')) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_staff_or_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff_or_admin(uuid) TO authenticated, service_role;

-- public.*
DROP POLICY IF EXISTS "Admins manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Block non-admin role writes" ON public.user_roles;
CREATE POLICY "Admins manage all roles" ON public.user_roles FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Block non-admin role writes" ON public.user_roles AS RESTRICTIVE FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT
  USING ((auth.uid() = id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING ((auth.uid() = id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE
  USING (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Users view own cars" ON public.cars;
DROP POLICY IF EXISTS "Users manage own cars" ON public.cars;
CREATE POLICY "Users view own cars" ON public.cars FOR SELECT
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Users manage own cars" ON public.cars FOR ALL
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()))
  WITH CHECK ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own services" ON public.service_records;
DROP POLICY IF EXISTS "Staff manage all services" ON public.service_records;
CREATE POLICY "Users view own services" ON public.service_records FOR SELECT
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff manage all services" ON public.service_records FOR ALL
  USING (private.is_staff_or_admin(auth.uid()))
  WITH CHECK (private.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Staff manage all reminders" ON public.reminders;
CREATE POLICY "Users view own reminders" ON public.reminders FOR SELECT
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff manage all reminders" ON public.reminders FOR ALL
  USING (private.is_staff_or_admin(auth.uid()))
  WITH CHECK (private.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage settings" ON public.app_settings;
CREATE POLICY "Admins manage settings" ON public.app_settings FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Staff view templates" ON public.message_templates;
DROP POLICY IF EXISTS "Admins manage templates" ON public.message_templates;
CREATE POLICY "Staff view templates" ON public.message_templates FOR SELECT
  USING (private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins manage templates" ON public.message_templates FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Staff view all messages" ON public.message_logs;
DROP POLICY IF EXISTS "Admins manage messages" ON public.message_logs;
CREATE POLICY "Staff view all messages" ON public.message_logs FOR SELECT
  USING (private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins manage messages" ON public.message_logs FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Users view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users update own pending appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users delete own pending appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff manage all appointments" ON public.appointments;
CREATE POLICY "Users view own appointments" ON public.appointments FOR SELECT
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Users update own pending appointments" ON public.appointments FOR UPDATE
  USING (((auth.uid() = user_id) AND (status = 'pending'::public.appointment_status)) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Users delete own pending appointments" ON public.appointments FOR DELETE
  USING (((auth.uid() = user_id) AND (status = 'pending'::public.appointment_status)) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff manage all appointments" ON public.appointments FOR ALL
  USING (private.is_staff_or_admin(auth.uid()))
  WITH CHECK (private.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Staff create notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff create notifications" ON public.notifications FOR INSERT
  WITH CHECK (private.is_staff_or_admin(auth.uid()) OR (auth.uid() = user_id));

DROP POLICY IF EXISTS "Staff view all promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins manage promotions" ON public.promotions;
CREATE POLICY "Staff view all promotions" ON public.promotions FOR SELECT
  USING (private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins manage promotions" ON public.promotions FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Users view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins delete reviews" ON public.reviews;
CREATE POLICY "Users view own reviews" ON public.reviews FOR SELECT
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE
  USING ((auth.uid() = user_id) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins delete reviews" ON public.reviews FOR DELETE
  USING (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "car_makes_admin_write" ON public.car_makes;
CREATE POLICY "car_makes_admin_write" ON public.car_makes FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "car_models_admin_write" ON public.car_models;
CREATE POLICY "car_models_admin_write" ON public.car_models FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "services_admin_write" ON public.services;
CREATE POLICY "services_admin_write" ON public.services FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "faqs_read_active" ON public.faqs;
DROP POLICY IF EXISTS "faqs_admin_write" ON public.faqs;
CREATE POLICY "faqs_read_active" ON public.faqs FOR SELECT
  USING (is_active OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "faqs_admin_write" ON public.faqs FOR ALL
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "loyalty_own_read" ON public.loyalty_cards;
DROP POLICY IF EXISTS "loyalty_staff_write" ON public.loyalty_cards;
CREATE POLICY "loyalty_own_read" ON public.loyalty_cards FOR SELECT
  USING ((user_id = auth.uid()) OR private.is_staff_or_admin(auth.uid()));
CREATE POLICY "loyalty_staff_write" ON public.loyalty_cards FOR ALL
  USING (private.is_staff_or_admin(auth.uid()))
  WITH CHECK (private.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "broadcasts_admin_all" ON public.broadcasts;
CREATE POLICY "broadcasts_admin_all" ON public.broadcasts FOR ALL
  USING (private.is_staff_or_admin(auth.uid()))
  WITH CHECK (private.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff manage recipients" ON public.broadcast_recipients;
CREATE POLICY "Staff manage recipients" ON public.broadcast_recipients FOR ALL
  USING (private.is_staff_or_admin(auth.uid()))
  WITH CHECK (private.is_staff_or_admin(auth.uid()));

-- realtime.messages
DROP POLICY IF EXISTS "Users subscribe to own notification topic" ON realtime.messages;
CREATE POLICY "Users subscribe to own notification topic" ON realtime.messages FOR SELECT TO authenticated
  USING ((realtime.topic() = ('user-notifications:'::text || (auth.uid())::text)) OR private.is_staff_or_admin(auth.uid()));

-- storage.objects (media)
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
CREATE POLICY "Admins can upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins can update media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins can delete media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Staff can list media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND private.is_staff_or_admin(auth.uid()));

-- Drop old public helpers now that nothing depends on them
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_staff_or_admin(uuid);
