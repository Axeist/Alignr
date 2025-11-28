-- Add alumni_startup_number column to profiles table
-- This field stores the Alumni Enrollment Number or Startup Certificate Number for alumni users

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS alumni_startup_number TEXT;

-- Add a comment describing the column
COMMENT ON COLUMN profiles.alumni_startup_number IS 'Alumni Enrollment Number or Startup Certificate Number for alumni/startup users';

-- Update the create_user_profile function to include alumni_startup_number parameter
-- Also sets alumni_verification_status to 'pending' for alumni role
CREATE OR REPLACE FUNCTION create_user_profile(
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
AS $$
BEGIN
  -- Insert into profiles
  -- Set alumni_verification_status to 'pending' for alumni role
  INSERT INTO profiles (
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
    p_role, 
    p_college_id, 
    p_alumni_startup_number,
    CASE WHEN p_role = 'alumni' THEN 'pending' ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    college_id = COALESCE(EXCLUDED.college_id, profiles.college_id),
    alumni_startup_number = COALESCE(EXCLUDED.alumni_startup_number, profiles.alumni_startup_number),
    alumni_verification_status = CASE 
      WHEN EXCLUDED.role = 'alumni' AND profiles.alumni_verification_status IS NULL 
      THEN 'pending' 
      ELSE profiles.alumni_verification_status 
    END,
    updated_at = NOW();

  -- Insert into user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, p_role::app_role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role;

  -- If role is 'college' and college_id is provided, update the college's admin_id
  IF p_role = 'college' AND p_college_id IS NOT NULL THEN
    UPDATE colleges
    SET admin_id = p_user_id
    WHERE id = p_college_id;
  END IF;
END;
$$;



