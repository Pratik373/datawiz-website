-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  test_id TEXT NOT NULL, -- The local test ID (e.g. 'free-ccat-mock-test' or 'premium-ccat-set-1')
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for scanning approved reviews
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved) WHERE is_approved = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_test ON public.reviews(user_id, test_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view approved reviews (needed for the landing page)
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

-- 2. Authenticated users can insert their own reviews
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can view their own reviews (pending or approved)
CREATE POLICY "Users can view their own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Admins can view all reviews (approved and pending)
CREATE POLICY "Admins can view all reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

-- 4. Admins can approve (update) reviews
CREATE POLICY "Admins can update reviews" ON public.reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

-- 5. Admins can delete reviews
CREATE POLICY "Admins can delete reviews" ON public.reviews
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );
