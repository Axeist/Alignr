# Admin User Setup Guide

## Creating the Admin User

The admin user credentials are:
- **Email**: `ranjithkirloskar@gmail.com`
- **Password**: `Sisacropole2198$`

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User** or **Invite User**
4. Enter the following:
   - Email: `ranjithkirloskar@gmail.com`
   - Password: `Sisacropole2198$`
   - Auto Confirm User: ✅ (checked)
5. Click **Create User**

6. After the user is created, run this SQL in the SQL Editor:

```sql
-- Get the user ID from auth.users
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find the admin user
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'ranjithkirloskar@gmail.com';

  IF admin_user_id IS NOT NULL THEN
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (admin_user_id, 'Admin User', 'ranjithkirloskar@gmail.com', 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      full_name = 'Admin User',
      email = 'ranjithkirloskar@gmail.com',
      role = 'admin';

    -- Create role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin user configured successfully!';
  ELSE
    RAISE EXCEPTION 'Admin user not found in auth.users';
  END IF;
END $$;
```

### Method 2: Using the Seed Script

1. Install dependencies:
```bash
npm install @supabase/supabase-js dotenv
```

2. Create a `.env` file in the project root:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Run the seed script:
```bash
node scripts/seed-admin.js
```

**Note**: The seed script requires Supabase Admin API access. Make sure you have the `SUPABASE_SERVICE_ROLE_KEY` (not the anon key).

### Method 3: Manual SQL (If user already exists)

If the user already exists in `auth.users`, just run:

```sql
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users
INSERT INTO public.profiles (user_id, full_name, email, role)
VALUES ('USER_ID_HERE', 'Admin User', 'ranjithkirloskar@gmail.com', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET 
  full_name = 'Admin User',
  email = 'ranjithkirloskar@gmail.com',
  role = 'admin';

INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

## Verifying Admin Access

1. Log out if you're currently logged in
2. Go to `/auth`
3. Sign in with:
   - Email: `ranjithkirloskar@gmail.com`
   - Password: `Sisacropole2198$`
4. You should be redirected to `/admin/dashboard`

## Troubleshooting

### User can't log in
- Check if the user exists in `auth.users` table
- Verify the email is correct: `ranjithkirloskar@gmail.com`
- Check if email confirmation is required (disable it for admin)

### User logs in but can't access admin routes
- Verify the `user_roles` table has an entry with `role = 'admin'`
- Check the `profiles` table has `role = 'admin'`
- Clear browser cache and try again

### Role not being fetched
- Check browser console for errors
- Verify RLS policies allow reading `user_roles` table
- Check network tab for failed API calls

## Security Notes

⚠️ **Important**: 
- Change the admin password after first login in production
- Never commit the service role key to version control
- Use environment variables for all sensitive data
- Consider implementing 2FA for admin accounts

