-- Ensure college uniqueness constraint for college role users
-- Only one user with role 'college' can be associated with each college

-- Create a unique index on college_id for profiles with role 'college'
-- This ensures that each college can only have one representative
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_college_role 
ON public.profiles(college_id) 
WHERE role = 'college' AND college_id IS NOT NULL;

-- Add a check constraint to prevent multiple college role users for the same college
-- This is enforced at the database level
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_college_representative'
  ) THEN
    -- Create a partial unique index constraint
    -- This will prevent multiple users with role 'college' from having the same college_id
    EXECUTE '
      CREATE UNIQUE INDEX unique_college_representative 
      ON public.profiles(college_id) 
      WHERE role = ''college'' AND college_id IS NOT NULL
    ';
  END IF;
END $$;

-- Add comment explaining the constraint
COMMENT ON INDEX IF EXISTS unique_college_representative IS 
'Ensures that each college can only have one user with the role "college" representing it';

