-- Fix RLS policies to allow college selection for students
-- Allow authenticated users to insert colleges (since we validate college names from our predefined list)

-- Drop existing policies if they exist (to allow clean recreation)
DROP POLICY IF EXISTS "Authenticated users can create colleges" ON public.colleges;
DROP POLICY IF EXISTS "Admins can manage colleges" ON public.colleges;

-- Allow everyone to view colleges (policy should already exist, but ensure it's there)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'colleges' 
    AND policyname = 'Everyone can view colleges'
  ) THEN
    CREATE POLICY "Everyone can view colleges" ON public.colleges 
    FOR SELECT USING (true);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists, that's fine
END $$;

-- Allow authenticated users to insert colleges
CREATE POLICY "Authenticated users can create colleges" ON public.colleges 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Admins can still manage colleges
CREATE POLICY "Admins can manage colleges" ON public.colleges 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- College admins can update own college (policy should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'colleges' 
    AND policyname = 'College admins can update own college'
  ) THEN
    CREATE POLICY "College admins can update own college" ON public.colleges 
    FOR UPDATE 
    USING (auth.uid() = admin_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists, that's fine
END $$;

-- Create a function to find or create a college (for better error handling)
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

-- Add comment
COMMENT ON FUNCTION public.find_or_create_college IS 
'Finds an existing college by name or creates a new one. Can be called by any authenticated user.';

