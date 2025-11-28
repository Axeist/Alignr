-- Alumni/Startup Verification System
-- This migration adds a comprehensive verification workflow for alumni and startups
-- that requires college rep approval before they can post jobs visible to students

-- Add verification status enum
DO $$ BEGIN
  CREATE TYPE alumni_verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add verification columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS alumni_verification_status TEXT DEFAULT 'pending' 
  CHECK (alumni_verification_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS alumni_verified_at TIMESTAMPTZ;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS alumni_verified_by UUID REFERENCES auth.users(id);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS alumni_rejection_reason TEXT;

-- Add index for faster verification queries
CREATE INDEX IF NOT EXISTS idx_profiles_alumni_verification 
  ON profiles(college_id, alumni_verification_status) 
  WHERE role = 'alumni';

-- Update the jobs table to ensure college-specific visibility
-- Jobs from verified alumni should only be visible to students of the same college
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS requires_college_match BOOLEAN DEFAULT true;

-- Add approved_at timestamp to track when job was approved
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Create a function to check if a user can view a job based on institution
CREATE OR REPLACE FUNCTION can_view_job(job_row jobs, viewer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  viewer_college_id UUID;
  viewer_role TEXT;
  job_poster_role TEXT;
BEGIN
  -- Get viewer's college_id and role
  SELECT college_id, role INTO viewer_college_id, viewer_role
  FROM profiles
  WHERE user_id = viewer_id;
  
  -- Admins can view all jobs
  IF viewer_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- College reps can view jobs from their college (for approval)
  IF viewer_role = 'college' THEN
    RETURN job_row.college_id = viewer_college_id OR job_row.college_id IS NULL;
  END IF;
  
  -- Alumni can view their own jobs
  IF viewer_role = 'alumni' AND job_row.posted_by = viewer_id THEN
    RETURN true;
  END IF;
  
  -- For students: only show approved jobs
  IF job_row.status != 'approved' THEN
    RETURN false;
  END IF;
  
  -- If job has no college restriction, show to all
  IF job_row.college_id IS NULL OR job_row.requires_college_match = false THEN
    RETURN true;
  END IF;
  
  -- If job has college restriction, only show to students from that college
  RETURN job_row.college_id = viewer_college_id;
END;
$$;

-- Create a function to get alumni pending verification for a college
CREATE OR REPLACE FUNCTION get_pending_alumni_for_college(p_college_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  alumni_startup_number TEXT,
  created_at TIMESTAMPTZ,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email,
    p.alumni_startup_number,
    p.created_at,
    p.avatar_url
  FROM profiles p
  WHERE p.college_id = p_college_id
    AND p.role = 'alumni'
    AND (p.alumni_verification_status IS NULL OR p.alumni_verification_status = 'pending')
  ORDER BY p.created_at DESC;
END;
$$;

-- Create a function to approve an alumni/startup
CREATE OR REPLACE FUNCTION approve_alumni(
  p_user_id UUID,
  p_approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  approver_role TEXT;
  approver_college_id UUID;
  alumni_college_id UUID;
BEGIN
  -- Get approver's role and college
  SELECT role, college_id INTO approver_role, approver_college_id
  FROM profiles
  WHERE user_id = p_approver_id;
  
  -- Get alumni's college
  SELECT college_id INTO alumni_college_id
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Check if approver has permission
  IF approver_role = 'admin' THEN
    -- Admin can approve anyone
    NULL;
  ELSIF approver_role = 'college' THEN
    -- College rep can only approve alumni from their college
    IF approver_college_id != alumni_college_id THEN
      RAISE EXCEPTION 'You can only approve alumni from your own college';
    END IF;
  ELSE
    RAISE EXCEPTION 'You do not have permission to approve alumni';
  END IF;
  
  -- Approve the alumni
  UPDATE profiles
  SET 
    alumni_verification_status = 'approved',
    alumni_verified_at = NOW(),
    alumni_verified_by = p_approver_id
  WHERE user_id = p_user_id
    AND role = 'alumni';
  
  RETURN true;
END;
$$;

-- Create a function to reject an alumni/startup
CREATE OR REPLACE FUNCTION reject_alumni(
  p_user_id UUID,
  p_approver_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  approver_role TEXT;
  approver_college_id UUID;
  alumni_college_id UUID;
BEGIN
  -- Get approver's role and college
  SELECT role, college_id INTO approver_role, approver_college_id
  FROM profiles
  WHERE user_id = p_approver_id;
  
  -- Get alumni's college
  SELECT college_id INTO alumni_college_id
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Check if approver has permission
  IF approver_role = 'admin' THEN
    NULL;
  ELSIF approver_role = 'college' THEN
    IF approver_college_id != alumni_college_id THEN
      RAISE EXCEPTION 'You can only reject alumni from your own college';
    END IF;
  ELSE
    RAISE EXCEPTION 'You do not have permission to reject alumni';
  END IF;
  
  -- Reject the alumni
  UPDATE profiles
  SET 
    alumni_verification_status = 'rejected',
    alumni_verified_at = NOW(),
    alumni_verified_by = p_approver_id,
    alumni_rejection_reason = p_reason
  WHERE user_id = p_user_id
    AND role = 'alumni';
  
  RETURN true;
END;
$$;

-- Create a function to approve a job with proper tracking
CREATE OR REPLACE FUNCTION approve_job(
  p_job_id UUID,
  p_approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  approver_role TEXT;
  approver_college_id UUID;
  job_college_id UUID;
  job_poster_status TEXT;
  job_poster_id UUID;
BEGIN
  -- Get approver's role and college
  SELECT role, college_id INTO approver_role, approver_college_id
  FROM profiles
  WHERE user_id = p_approver_id;
  
  -- Get job's college and poster
  SELECT college_id, posted_by INTO job_college_id, job_poster_id
  FROM jobs
  WHERE id = p_job_id;
  
  -- Check if job poster is a verified alumni (if alumni role)
  SELECT alumni_verification_status INTO job_poster_status
  FROM profiles
  WHERE user_id = job_poster_id AND role = 'alumni';
  
  -- Warn if alumni is not verified (but still allow job approval for flexibility)
  -- The UI should show this warning
  
  -- Check if approver has permission
  IF approver_role = 'admin' THEN
    NULL;
  ELSIF approver_role = 'college' THEN
    IF job_college_id IS NOT NULL AND approver_college_id != job_college_id THEN
      RAISE EXCEPTION 'You can only approve jobs for your own college';
    END IF;
  ELSE
    RAISE EXCEPTION 'You do not have permission to approve jobs';
  END IF;
  
  -- Approve the job
  UPDATE jobs
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_approver_id
  WHERE id = p_job_id;
  
  RETURN true;
END;
$$;

-- Update RLS policies for jobs to respect college-based visibility for students
-- First, drop existing select policy if it exists
DROP POLICY IF EXISTS "Everyone can view approved jobs" ON jobs;
DROP POLICY IF EXISTS "Students can view college jobs" ON jobs;
DROP POLICY IF EXISTS "Users can view jobs based on role" ON jobs;
DROP POLICY IF EXISTS "Users can view jobs based on role and college" ON jobs;

-- Create new comprehensive job visibility policy
CREATE POLICY "Users can view jobs based on role and college" ON jobs
FOR SELECT USING (
  -- Admins can view all jobs
  public.has_role(auth.uid(), 'admin')
  OR
  -- Job poster can always view their own jobs
  posted_by = auth.uid()
  OR
  -- College reps can view jobs from their college (all statuses for approval)
  (
    public.has_role(auth.uid(), 'college')
    AND (
      college_id = (SELECT college_id FROM profiles WHERE user_id = auth.uid())
      OR college_id IS NULL
    )
  )
  OR
  -- Alumni can view approved jobs and their pending jobs
  (
    public.has_role(auth.uid(), 'alumni')
    AND (
      status = 'approved'
      OR posted_by = auth.uid()
    )
  )
  OR
  -- Students can only view approved jobs from their college or open jobs
  (
    public.has_role(auth.uid(), 'student')
    AND status = 'approved'
    AND (
      college_id IS NULL
      OR requires_college_match = false
      OR college_id = (SELECT college_id FROM profiles WHERE user_id = auth.uid())
    )
  )
);

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION get_pending_alumni_for_college(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_alumni(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_alumni(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_job(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_job(jobs, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN profiles.alumni_verification_status IS 'Verification status for alumni/startup users - pending, approved, or rejected';
COMMENT ON COLUMN profiles.alumni_verified_at IS 'Timestamp when alumni was verified';
COMMENT ON COLUMN profiles.alumni_verified_by IS 'User ID of the college rep or admin who verified this alumni';
COMMENT ON COLUMN profiles.alumni_rejection_reason IS 'Reason for rejection if alumni verification was rejected';
COMMENT ON COLUMN jobs.requires_college_match IS 'If true, only students from the same college can view this job';
COMMENT ON COLUMN jobs.approved_at IS 'Timestamp when job was approved';
COMMENT ON COLUMN jobs.approved_by IS 'User ID of who approved this job';

