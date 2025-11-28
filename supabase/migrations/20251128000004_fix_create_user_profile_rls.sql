-- Fix create_user_profile function to use correct app_role type and fix RLS issues
-- This migration corrects the type mismatch error and ensures proper RLS handling

-- Drop the existing function with all possible signatures
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, public.app_role);

-- Create the corrected function with proper type and schema prefixes
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_role public.app_role,
  p_college_id UUID DEFAULT NULL,
  p_alumni_startup_number TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles with proper type casting
  INSERT INTO public.profiles (user_id, full_name, email, role, college_id, alumni_startup_number)
  VALUES (p_user_id, p_full_name, p_email, p_role, p_college_id, p_alumni_startup_number)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    college_id = COALESCE(EXCLUDED.college_id, public.profiles.college_id),
    alumni_startup_number = COALESCE(EXCLUDED.alumni_startup_number, public.profiles.alumni_startup_number),
    updated_at = NOW();

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
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
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID, TEXT) TO authenticated;

-- Also grant to anon for signup (user isn't authenticated yet during signup)
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, public.app_role, UUID, TEXT) TO anon;

-- Ensure RLS policies allow profile insertion during signup
-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Ensure user_roles INSERT policy exists
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role" ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

