-- Promotions
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  discount_percent integer,
  badge text,
  cta_label text,
  cta_link text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view active promotions" ON public.promotions
  FOR SELECT USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY "Staff view all promotions" ON public.promotions
  FOR SELECT USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Admins manage promotions" ON public.promotions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_record_id uuid,
  appointment_id uuid,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_approved boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_record_id),
  UNIQUE(user_id, appointment_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users view own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Users create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Admins delete reviews" ON public.reviews
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_approved ON public.reviews(is_approved) WHERE is_approved = true;
CREATE INDEX idx_promotions_active ON public.promotions(is_active, starts_at, ends_at);