-- Migration: Create support_messages table for in-app support chat between premium users and admin

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
    message TEXT NOT NULL,
    is_read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_read_by_user BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own support messages
CREATE POLICY "Users can view own support messages"
    ON public.support_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert support messages for themselves
CREATE POLICY "Users can insert own support messages"
    ON public.support_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND sender = 'user');

-- Policy: Admin service role has full access (Handled via Service Role / Edge Functions)

-- Create index for faster querying by user_id and creation time
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at DESC);
