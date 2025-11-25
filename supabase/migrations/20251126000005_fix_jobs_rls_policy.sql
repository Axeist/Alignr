-- Fix RLS policies for jobs table to allow alumni to post jobs
-- The issue is that the INSERT policy needs to ensure posted_by matches auth.uid()

-- Ensure has_role function can read user_roles (it's SECURITY DEFINER so should work, but let's be explicit)
-- The function should already be SECURITY DEFINER, but let's make sure it's correct
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Drop existing jobs INSERT policy
DROP POLICY IF EXISTS "Alumni can create jobs" ON public.jobs;

-- Create improved INSERT policy that ensures:
-- 1. User has alumni role
-- 2. posted_by matches the authenticated user (security)
-- 3. Allows college_id to be set (for targeted job postings)
CREATE POLICY "Alumni can create jobs" ON public.jobs 
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'alumni') 
    AND posted_by = auth.uid()
  );

-- Also ensure that alumni can view their own pending jobs
-- This allows them to see jobs they posted even if not yet approved
DROP POLICY IF EXISTS "Alumni can view own jobs" ON public.jobs;
CREATE POLICY "Alumni can view own jobs" ON public.jobs 
  FOR SELECT 
  USING (
    posted_by = auth.uid() 
    OR status = 'approved' 
    OR status = 'active'
  );

-- Ensure the existing SELECT policy allows viewing approved/active jobs
-- (This should already exist, but let's make sure)
DROP POLICY IF EXISTS "Everyone can view approved jobs" ON public.jobs;
CREATE POLICY "Everyone can view approved jobs" ON public.jobs 
  FOR SELECT 
  USING (status = 'approved' OR status = 'active');

-- Ensure job posters can update their own jobs
DROP POLICY IF EXISTS "Job posters can update own jobs" ON public.jobs;
CREATE POLICY "Job posters can update own jobs" ON public.jobs 
  FOR UPDATE 
  USING (auth.uid() = posted_by)
  WITH CHECK (auth.uid() = posted_by);

-- Ensure college admins can approve jobs
DROP POLICY IF EXISTS "College admins can approve jobs" ON public.jobs;
CREATE POLICY "College admins can approve jobs" ON public.jobs 
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'college'))
  WITH CHECK (public.has_role(auth.uid(), 'college'));

-- Note: If users are still getting RLS errors, verify they have the 'alumni' role:
-- SELECT * FROM public.user_roles WHERE user_id = '<user_id>' AND role = 'alumni';
-- If the role is missing, insert it:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<user_id>', 'alumni');

