-- Add RLS policy to allow alumni to insert interviews for their jobs
-- This fixes the error when alumni try to schedule interviews after shortlisting

-- Alumni can insert interviews for jobs they posted
CREATE POLICY "Alumni can insert interviews for their jobs" ON public.interviews 
  FOR INSERT WITH CHECK (
    auth.uid() = alumni_id AND
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = interviews.job_id AND j.posted_by = auth.uid()
    )
  );

