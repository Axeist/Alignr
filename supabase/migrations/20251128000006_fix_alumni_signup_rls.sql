-- Fix RLS issue for alumni signup
-- The create_user_profile function needs to include alumni_verification_status
-- Also create a TEXT version for frontend compatibility

-- Drop the existing function with all possible signatures
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, public.app_role);

-- Create the function with TEXT role parameter (for frontend compatibility)
-- This is the main function that the frontend calls
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_role TEXT,
  p_college_id UUID DEFAULT NULL,
  p_alumni_startup_number TEXT DEFAULT NULL
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
  
  -- Insert into profiles with alumni_verification_status
  -- Set to 'pending' for alumni role, NULL for others
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    email, 
    role, 
    college_id, 
    alumni_startup_number,
    alumni_verification_status
  )
  VALUES (
    p_user_id, 
    p_full_name, 
    p_email, 
    v_role, 
    p_college_id, 
    p_alumni_startup_number,
    CASE WHEN p_role = 'alumni' THEN 'pending' ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    college_id = COALESCE(EXCLUDED.college_id, public.profiles.college_id),
    alumni_startup_number = COALESCE(EXCLUDED.alumni_startup_number, public.profiles.alumni_startup_number),
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
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;

-- Also grant to anon for signup (user isn't authenticated yet during signup)
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT) TO anon;

-- Also grant to service_role for edge functions
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT) TO service_role;

-- Ensure RLS policies allow profile insertion/update for authenticated users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure user_roles INSERT policy exists
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role" ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

