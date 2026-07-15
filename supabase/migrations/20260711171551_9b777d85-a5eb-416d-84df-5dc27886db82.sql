
-- 1. Lock otp_codes strictly to service_role (backend only)
REVOKE ALL ON public.otp_codes FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.otp_codes TO service_role;
-- Add explicit deny policy so linter recognizes intent
DROP POLICY IF EXISTS "No direct client access to otp_codes" ON public.otp_codes;
CREATE POLICY "No direct client access to otp_codes"
  ON public.otp_codes FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- 2. Revoke EXECUTE from public/anon on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff_or_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, notification_type, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_loyalty_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_appointment_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.after_service_record_insert() FROM PUBLIC, anon, authenticated;

-- Trigger/helper functions only need service_role
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, notification_type, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.gen_loyalty_code() TO service_role, authenticated;
