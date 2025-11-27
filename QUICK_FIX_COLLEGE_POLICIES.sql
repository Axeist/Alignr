-- Quick Fix: Run this in Supabase SQL Editor to fix college selection issue
-- Copy and paste the entire contents into Supabase Dashboard > SQL Editor > New Query

-- Step 1: Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated users can create colleges" ON public.colleges;

-- Step 2: Create the policy to allow authenticated users to create colleges
CREATE POLICY "Authenticated users can create colleges" ON public.colleges 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Step 3: Create or replace the helper function
CREATE OR REPLACE FUNCTION public.find_or_create_college(
  p_name TEXT,
  p_location TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  college_id UUID;
BEGIN
  -- First, try to find existing college by exact name match
  SELECT id INTO college_id
  FROM public.colleges
  WHERE LOWER(TRIM(name)) = LOWER(TRIM(p_name))
  LIMIT 1;

  -- If not found, create it
  IF college_id IS NULL THEN
    INSERT INTO public.colleges (name, location)
    VALUES (p_name, COALESCE(p_location, ''))
    RETURNING id INTO college_id;
  END IF;

  RETURN college_id;
END;
$$;

-- Verify the policy was created (optional check)
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'colleges' 
AND policyname = 'Authenticated users can create colleges';


