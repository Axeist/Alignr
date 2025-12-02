-- Add RLS policy to allow alumni/job posters to update application status
-- This allows alumni to shortlist, reject, or accept applications for jobs they posted

-- Drop existing policy if it exists (in case we need to recreate it)
DROP POLICY IF EXISTS "Job posters can update applications" ON public.applications;

-- Create policy for job posters (alumni) to update applications for their jobs
-- This allows them to change the status (shortlisted, rejected, accepted, etc.)
CREATE POLICY "Job posters can update applications" ON public.applications 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.posted_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.posted_by = auth.uid()
    )
  );

