-- Fix RLS policy to allow college admins to view pending jobs for their college
-- Currently, college admins can UPDATE jobs but cannot SELECT pending jobs

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "College admins can view pending jobs" ON public.jobs;
DROP POLICY IF EXISTS "Alumni can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Everyone can view approved jobs" ON public.jobs;

-- Create a function to get user's college_id
CREATE OR REPLACE FUNCTION public.get_user_college_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT college_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Policy 1: Alumni can view their own jobs (any status)
CREATE POLICY "Alumni can view own jobs" ON public.jobs 
  FOR SELECT 
  USING (posted_by = auth.uid());

-- Policy 2: Everyone can view approved/active jobs
CREATE POLICY "Everyone can view approved jobs" ON public.jobs 
  FOR SELECT 
  USING (status = 'approved' OR status = 'active');

-- Policy 3: College admins can view pending jobs for their college
-- This allows the college Job Approvals page to work
CREATE POLICY "College admins can view pending jobs" ON public.jobs 
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'college')
    AND status = 'pending'
    AND college_id = public.get_user_college_id(auth.uid())
  );

-- Policy 4: Students can view pending jobs from their own college
-- This allows students to see alumni-posted jobs immediately
CREATE POLICY "Students can view college pending jobs" ON public.jobs 
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'student')
    AND status = 'pending'
    AND college_id = public.get_user_college_id(auth.uid())
  );

-- Note: To apply this migration, run it in the Supabase SQL Editor
-- Or use: supabase db push

