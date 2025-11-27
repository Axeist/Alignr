# Redirect Configuration for alignr.cuephoria.in

## ✅ Yes, it will redirect to alignr.cuephoria.in!

After users click the confirmation link in the email, they will be redirected to **`https://alignr.cuephoria.in/auth`** to sign in.

## How It Works

1. **User clicks confirmation link** in the email
2. **Supabase processes** the confirmation token
3. **User is redirected** to your configured Site URL + `/auth` route
4. **User lands on** `https://alignr.cuephoria.in/auth` to sign in

## Required Supabase Configuration

### Step 1: Set Site URL
Go to **Authentication** → **URL Configuration** → **Site URL**
```
https://alignr.cuephoria.in
```

### Step 2: Add Redirect URLs
In the same section, add these to **Redirect URLs**:
```
https://alignr.cuephoria.in/auth
https://alignr.cuephoria.in/auth/callback
https://alignr.cuephoria.in/*
```

### Step 3: Save
Click **Save** to apply the changes.

## How the Email Template Works

The email template uses Supabase's `{{ .ConfirmationURL }}` variable, which automatically:
- Includes your Site URL (`https://alignr.cuephoria.in`)
- Adds the confirmation token
- Appends the redirect path (`/auth`)

So the final confirmation URL will look like:
```
https://alignr.cuephoria.in/auth?token=xxx&type=signup&redirect_to=https://alignr.cuephoria.in/auth
```

## Flow Diagram

```
User receives email
    ↓
Clicks "Confirm Email Address" button
    ↓
Supabase validates token
    ↓
Redirects to: https://alignr.cuephoria.in/auth
    ↓
User signs in
    ↓
Redirected to their dashboard
```

## Testing

1. **Sign up** with a test email
2. **Check inbox** for confirmation email
3. **Click confirmation link**
4. **Verify** you're redirected to `https://alignr.cuephoria.in/auth`
5. **Sign in** with your credentials

## Troubleshooting

### Not redirecting to alignr.cuephoria.in?
- ✅ Check Site URL is set to `https://alignr.cuephoria.in`
- ✅ Verify redirect URLs include `https://alignr.cuephoria.in/auth`
- ✅ Make sure you're using `https://` (not `http://`)
- ✅ Clear browser cache and try again

### Redirecting to wrong domain?
- Check if Site URL has trailing slash (should be `https://alignr.cuephoria.in` not `https://alignr.cuephoria.in/`)
- Verify no old redirect URLs are still configured
- Check Supabase project settings for any domain restrictions

## Important Notes

- The redirect happens **automatically** after email confirmation
- Users don't need to manually navigate to the sign-in page
- The confirmation link expires in 24 hours (Supabase default)
- The redirect URL is built into the `{{ .ConfirmationURL }}` variable

## Summary

✅ **Yes, users will be redirected to `https://alignr.cuephoria.in/auth` after confirming their email**, as long as you configure the Site URL and Redirect URLs in Supabase as shown above.

