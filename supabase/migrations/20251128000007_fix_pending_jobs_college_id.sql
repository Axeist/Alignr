-- Fix pending jobs with NULL college_id
-- This migration ensures that jobs posted by alumni always have a college_id
-- so they appear in the college approval page

-- First, update any existing pending jobs with NULL college_id
-- Set college_id from the poster's profile
UPDATE jobs j
SET college_id = p.college_id
FROM profiles p
WHERE j.college_id IS NULL
  AND j.posted_by = p.user_id
  AND j.status = 'pending'
  AND p.college_id IS NOT NULL;

-- Also update any jobs where college_id doesn't match the poster's college_id
-- This ensures consistency - jobs should be tied to the alumni's college for approval
UPDATE jobs j
SET college_id = p.college_id
FROM profiles p
WHERE j.posted_by = p.user_id
  AND j.status = 'pending'
  AND p.college_id IS NOT NULL
  AND j.college_id != p.college_id
  AND p.role = 'alumni';

-- Note: The RLS policy "Users can view jobs based on role and college" from migration
-- 20251128000005_alumni_verification_system.sql already allows college reps to view
-- jobs from their college (including NULL college_id). The policy "College admins can 
-- view pending jobs" from migration 20251128000002_fix_college_view_pending_jobs.sql
-- is more specific for pending jobs. Both policies work together (OR logic).
-- 
-- The main fix is ensuring jobs have a college_id set, which is done above.

-- Add a comment explaining the fix
COMMENT ON COLUMN jobs.college_id IS 'College ID for the job. For alumni-posted jobs, this should match the alumni profile college_id to appear in college approval page.';

