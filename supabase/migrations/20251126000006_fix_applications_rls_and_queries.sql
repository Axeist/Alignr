-- Fix RLS policies for applications table to ensure alumni can view applications
-- Also ensure the applications table structure supports proper queries

-- Drop existing policies
DROP POLICY IF EXISTS "Job posters can view applications" ON public.applications;
DROP POLICY IF EXISTS "Alumni can view applications for their jobs" ON public.applications;

-- Create improved policy for job posters (alumni) to view applications
-- This ensures alumni can view applications for jobs they posted
CREATE POLICY "Job posters can view applications" ON public.applications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.posted_by = auth.uid()
    )
  );

-- Also allow alumni to view applications (same as above but with explicit role check)
CREATE POLICY "Alumni can view applications for their jobs" ON public.applications 
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'alumni') AND
    EXISTS (
      SELECT 1 
      FROM public.jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.posted_by = auth.uid()
    )
  );

-- Ensure applications table has both student_id and user_id for compatibility
-- (This should already be done in previous migrations, but let's make sure)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_job_id_posted_by ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);

-- Ensure the sync trigger is in place (from previous migration)
-- This ensures user_id and student_id stay in sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'sync_application_user_id_trigger'
  ) THEN
    CREATE TRIGGER sync_application_user_id_trigger
      BEFORE INSERT OR UPDATE ON public.applications
      FOR EACH ROW
      EXECUTE FUNCTION sync_application_user_id();
  END IF;
END $$;


