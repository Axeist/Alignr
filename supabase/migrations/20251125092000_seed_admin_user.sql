-- Seed admin user
-- This creates the admin user with hardcoded credentials
-- Email: ranjithkirloskar@gmail.com
-- Password: Sisacropole2198$

-- Note: In production, you should use Supabase Auth API or a secure seed script
-- This migration uses a function that will be called manually or via a script

CREATE OR REPLACE FUNCTION public.seed_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'ranjithkirloskar@gmail.com';

  -- If admin user doesn't exist, we need to create it via Supabase Auth API
  -- This function is a placeholder - actual user creation must be done via:
  -- 1. Supabase Dashboard Auth section, OR
  -- 2. Supabase Auth API (signUp), OR
  -- 3. A seed script that calls the Auth API
  
  -- For now, if the user exists, ensure they have admin role
  IF admin_user_id IS NOT NULL THEN
    -- Insert admin role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Update profile if exists
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (admin_user_id, 'Admin User', 'ranjithkirloskar@gmail.com', 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      full_name = 'Admin User',
      email = 'ranjithkirloskar@gmail.com',
      role = 'admin';
  END IF;
END;
$$;

-- Note: To actually create the user, you need to:
-- 1. Use Supabase Dashboard > Authentication > Users > Add User
-- 2. Or use a script that calls supabase.auth.admin.createUser()
-- 3. Then run: SELECT public.seed_admin_user();

