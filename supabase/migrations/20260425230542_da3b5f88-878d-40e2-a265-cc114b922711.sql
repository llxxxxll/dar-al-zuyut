-- Appointments table
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'done', 'cancelled');
CREATE TYPE public.time_slot AS ENUM ('morning', 'afternoon', 'evening');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  car_id uuid,
  requested_date date NOT NULL,
  time_slot time_slot NOT NULL DEFAULT 'morning',
  service_type text NOT NULL DEFAULT 'oil_change',
  status appointment_status NOT NULL DEFAULT 'pending',
  notes text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own appointments"
ON public.appointments FOR SELECT
USING ((auth.uid() = user_id) OR is_staff_or_admin(auth.uid()));

CREATE POLICY "Users create own appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending appointments"
ON public.appointments FOR UPDATE
USING (((auth.uid() = user_id) AND status = 'pending') OR is_staff_or_admin(auth.uid()));

CREATE POLICY "Users delete own pending appointments"
ON public.appointments FOR DELETE
USING (((auth.uid() = user_id) AND status = 'pending') OR is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff manage all appointments"
ON public.appointments FOR ALL
USING (is_staff_or_admin(auth.uid()))
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notifications table
CREATE TYPE public.notification_type AS ENUM ('reminder', 'appointment', 'system', 'promo');

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type notification_type NOT NULL DEFAULT 'system',
  link_to text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING ((auth.uid() = user_id) OR is_staff_or_admin(auth.uid()));

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
USING ((auth.uid() = user_id) OR is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff create notifications"
ON public.notifications FOR INSERT
WITH CHECK (is_staff_or_admin(auth.uid()) OR (auth.uid() = user_id));

-- Helper function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _body text DEFAULT NULL,
  _type notification_type DEFAULT 'system',
  _link_to text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link_to)
  VALUES (_user_id, _title, _body, _type, _link_to)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Trigger: notify user when appointment status changes
CREATE OR REPLACE FUNCTION public.notify_appointment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'تم استلام طلب موعدك',
      'بانتظار التأكيد من فريقنا. سنبلغك قريباً.',
      'appointment',
      '/account'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'confirmed' THEN
      PERFORM public.create_notification(
        NEW.user_id,
        'تم تأكيد موعدك',
        'موعدك مؤكد بتاريخ ' || NEW.requested_date::text,
        'appointment',
        '/account'
      );
    ELSIF NEW.status = 'cancelled' THEN
      PERFORM public.create_notification(
        NEW.user_id,
        'تم إلغاء موعدك',
        COALESCE(NEW.admin_notes, 'تم إلغاء الموعد. للاستفسار تواصل معنا.'),
        'appointment',
        '/account'
      );
    ELSIF NEW.status = 'done' THEN
      PERFORM public.create_notification(
        NEW.user_id,
        'تمت خدمتك بنجاح',
        'شكراً لاختيارك دار الزيوت. يسعدنا خدمتك دائماً.',
        'appointment',
        '/account'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_appointment_change
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_change();