-- Fix RLS policies for resumes table
-- This ensures users can insert their own resumes

-- Ensure RLS is enabled
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Employers can view resumes of applicants" ON public.resumes;

-- Recreate policies with proper checks
CREATE POLICY "Users can view own resumes" 
  ON public.resumes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" 
  ON public.resumes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" 
  ON public.resumes 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" 
  ON public.resumes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow employers to view resumes of applicants
CREATE POLICY "Employers can view resumes of applicants" 
  ON public.resumes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.resume_id = resumes.id 
        AND j.posted_by = auth.uid()
    )
  );

-- Also ensure storage policies are in place for resumes bucket
-- These should already exist from the gemini setup, but let's make sure

-- Storage policies for resumes bucket
DROP POLICY IF EXISTS "Users can upload own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resumes" ON storage.objects;

CREATE POLICY "Users can upload own resumes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own resumes"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own resumes"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own resumes"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

