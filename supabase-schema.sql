-- =========================================================
-- CIRCUITO AI — PRODUCTION SUPABASE DATABASE SCHEMA
-- =========================================================
-- Run this script in your Supabase Project's SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =========================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Create user_projects table
CREATE TABLE IF NOT EXISTS public.user_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_board TEXT,
  system_architecture TEXT,
  components_json TEXT,
  pin_mappings_json TEXT,
  firmware_code TEXT,
  verification_checklist_json TEXT,
  starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_projects
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- User Projects Policies (strict isolation by user_id)
DROP POLICY IF EXISTS "Users can view own projects" ON public.user_projects;
CREATE POLICY "Users can view own projects"
  ON public.user_projects FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.user_projects;
CREATE POLICY "Users can insert own projects"
  ON public.user_projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.user_projects;
CREATE POLICY "Users can update own projects"
  ON public.user_projects FOR UPDATE
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.user_projects;
CREATE POLICY "Users can delete own projects"
  ON public.user_projects FOR DELETE
  USING (auth.uid()::text = user_id);

-- Enable Realtime for user_projects
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_projects;

-- 3. Automatic Profile Creation on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    photo_url,
    subscription_tier,
    subscription_status
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Circuit Engineer'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'free',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Supabase Storage: 'circuit-assets' Bucket & RLS Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('circuit-assets', 'circuit-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view circuit assets" ON storage.objects;
CREATE POLICY "Public can view circuit assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'circuit-assets');

DROP POLICY IF EXISTS "Users can upload own circuit assets" ON storage.objects;
CREATE POLICY "Users can upload own circuit assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'circuit-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own circuit assets" ON storage.objects;
CREATE POLICY "Users can update own circuit assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'circuit-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own circuit assets" ON storage.objects;
CREATE POLICY "Users can delete own circuit assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'circuit-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

