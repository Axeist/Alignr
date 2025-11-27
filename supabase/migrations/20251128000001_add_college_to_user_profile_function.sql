-- Add college_id parameter to create_user_profile function
-- This ensures college is saved atomically during signup

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, public.app_role);

-- Create the updated function with college_id parameter
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_role public.app_role,
  p_college_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with college_id
  INSERT INTO public.profiles (user_id, full_name, email, role, college_id)
  VALUES (p_user_id, p_full_name, p_email, p_role, p_college_id)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = p_full_name,
    email = p_email,
    role = p_role,
    college_id = COALESCE(p_college_id, public.profiles.college_id);

  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- For college role, update the college's admin_id
  IF p_role = 'college' AND p_college_id IS NOT NULL THEN
    UPDATE public.colleges
    SET admin_id = p_user_id
    WHERE id = p_college_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID) TO authenticated;

-- Also grant to anon for signup (user isn't authenticated yet during signup)
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID) TO anon;

