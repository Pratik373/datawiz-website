-- 1. Fix RLS policy on admin_users table
-- Since RLS is enabled on admin_users but no SELECT policy exists,
-- client-side queries fail to evaluate RLS policies that query admin_users.
CREATE POLICY "Allow users to read their own admin record" ON public.admin_users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Fix RLS policy on reviews table
-- Allow users to view their own reviews (pending or approved) so the frontend
-- can verify if a review has already been submitted.
CREATE POLICY "Users can view their own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);
