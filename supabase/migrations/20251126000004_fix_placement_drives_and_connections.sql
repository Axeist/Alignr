-- Fix placement_drives table and ensure all connections
-- This migration ensures placement_drives exists and all relationships are properly set up

-- First, check if drives table exists (from previous migration) and rename it back if needed
DO $$
BEGIN
  -- If drives table exists and placement_drives doesn't, rename it back to placement_drives
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drives') 
     AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'placement_drives') THEN
    ALTER TABLE public.drives RENAME TO placement_drives;
  -- If both exist, drop drives and keep placement_drives
  ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drives')
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'placement_drives') THEN
    DROP TABLE IF EXISTS public.drives CASCADE;
  END IF;
END $$;

-- Create placement_drives table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  drive_date TIMESTAMPTZ NOT NULL,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add additional columns if they don't exist (from the drives table structure)
ALTER TABLE public.placement_drives
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

-- Ensure RLS is enabled
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (handle both tables safely)
DO $$
BEGIN
  -- Drop policies on placement_drives table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'placement_drives') THEN
    DROP POLICY IF EXISTS "Everyone can view placement drives" ON public.placement_drives;
    DROP POLICY IF EXISTS "College admins can manage placement drives" ON public.placement_drives;
    DROP POLICY IF EXISTS "College admins can create placement drives" ON public.placement_drives;
    DROP POLICY IF EXISTS "College admins can manage drives" ON public.placement_drives;
    DROP POLICY IF EXISTS "Everyone can view drives" ON public.placement_drives;
  END IF;
  
  -- Drop policies on drives table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drives') THEN
    DROP POLICY IF EXISTS "Everyone can view drives" ON public.drives;
    DROP POLICY IF EXISTS "College admins can manage drives" ON public.drives;
    DROP POLICY IF EXISTS "Everyone can view placement drives" ON public.drives;
  END IF;
END $$;

-- Create RLS policies for placement_drives
CREATE POLICY "Everyone can view placement drives" ON public.placement_drives 
  FOR SELECT USING (true);

CREATE POLICY "College admins can manage placement drives" ON public.placement_drives 
  FOR ALL USING (
    public.has_role(auth.uid(), 'college') AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.college_id = placement_drives.college_id
    )
  );

CREATE POLICY "College admins can create placement drives" ON public.placement_drives 
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'college') AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.college_id = placement_drives.college_id
    )
  );

-- Ensure profiles table has college_id column for all user types
-- This connects students, alumni, and college users to colleges
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;

-- Ensure applications table has proper connections
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a trigger to sync user_id with student_id for backward compatibility
CREATE OR REPLACE FUNCTION sync_application_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not set but student_id is, set user_id to student_id
  IF NEW.user_id IS NULL AND NEW.student_id IS NOT NULL THEN
    NEW.user_id := NEW.student_id;
  END IF;
  -- If student_id is not set but user_id is, set student_id to user_id
  IF NEW.student_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.student_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_application_user_id_trigger ON public.applications;
CREATE TRIGGER sync_application_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION sync_application_user_id();

-- Ensure jobs table has proper connections (already exists but ensure it's there)
-- Jobs connect alumni (posted_by) to colleges (college_id) to students (via applications)

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_placement_drives_college_id ON public.placement_drives(college_id);
CREATE INDEX IF NOT EXISTS idx_placement_drives_drive_date ON public.placement_drives(drive_date);
CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_applications_college_id ON public.applications(college_id);

-- Ensure all relationships are properly indexed
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON public.jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);

-- Add comment to document the relationships
COMMENT ON TABLE public.placement_drives IS 'Placement drives organized by colleges. Connected to colleges via college_id.';
COMMENT ON COLUMN public.profiles.college_id IS 'Links students, alumni, and college users to their college. All user types can have a college_id.';
COMMENT ON COLUMN public.jobs.college_id IS 'Links jobs to colleges. Alumni post jobs that can be associated with specific colleges.';
COMMENT ON COLUMN public.applications.college_id IS 'Links applications to colleges. Students apply to jobs, creating connections between students, alumni, and colleges.';

