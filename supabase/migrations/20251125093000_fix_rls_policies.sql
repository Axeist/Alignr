-- Fix RLS policies for user signup
-- This allows users to insert their own role during registration

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Allow users to insert their own role
CREATE POLICY "Users can insert own role" ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own role (if needed)
CREATE POLICY "Users can update own role" ON public.user_roles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Admins can manage all roles (SELECT, UPDATE, DELETE)
CREATE POLICY "Admins can view all roles" ON public.user_roles 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can update all roles" ON public.user_roles 
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all roles" ON public.user_roles 
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- Also ensure profiles table allows inserts during signup
-- The existing policy should work, but let's make sure it's correct
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create a helper function to create user profile and role
-- This can be called from the frontend or via a trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used by a trigger, but we'll call it manually from frontend
  -- For now, just ensure the policies are correct
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create a function that can be called to set up user profile
-- This bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (p_user_id, p_full_name, p_email, p_role)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = p_full_name,
    email = p_email,
    role = p_role;

  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, public.app_role) TO authenticated;
