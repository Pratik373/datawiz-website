-- Migration: Create Community Chat System Tables and Policies

-- Helper function to check admin status cleanly without permission errors
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
       OR LOWER(email) = LOWER(auth.jwt() ->> 'email')
  ) OR LOWER(auth.jwt() ->> 'email') = 'adminspp@datawiz.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Create community_groups table
CREATE TABLE IF NOT EXISTS public.community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_private BOOLEAN DEFAULT FALSE,
    is_read_only BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_groups ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN DEFAULT FALSE;


-- 2. Create community_group_members table (for private/specialized groups)
CREATE TABLE IF NOT EXISTS public.community_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_id, user_email)
);

-- 3. Create community_messages table
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT,
    sender_email TEXT,
    sender_role TEXT DEFAULT 'student',
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_messages_group_id ON public.community_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON public.community_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_community_group_members_email ON public.community_group_members(user_email);

-- Pre-seed default community groups
INSERT INTO public.community_groups (name, slug, description, category, is_private)
VALUES 
    ('# General Community', 'general-community', 'Open discussion community for all C-CAT test takers', 'general', FALSE),
    ('# DAC Aspirants 2026', 'dac-aspirants', 'Specialized community for CDAC Diploma in Advanced Computing aspirants', 'DAC', TRUE),
    ('# DBDA Aspirants 2026', 'dbda-aspirants', 'Specialized community for CDAC Diploma in Big Data Analytics aspirants', 'DBDA', TRUE)
ON CONFLICT (slug) DO UPDATE SET is_private = EXCLUDED.is_private;

-- Enable Row Level Security (RLS)
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if recreating
DROP POLICY IF EXISTS "Allow authenticated users to read community groups" ON public.community_groups;
DROP POLICY IF EXISTS "Allow admins full control over community groups" ON public.community_groups;
DROP POLICY IF EXISTS "Allow authenticated users to read memberships" ON public.community_group_members;
DROP POLICY IF EXISTS "Allow admins full control over group memberships" ON public.community_group_members;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.community_messages;
DROP POLICY IF EXISTS "Allow users to send text messages and admins to send media" ON public.community_messages;
DROP POLICY IF EXISTS "Allow admins to delete messages" ON public.community_messages;

-- Security Policies for community_groups
CREATE POLICY "Allow authenticated users to read community groups"
    ON public.community_groups FOR SELECT
    TO authenticated USING (TRUE);

CREATE POLICY "Allow admins full control over community groups"
    ON public.community_groups FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Security Policies for community_group_members
CREATE POLICY "Allow authenticated users to read memberships"
    ON public.community_group_members FOR SELECT
    TO authenticated USING (TRUE);

CREATE POLICY "Allow admins full control over group memberships"
    ON public.community_group_members FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Security Policies for community_messages
CREATE POLICY "Allow authenticated users to read messages"
    ON public.community_messages FOR SELECT
    TO authenticated USING (TRUE);

CREATE POLICY "Allow users to send text messages and admins to send media"
    ON public.community_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND (
            media_url IS NULL OR public.is_admin()
        )
    );

DROP POLICY IF EXISTS "Allow admins to delete messages" ON public.community_messages;
DROP POLICY IF EXISTS "Allow users to delete own messages and admins to delete any" ON public.community_messages;

CREATE POLICY "Allow users to delete own messages and admins to delete any"
    ON public.community_messages FOR DELETE
    TO authenticated
    USING (auth.uid() = sender_id OR public.is_admin());

-- Setup Storage Bucket for Community Media attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-media', 'community-media', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies to allow authenticated uploads into community-media
DROP POLICY IF EXISTS "Allow authenticated uploads to community-media" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to community-media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'community-media');

DROP POLICY IF EXISTS "Allow public read of community-media" ON storage.objects;
CREATE POLICY "Allow public read of community-media"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'community-media');

-- Enable Realtime publication for community_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
  END IF;
END $$;
