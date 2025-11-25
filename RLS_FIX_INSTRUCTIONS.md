# Fix for RLS Policy Error During Signup

## Problem
When trying to create a student (or any user), you get the error:
```
new row violates row-level security policy for table "profiles"
```

## Solution

### Option 1: Run the Migration (Recommended)

Run the new migration file that fixes the RLS policies:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in Supabase Dashboard > SQL Editor
```

The migration file is: `supabase/migrations/20251125093000_fix_rls_policies.sql`

### Option 2: Manual SQL Fix

Run this SQL in your Supabase Dashboard > SQL Editor:

```sql
-- Fix user_roles INSERT policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can insert own role" ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role" ON public.user_roles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can update all roles" ON public.user_roles 
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all roles" ON public.user_roles 
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure profiles INSERT policy is correct
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create helper function (optional but recommended)
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
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (p_user_id, p_full_name, p_email, p_role)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = p_full_name,
    email = p_email,
    role = p_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, public.app_role) TO authenticated;
```

## What Was Wrong?

The `user_roles` table only had:
- A SELECT policy for users to view their own roles
- An ALL policy for admins only

**Missing**: An INSERT policy allowing users to create their own role during signup!

## After Fixing

1. Clear your browser cache/localStorage
2. Try signing up again
3. The signup should now work correctly

## Verification

After running the fix, you can verify the policies exist:

```sql
-- Check user_roles policies
SELECT * FROM pg_policies WHERE tablename = 'user_roles';

-- Check profiles policies  
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

You should see:
- `Users can insert own role` policy on `user_roles`
- `Users can insert own profile` policy on `profiles`

