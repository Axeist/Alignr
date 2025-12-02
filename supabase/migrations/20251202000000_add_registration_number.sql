-- Add registration_number column to profiles table
-- This field stores the Registration Number for student users

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS registration_number TEXT;

-- Add a comment describing the column
COMMENT ON COLUMN profiles.registration_number IS 'Registration Number for student users';

-- Drop the existing function with all possible signatures
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID, TEXT, TEXT);

-- Update the create_user_profile function to include registration_number parameter
-- This is the main function that the frontend calls
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_role TEXT,
  p_college_id UUID DEFAULT NULL,
  p_alumni_startup_number TEXT DEFAULT NULL,
  p_registration_number TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  -- Cast the text role to app_role enum
  v_role := p_role::public.app_role;
  
  -- Insert into profiles with alumni_verification_status and registration_number
  -- Set to 'pending' for alumni role, NULL for others
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    email, 
    role, 
    college_id, 
    alumni_startup_number,
    registration_number,
    alumni_verification_status
  )
  VALUES (
    p_user_id, 
    p_full_name, 
    p_email, 
    v_role, 
    p_college_id, 
    p_alumni_startup_number,
    p_registration_number,
    CASE WHEN p_role = 'alumni' THEN 'pending' ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    college_id = COALESCE(EXCLUDED.college_id, public.profiles.college_id),
    alumni_startup_number = COALESCE(EXCLUDED.alumni_startup_number, public.profiles.alumni_startup_number),
    registration_number = COALESCE(EXCLUDED.registration_number, public.profiles.registration_number),
    alumni_verification_status = CASE 
      WHEN p_role = 'alumni' AND public.profiles.alumni_verification_status IS NULL 
      THEN 'pending' 
      ELSE public.profiles.alumni_verification_status 
    END,
    updated_at = NOW();

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If role is 'college' and college_id is provided, update the college's admin_id
  IF p_role = 'college' AND p_college_id IS NOT NULL THEN
    UPDATE public.colleges
    SET admin_id = p_user_id
    WHERE id = p_college_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO authenticated;

-- Also grant to anon for signup (user isn't authenticated yet during signup)
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO anon;

-- Also grant to service_role for edge functions
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO service_role;

