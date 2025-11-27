-- Simple script to fix college RLS policies
-- This can be run directly in Supabase SQL Editor if migration fails

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create colleges" ON public.colleges;
DROP POLICY IF EXISTS "Admins can manage colleges" ON public.colleges;

-- Recreate the policies
CREATE POLICY "Authenticated users can create colleges" ON public.colleges 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage colleges" ON public.colleges 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create the function if it doesn't exist
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


