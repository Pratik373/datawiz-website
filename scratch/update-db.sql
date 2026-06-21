-- Update check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('general', 'premium', 'non_paid'));

-- Update RLS SELECT policy
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
