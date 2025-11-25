-- Complete database schema migration for Alignr
-- Adds all missing tables from the specification

-- Update application_status enum to match spec
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'applied';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'interview_scheduled';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'offer';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role public.app_role,
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[],
  ADD COLUMN IF NOT EXISTS target_roles TEXT[],
  ADD COLUMN IF NOT EXISTS career_score INTEGER DEFAULT 0 CHECK (career_score >= 0 AND career_score <= 100),
  ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Explorer', 'Pro', 'Leader')),
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update colleges table with missing columns
ALTER TABLE public.colleges
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366F1',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#06B6D4',
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Create resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  version_label TEXT DEFAULT 'Resume',
  ats_score INTEGER DEFAULT 0 CHECK (ats_score >= 0 AND ats_score <= 100),
  target_role TEXT,
  extracted_data JSONB DEFAULT '{}',
  analysis_result JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create linkedin_profiles table
CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  linkedin_url TEXT,
  profile_text TEXT,
  completeness_score INTEGER DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  analysis_result JSONB DEFAULT '{}',
  last_analyzed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Update jobs table with missing columns
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS role_type TEXT CHECK (role_type IN ('internship', 'full_time', 'contract')),
  ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS skills_required TEXT[],
  ADD COLUMN IF NOT EXISTS skills_nice_to_have TEXT[],
  ADD COLUMN IF NOT EXISTS min_cgpa FLOAT,
  ADD COLUMN IF NOT EXISTS eligible_years INTEGER[],
  ADD COLUMN IF NOT EXISTS experience_required TEXT,
  ADD COLUMN IF NOT EXISTS stipend_salary_range TEXT,
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS application_deadline DATE,
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS college_scope TEXT DEFAULT 'open' CHECK (college_scope IN ('single', 'group', 'open'));

-- Update applications table with missing columns
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create skill_paths table
CREATE TABLE IF NOT EXISTS public.skill_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  target_role TEXT NOT NULL,
  skill_gaps TEXT[],
  recommended_courses JSONB[] DEFAULT '{}',
  recommended_projects JSONB[] DEFAULT '{}',
  milestones JSONB[] DEFAULT '{}',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create xp_events table
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'resume_upload', 'linkedin_connected', 'job_applied', 
    'course_completed', 'milestone_reached', 'profile_score_improved'
  )),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update placement_drives table (rename from existing and add columns)
ALTER TABLE public.placement_drives
  RENAME TO drives;

ALTER TABLE public.drives
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS drive_name TEXT,
  ADD COLUMN IF NOT EXISTS drive_type TEXT CHECK (drive_type IN ('on_campus', 'pool_campus', 'virtual')),
  ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS registration_deadline DATE,
  ADD COLUMN IF NOT EXISTS registered_students UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shortlisted_students UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selected_students UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update events table (rename to college_events and add columns)
ALTER TABLE public.events
  RENAME TO college_events;

ALTER TABLE public.college_events
  ADD COLUMN IF NOT EXISTS event_name TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN (
    'webinar', 'workshop', 'alumni_talk', 'mock_interview', 
    'career_fair', 'coding_contest'
  )),
  ADD COLUMN IF NOT EXISTS registration_link TEXT,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER,
  ADD COLUMN IF NOT EXISTS registered_count INTEGER DEFAULT 0;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'job_match', 'score_milestone', 'application_update', 
    'drive_announcement', 'event_reminder'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resumes
CREATE POLICY "Users can view own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Employers can view resumes of applicants" ON public.resumes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE a.resume_id = resumes.id AND j.posted_by = auth.uid()
  )
);

-- RLS Policies for linkedin_profiles
CREATE POLICY "Users can view own linkedin profile" ON public.linkedin_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own linkedin profile" ON public.linkedin_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own linkedin profile" ON public.linkedin_profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for skill_paths
CREATE POLICY "Users can view own skill paths" ON public.skill_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill paths" ON public.skill_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill paths" ON public.skill_paths FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for xp_events
CREATE POLICY "Users can view own xp events" ON public.xp_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert xp events" ON public.xp_events FOR INSERT WITH CHECK (true);

-- RLS Policies for badges
CREATE POLICY "Users can view own badges" ON public.badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view all badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "System can insert badges" ON public.badges FOR INSERT WITH CHECK (true);

-- RLS Policies for drives (updated from placement_drives)
DROP POLICY IF EXISTS "Everyone can view placement drives" ON public.drives;
DROP POLICY IF EXISTS "College admins can manage drives" ON public.drives;

CREATE POLICY "Everyone can view drives" ON public.drives FOR SELECT USING (true);
CREATE POLICY "College admins can manage drives" ON public.drives FOR ALL USING (
  public.has_role(auth.uid(), 'college')
);

-- RLS Policies for college_events (updated from events)
DROP POLICY IF EXISTS "Everyone can view events" ON public.college_events;
DROP POLICY IF EXISTS "College and admins can create events" ON public.college_events;
DROP POLICY IF EXISTS "Organizers can update own events" ON public.college_events;

CREATE POLICY "Everyone can view college events" ON public.college_events FOR SELECT USING (true);
CREATE POLICY "College and admins can create events" ON public.college_events FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'college') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Organizers can update own events" ON public.college_events FOR UPDATE USING (auth.uid() = organizer_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_linkedin_profiles_updated_at BEFORE UPDATE ON public.linkedin_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skill_paths_updated_at BEFORE UPDATE ON public.skill_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_college_id ON public.jobs(college_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

