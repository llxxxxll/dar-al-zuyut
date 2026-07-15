-- 1) Restrict app_settings to authenticated users only (prevents anon enumeration of config)
DROP POLICY IF EXISTS "Anyone view settings" ON public.app_settings;
CREATE POLICY "Authenticated view settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- 2) Explicit deny for non-admin self-insert/update on user_roles (defense in depth)
-- Although no INSERT policy exists for non-admins (so they can't insert), we add an explicit
-- restrictive policy that blocks any non-admin from inserting/updating their own roles.
DROP POLICY IF EXISTS "Block non-admin role writes" ON public.user_roles;
CREATE POLICY "Block non-admin role writes"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Realtime authorization: restrict who can subscribe to notification channels.
-- Users should only be able to subscribe to a topic that matches their own user_id.
-- Topic convention: 'user-notifications:<user_id>'
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe to own notification topic" ON realtime.messages;
CREATE POLICY "Users subscribe to own notification topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow only if the topic ends with the user's own id, OR the user is staff/admin
  (realtime.topic() = 'user-notifications:' || auth.uid()::text)
  OR public.is_staff_or_admin(auth.uid())
);

-- Block all writes to realtime.messages from clients (broadcast comes from server only)
DROP POLICY IF EXISTS "Block client writes to realtime" ON realtime.messages;
CREATE POLICY "Block client writes to realtime"
ON realtime.messages
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);
