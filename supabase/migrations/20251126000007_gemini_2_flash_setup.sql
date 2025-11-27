-- Migration: Gemini 2.0 Flash-Lite Setup
-- Creates necessary tables and storage bucket policies for AI features

-- ============================================
-- 1. CREATE CAREER REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.career_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  report_url TEXT NOT NULL,
  report_data JSONB DEFAULT '{}',
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, created_at)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_career_reports_user_id ON public.career_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_career_reports_created_at ON public.career_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.career_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for career_reports
CREATE POLICY "Users can view own career reports" 
  ON public.career_reports 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career reports" 
  ON public.career_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career reports" 
  ON public.career_reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "College admins can view reports of their students" 
  ON public.career_reports 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = career_reports.user_id 
      AND p.college_id = career_reports.college_id
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'college'
        AND EXISTS (
          SELECT 1 FROM public.colleges c
          WHERE c.id = p.college_id
          AND c.admin_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- 2. UPDATE SKILL PATHS TABLE (if needed)
-- ============================================
-- Ensure skill_paths has all necessary columns
ALTER TABLE public.skill_paths
  ADD COLUMN IF NOT EXISTS final_project JSONB,
  ADD COLUMN IF NOT EXISTS recommended_courses JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS recommended_projects JSONB DEFAULT '[]';

-- ============================================
-- 3. CREATE STORAGE BUCKET POLICIES
-- ============================================
-- Note: Storage buckets must be created via Supabase Dashboard or API
-- These policies will apply once buckets are created

-- Policy for resumes bucket
CREATE POLICY IF NOT EXISTS "Users can upload own resumes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Users can view own resumes"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Users can update own resumes"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Users can delete own resumes"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for career-reports bucket
CREATE POLICY IF NOT EXISTS "Users can upload own career reports"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'career-reports' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Users can view own career reports"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'career-reports' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Public can view career reports"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'career-reports');

-- Policy for avatars bucket
CREATE POLICY IF NOT EXISTS "Users can upload own avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "Public can view avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy for logos bucket
CREATE POLICY IF NOT EXISTS "Public can view logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY IF NOT EXISTS "College admins can upload logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('college', 'admin')
    )
  );

-- ============================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_career_reports_updated_at 
  BEFORE UPDATE ON public.career_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. CREATE FUNCTION TO TRACK REPORT GENERATION
-- ============================================
CREATE OR REPLACE FUNCTION public.track_career_report_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's XP when report is generated
  IF NEW.generation_status = 'completed' AND OLD.generation_status != 'completed' THEN
    UPDATE public.profiles
    SET xp_points = COALESCE(xp_points, 0) + 50
    WHERE user_id = NEW.user_id;
    
    -- Log XP event
    INSERT INTO public.xp_events (user_id, event_type, xp_earned, description)
    VALUES (NEW.user_id, 'milestone_reached', 50, 'Generated career report');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER career_report_generation_tracker
  AFTER UPDATE OF generation_status ON public.career_reports
  FOR EACH ROW
  WHEN (NEW.generation_status = 'completed' AND OLD.generation_status != 'completed')
  EXECUTE FUNCTION public.track_career_report_generation();

-- ============================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.career_reports IS 'Stores generated career reports for students using Gemini 2.0 Flash-Lite';
COMMENT ON COLUMN public.career_reports.report_url IS 'Public URL to the generated HTML report in storage';
COMMENT ON COLUMN public.career_reports.report_data IS 'JSON data containing the full report structure';
COMMENT ON COLUMN public.career_reports.generation_status IS 'Status of report generation: pending, generating, completed, failed';


