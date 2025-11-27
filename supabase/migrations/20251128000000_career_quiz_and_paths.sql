-- Migration: Career Quiz and Career Path Suggestions
-- Replaces skill_paths and career_reports with better AI-powered tools

-- ============================================
-- 1. CREATE CAREER QUIZ TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.career_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  quiz_responses JSONB NOT NULL DEFAULT '{}',
  quiz_score INTEGER DEFAULT 0 CHECK (quiz_score >= 0 AND quiz_score <= 100),
  career_insights JSONB DEFAULT '{}',
  suggested_roles TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_career_quizzes_user_id ON public.career_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_career_quizzes_created_at ON public.career_quizzes(created_at DESC);

-- Enable RLS
ALTER TABLE public.career_quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for career_quizzes
CREATE POLICY "Users can view own career quizzes" 
  ON public.career_quizzes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career quizzes" 
  ON public.career_quizzes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career quizzes" 
  ON public.career_quizzes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- 2. CREATE CAREER PATH SUGGESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.career_path_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  suggested_paths JSONB NOT NULL DEFAULT '[]',
  top_matches JSONB DEFAULT '{}',
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_career_path_suggestions_user_id ON public.career_path_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_career_path_suggestions_created_at ON public.career_path_suggestions(created_at DESC);

-- Enable RLS
ALTER TABLE public.career_path_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for career_path_suggestions
CREATE POLICY "Users can view own career path suggestions" 
  ON public.career_path_suggestions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career path suggestions" 
  ON public.career_path_suggestions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career path suggestions" 
  ON public.career_path_suggestions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- 3. CREATE SKILLS RECOMMENDATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.skills_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  target_role TEXT,
  recommended_skills JSONB NOT NULL DEFAULT '[]',
  skill_gaps JSONB DEFAULT '[]',
  learning_resources JSONB DEFAULT '[]',
  priority_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_role)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skills_recommendations_user_id ON public.skills_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_recommendations_target_role ON public.skills_recommendations(target_role);

-- Enable RLS
ALTER TABLE public.skills_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills_recommendations
CREATE POLICY "Users can view own skills recommendations" 
  ON public.skills_recommendations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills recommendations" 
  ON public.skills_recommendations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills recommendations" 
  ON public.skills_recommendations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- 4. ADD QUIZ SCORE TO PROFILES (for career score calculation)
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS quiz_score INTEGER DEFAULT 0 CHECK (quiz_score >= 0 AND quiz_score <= 100);

-- ============================================
-- 5. CREATE UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_career_quizzes_updated_at 
  BEFORE UPDATE ON public.career_quizzes 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_career_path_suggestions_updated_at 
  BEFORE UPDATE ON public.career_path_suggestions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skills_recommendations_updated_at 
  BEFORE UPDATE ON public.skills_recommendations 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

