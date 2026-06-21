DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.notifications;

CREATE POLICY "Allow select for authenticated users" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    type = 'general'
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
    OR (
      type = 'premium'
      AND EXISTS (
        SELECT 1 FROM public.user_credits WHERE user_id = auth.uid() AND tests_remaining > 0
      )
    )
    OR (
      type = 'non_paid'
      AND NOT EXISTS (
        SELECT 1 FROM public.user_credits WHERE user_id = auth.uid() AND tests_remaining > 0
      )
    )
  );
