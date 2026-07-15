
CREATE TABLE public.broadcast_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app','sms','whatsapp')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','skipped')),
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX broadcast_recipients_broadcast_idx ON public.broadcast_recipients(broadcast_id);
CREATE INDEX broadcast_recipients_user_idx ON public.broadcast_recipients(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcast_recipients TO authenticated;
GRANT ALL ON public.broadcast_recipients TO service_role;

ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage recipients" ON public.broadcast_recipients
  FOR ALL USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Users view own recipients" ON public.broadcast_recipients
  FOR SELECT USING (auth.uid() = user_id);
