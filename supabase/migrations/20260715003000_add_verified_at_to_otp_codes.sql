ALTER TABLE public.otp_codes
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS otp_codes_phone_purpose_verified_idx
  ON public.otp_codes (phone, purpose, verified_at DESC)
  WHERE verified_at IS NOT NULL;
