-- Create a public bucket for site media (videos, images, logo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view media (it's a public site)
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Only admins can upload
CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));