# Email Confirmation Template Setup Guide

## Overview
This guide will help you set up a professional email confirmation template for Alignr in your Supabase dashboard.

## Files Included
- `confirm-signup.html` - Full-featured version with gradients and advanced styling
- `confirm-signup-simple.html` - Simplified version for better email client compatibility

## Setup Instructions

### Step 1: Access Supabase Email Templates
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Click on **"Confirm sign up"** template

### Step 2: Update the Subject Line
In the **Subject** field, enter:
```
Confirm Your Signup - Alignr
```

### Step 3: Update the Email Body
1. Click on the **"Source"** tab in the email body editor
2. Copy the entire contents from `confirm-signup.html` or `confirm-signup-simple.html`
3. Paste it into the Supabase email template editor
4. Click **"Save changes"**

### Step 4: Configure Redirect URL (Important!)
To ensure users are redirected to `alignr.cuephoria.in` after confirmation:

1. Go to **Authentication** → **URL Configuration**
2. Set the **Site URL** to: `https://alignr.cuephoria.in`
3. Add to **Redirect URLs**:
   - `https://alignr.cuephoria.in/auth`
   - `https://alignr.cuephoria.in/auth/callback`
   - `https://alignr.cuephoria.in/*` (wildcard for all routes)

**Note:** The `{{ .ConfirmationURL }}` variable in the email template will automatically include the redirect to your Site URL. After clicking the confirmation link, users will be redirected to `https://alignr.cuephoria.in/auth` to sign in.

### Step 5: Test the Email
1. Sign up with a test email address
2. Check your inbox for the confirmation email
3. Click the confirmation link
4. Verify it redirects to the sign-in page (`/auth`)

## Template Features

### ✅ Included Elements
- **Logo**: Alignr logo prominently displayed in header
- **Brand Colors**: Uses your brand colors (#0066FF, #06B6D4, #CAFF00)
- **Professional Design**: Modern, clean layout with proper spacing
- **Responsive**: Works on desktop and mobile devices
- **CTA Button**: Clear call-to-action button for email confirmation
- **Alternative Link**: Fallback text link for accessibility
- **Info Section**: Helpful information about what's next
- **Footer**: Professional footer with branding and contact info

### 🎨 Design Highlights
- Gradient header matching your brand
- Neon green CTA button (#CAFF00)
- Clean typography and spacing
- Professional color scheme
- Mobile-responsive layout

## Template Variables Used

The template uses Supabase's built-in variables:
- `{{ .ConfirmationURL }}` - The confirmation link that users click
- `{{ .Email }}` - User's email address (available but not used in this template)
- `{{ .SiteURL }}` - Your site URL (available but not used)

## Customization

### Change Logo
Replace `https://iili.io/fqdZCfn.png` with your logo URL if needed.

### Change Colors
- Primary Blue: `#0066FF`
- Cyan: `#06B6D4`
- Neon Green: `#CAFF00`
- Dark Green: `#B8E600`

### Change Redirect Behavior
The `{{ .ConfirmationURL }}` automatically includes the redirect URL configured in Supabase. The confirmation link will redirect users to your **Site URL** (configured in Step 4). 

**For `alignr.cuephoria.in`:** 
- Set Site URL to `https://alignr.cuephoria.in`
- Users will be redirected to `https://alignr.cuephoria.in/auth` after clicking the confirmation link
- Make sure redirect URLs include `https://alignr.cuephoria.in/auth` and `https://alignr.cuephoria.in/auth/callback`

## Email Client Compatibility

- **Full Version** (`confirm-signup.html`): Best for modern email clients (Gmail, Outlook 365, Apple Mail)
- **Simple Version** (`confirm-signup-simple.html`): Better compatibility with older email clients (Outlook 2010-2016, Yahoo Mail)

## Troubleshooting

### Email not sending?
- Check Supabase project settings
- Verify SMTP configuration (if using custom SMTP)
- Check spam folder

### Redirect not working?
- Verify redirect URLs in Supabase dashboard include `https://alignr.cuephoria.in/auth` and `https://alignr.cuephoria.in/auth/callback`
- Ensure Site URL is set to `https://alignr.cuephoria.in`
- Check that your frontend handles the `/auth` route correctly
- The confirmation link should redirect to `https://alignr.cuephoria.in/auth` after email confirmation

### Logo not showing?
- Verify the logo URL is accessible
- Some email clients block external images by default
- Consider hosting logo on your own domain

## Next Steps

After setting up the confirmation email, consider:
1. Setting up password reset email template
2. Setting up magic link email template
3. Customizing other email templates (invite, change email, etc.)

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-email-templates
- Contact: support@alignr.com

