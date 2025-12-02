-- Create interviews table for interview management
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  interview_date DATE NOT NULL,
  interview_time TIME NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'offline', 'phone', 'video_call')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected', 'selected', 'cancelled')),
  notes TEXT,
  location TEXT, -- For offline interviews
  meeting_link TEXT, -- For online/video_call interviews
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(application_id) -- One interview per application
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_student_id ON public.interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_alumni_id ON public.interviews(alumni_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON public.interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON public.interviews(interview_date);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interviews
-- Students can view their own interviews
CREATE POLICY "Students can view own interviews" ON public.interviews 
  FOR SELECT USING (auth.uid() = student_id);

-- Alumni can view interviews for their job postings
CREATE POLICY "Alumni can view interviews for their jobs" ON public.interviews 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = interviews.job_id AND j.posted_by = auth.uid()
    )
  );

-- Students can insert their own interviews (when scheduling)
CREATE POLICY "Students can insert own interviews" ON public.interviews 
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can update their own interviews (reschedule)
CREATE POLICY "Students can update own interviews" ON public.interviews 
  FOR UPDATE USING (auth.uid() = student_id);

-- Alumni can update interview status for their jobs
CREATE POLICY "Alumni can update interview status" ON public.interviews 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = interviews.job_id AND j.posted_by = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_interviews_updated_at 
  BEFORE UPDATE ON public.interviews 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

