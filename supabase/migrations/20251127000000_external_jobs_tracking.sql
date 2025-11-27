-- Create external_jobs table to store jobs from external sources (LinkedIn, Indeed, Naukri, etc.)
CREATE TABLE IF NOT EXISTS public.external_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  job_type TEXT,
  salary_range TEXT,
  experience_level TEXT,
  skills_required TEXT[],
  source_platform TEXT NOT NULL CHECK (source_platform IN ('linkedin', 'indeed', 'naukri', 'glassdoor', 'monster', 'other')),
  external_url TEXT NOT NULL,
  external_job_id TEXT, -- ID from the external platform
  match_score INTEGER DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  matched_skills TEXT[],
  missing_skills TEXT[],
  posted_date TIMESTAMPTZ,
  expires_date TIMESTAMPTZ,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, external_url) -- Prevent duplicate tracking of same job
);

-- Create external_job_applications table to track applications to external jobs
CREATE TABLE IF NOT EXISTS public.external_job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_job_id UUID NOT NULL REFERENCES public.external_jobs(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  application_url TEXT, -- URL where they applied
  application_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'rejected', 'accepted', 'withdrawn')),
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, external_job_id) -- One application per job per user
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_external_jobs_user_id ON public.external_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_external_jobs_source_platform ON public.external_jobs(source_platform);
CREATE INDEX IF NOT EXISTS idx_external_jobs_created_at ON public.external_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_job_applications_user_id ON public.external_job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_external_job_applications_external_job_id ON public.external_job_applications(external_job_id);
CREATE INDEX IF NOT EXISTS idx_external_job_applications_status ON public.external_job_applications(status);

-- Enable RLS
ALTER TABLE public.external_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_jobs
CREATE POLICY "Users can view own external jobs" 
ON public.external_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own external jobs" 
ON public.external_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own external jobs" 
ON public.external_jobs 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own external jobs" 
ON public.external_jobs 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for external_job_applications
CREATE POLICY "Users can view own external job applications" 
ON public.external_job_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own external job applications" 
ON public.external_job_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own external job applications" 
ON public.external_job_applications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own external job applications" 
ON public.external_job_applications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_external_jobs_updated_at BEFORE UPDATE ON public.external_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_job_applications_updated_at BEFORE UPDATE ON public.external_job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

