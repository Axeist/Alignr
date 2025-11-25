-- Migration to add college selection tracking and enforce uniqueness
-- This ensures:
-- 1. Only 1 college profile per college (1:1 relationship)
-- 2. Track if college has been set (can only be changed once)

-- Add column to track if college was manually set/changed
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS college_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS college_changed_count INTEGER DEFAULT 0;

-- Create unique constraint: Only one college profile per college
-- This ensures 1 profile = 1 college for college role users
CREATE UNIQUE INDEX IF NOT EXISTS idx_college_profile_unique 
ON public.profiles(college_id) 
WHERE role = 'college' AND college_id IS NOT NULL;

-- Create function to check if college can be changed
CREATE OR REPLACE FUNCTION public.can_change_college(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_college_changed_count INTEGER;
  v_role TEXT;
BEGIN
  SELECT college_changed_count, role INTO v_college_changed_count, v_role
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- If profile doesn't exist, allow setting college
  IF v_college_changed_count IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Allow change if never set (count = 0) or if it's the first change (count = 0)
  RETURN v_college_changed_count = 0;
END;
$$;

-- Create function to update college with change tracking
CREATE OR REPLACE FUNCTION public.update_profile_college(
  p_user_id UUID,
  p_college_id UUID,
  p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_college_id UUID;
  v_current_count INTEGER;
  v_can_change BOOLEAN;
BEGIN
  -- Get current college and change count
  SELECT college_id, college_changed_count INTO v_current_college_id, v_current_count
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- If college is already set and we're trying to change it
  IF v_current_college_id IS NOT NULL AND v_current_college_id != p_college_id THEN
    -- Check if we can change it
    IF v_current_count >= 1 THEN
      RAISE EXCEPTION 'College can only be changed once. Please contact admin for further changes.';
    END IF;
  END IF;
  
  -- For college role, check if another profile already has this college
  IF p_role = 'college' AND p_college_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE college_id = p_college_id 
      AND role = 'college' 
      AND user_id != p_user_id
    ) THEN
      RAISE EXCEPTION 'This college already has a representative. Only one profile can represent each college.';
    END IF;
  END IF;
  
  -- Update the profile
  UPDATE public.profiles
  SET 
    college_id = p_college_id,
    college_set_at = CASE 
      WHEN college_id IS NULL AND p_college_id IS NOT NULL THEN NOW()
      ELSE college_set_at
    END,
    college_changed_count = CASE
      WHEN college_id IS NULL AND p_college_id IS NOT NULL THEN 0
      WHEN college_id IS NOT NULL AND p_college_id != college_id THEN college_changed_count + 1
      ELSE college_changed_count
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.can_change_college(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_college(UUID, UUID, TEXT) TO authenticated;

