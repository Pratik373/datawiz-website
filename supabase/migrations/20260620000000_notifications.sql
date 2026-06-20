-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for sorting notifications by creation time
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Select Policy: Authenticated users can select notifications.
-- General notifications are visible to everyone logged in.
-- Premium notifications are visible only to admins or paid users (tests_remaining > 0).
CREATE POLICY "Allow select for authenticated users" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    type = 'general'
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_credits WHERE user_id = auth.uid() AND tests_remaining > 0
    )
  );

-- 2. Insert Policy: Only admins can insert notifications
CREATE POLICY "Allow admin to insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

-- 3. Delete Policy: Only admins can delete notifications
CREATE POLICY "Allow admin to delete notifications" ON public.notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );
