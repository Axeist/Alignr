-- Job Approval System - College Match Logic
-- This migration updates the job approval system to ensure that jobs posted by alumni
-- can only be approved by the college rep of that alumni's college (same logic as alumni verification)

-- Update approve_job function to check that job poster (alumni) is from same college as approver
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
  job_poster_id UUID;
  job_poster_college_id UUID;
  job_poster_role TEXT;
BEGIN
  -- Get approver's role and college
  SELECT role, college_id INTO approver_role, approver_college_id
  FROM profiles
  WHERE user_id = p_approver_id;
  
  -- Get job poster's ID
  SELECT posted_by INTO job_poster_id
  FROM jobs
  WHERE id = p_job_id;
  
  -- Get job poster's college and role
  SELECT college_id, role INTO job_poster_college_id, job_poster_role
  FROM profiles
  WHERE user_id = job_poster_id;
  
  -- Check if approver has permission
  IF approver_role = 'admin' THEN
    -- Admin can approve any job
    NULL;
  ELSIF approver_role = 'college' THEN
    -- College rep can only approve jobs from alumni of their college
    IF job_poster_role != 'alumni' THEN
      RAISE EXCEPTION 'Only jobs posted by alumni can be approved through this system';
    END IF;
    
    IF approver_college_id IS NULL THEN
      RAISE EXCEPTION 'College rep must be associated with a college';
    END IF;
    
    IF job_poster_college_id IS NULL THEN
      RAISE EXCEPTION 'Job poster must be associated with a college';
    END IF;
    
    IF approver_college_id != job_poster_college_id THEN
      RAISE EXCEPTION 'You can only approve jobs from alumni of your own college';
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

-- Create a function to reject a job with proper tracking
CREATE OR REPLACE FUNCTION reject_job(
  p_job_id UUID,
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
  job_poster_id UUID;
  job_poster_college_id UUID;
  job_poster_role TEXT;
BEGIN
  -- Get approver's role and college
  SELECT role, college_id INTO approver_role, approver_college_id
  FROM profiles
  WHERE user_id = p_approver_id;
  
  -- Get job poster's ID
  SELECT posted_by INTO job_poster_id
  FROM jobs
  WHERE id = p_job_id;
  
  -- Get job poster's college and role
  SELECT college_id, role INTO job_poster_college_id, job_poster_role
  FROM profiles
  WHERE user_id = job_poster_id;
  
  -- Check if approver has permission
  IF approver_role = 'admin' THEN
    -- Admin can reject any job
    NULL;
  ELSIF approver_role = 'college' THEN
    -- College rep can only reject jobs from alumni of their college
    IF job_poster_role != 'alumni' THEN
      RAISE EXCEPTION 'Only jobs posted by alumni can be rejected through this system';
    END IF;
    
    IF approver_college_id IS NULL THEN
      RAISE EXCEPTION 'College rep must be associated with a college';
    END IF;
    
    IF job_poster_college_id IS NULL THEN
      RAISE EXCEPTION 'Job poster must be associated with a college';
    END IF;
    
    IF approver_college_id != job_poster_college_id THEN
      RAISE EXCEPTION 'You can only reject jobs from alumni of your own college';
    END IF;
  ELSE
    RAISE EXCEPTION 'You do not have permission to reject jobs';
  END IF;
  
  -- Reject the job
  UPDATE jobs
  SET 
    status = 'rejected',
    approved_at = NOW(),
    approved_by = p_approver_id
  WHERE id = p_job_id;
  
  RETURN true;
END;
$$;

-- Create a function to get pending jobs for a college
-- This function returns jobs posted by alumni of the specified college
CREATE OR REPLACE FUNCTION get_pending_jobs_for_college(p_college_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  description TEXT,
  requirements TEXT,
  location TEXT,
  job_type TEXT,
  experience_level TEXT,
  salary_range TEXT,
  status TEXT,
  posted_by UUID,
  college_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  poster_full_name TEXT,
  poster_email TEXT,
  poster_alumni_status TEXT,
  poster_alumni_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.company_name,
    j.description,
    j.requirements,
    j.location,
    j.job_type,
    j.experience_level,
    j.salary_range,
    j.status::TEXT,
    j.posted_by,
    j.college_id,
    j.created_at,
    j.updated_at,
    p.full_name AS poster_full_name,
    p.email AS poster_email,
    p.alumni_verification_status AS poster_alumni_status,
    p.alumni_startup_number AS poster_alumni_number
  FROM jobs j
  INNER JOIN profiles p ON j.posted_by = p.user_id
  WHERE p.college_id = p_college_id
    AND p.role = 'alumni'
    AND j.status = 'pending'
  ORDER BY j.created_at DESC;
END;
$$;

-- Grant execute permissions on new/updated functions
GRANT EXECUTE ON FUNCTION approve_job(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_job(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_jobs_for_college(UUID) TO authenticated;

-- Create a function to get all jobs for a college (pending, approved, rejected)
-- This function returns all jobs posted by alumni of the specified college
CREATE OR REPLACE FUNCTION get_all_jobs_for_college(p_college_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  description TEXT,
  requirements TEXT,
  location TEXT,
  job_type TEXT,
  experience_level TEXT,
  salary_range TEXT,
  status TEXT,
  posted_by UUID,
  college_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  poster_full_name TEXT,
  poster_email TEXT,
  poster_alumni_status TEXT,
  poster_alumni_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.company_name,
    j.description,
    j.requirements,
    j.location,
    j.job_type,
    j.experience_level,
    j.salary_range,
    j.status::TEXT,
    j.posted_by,
    j.college_id,
    j.created_at,
    j.updated_at,
    j.approved_at,
    j.approved_by,
    p.full_name AS poster_full_name,
    p.email AS poster_email,
    p.alumni_verification_status AS poster_alumni_status,
    p.alumni_startup_number AS poster_alumni_number
  FROM jobs j
  INNER JOIN profiles p ON j.posted_by = p.user_id
  WHERE p.college_id = p_college_id
    AND p.role = 'alumni'
  ORDER BY j.created_at DESC;
END;
$$;

-- Grant execute permissions on new/updated functions
GRANT EXECUTE ON FUNCTION get_all_jobs_for_college(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION approve_job(UUID, UUID) IS 'Approves a job posting. College reps can only approve jobs from alumni of their own college, similar to alumni verification.';
COMMENT ON FUNCTION reject_job(UUID, UUID, TEXT) IS 'Rejects a job posting. College reps can only reject jobs from alumni of their own college, similar to alumni verification.';
COMMENT ON FUNCTION get_pending_jobs_for_college(UUID) IS 'Returns pending job postings from alumni of the specified college, ensuring college-specific approval workflow.';
COMMENT ON FUNCTION get_all_jobs_for_college(UUID) IS 'Returns all job postings (pending, approved, rejected) from alumni of the specified college.';

