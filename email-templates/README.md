# 📧 Alignr Email Confirmation Template

## ✅ Verified Information

### Subject Line
```
Confirm Your Signup - Alignr
```
*Copy this exactly into the Supabase Subject field*

### Logo URL
```
https://iili.io/fqdZCfn.png
```
✅ **Verified** - This logo URL is used consistently throughout the codebase:
- `src/pages/Auth.tsx`
- `src/pages/Index.tsx`
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/DashboardLayout.tsx`
- `BRANDING_UPDATES.md`

## 📁 Files Included

1. **`confirm-signup.html`** - Full-featured template (recommended)
2. **`confirm-signup-simple.html`** - Simplified version for better compatibility
3. **`SUBJECT_LINE.txt`** - Quick copy-paste for subject
4. **`QUICK_START.md`** - 3-step setup guide
5. **`EMAIL_TEMPLATE_SETUP.md`** - Detailed setup instructions

## 🚀 Quick Setup

1. **Copy** the HTML from `confirm-signup.html`
2. **Paste** into Supabase: Authentication → Email Templates → Confirm sign up
3. **Set Subject** to: `Confirm Your Signup - Alignr`
4. **Save** and configure redirect URLs

## ✨ Features

- ✅ Professional design with Alignr branding
- ✅ Logo: `https://iili.io/fqdZCfn.png` (verified)
- ✅ Brand colors: Blue (#0066FF), Cyan (#06B6D4), Neon Green (#CAFF00)
- ✅ Responsive design (mobile-friendly)
- ✅ Automatic redirect to sign-in page
- ✅ Clear call-to-action button
- ✅ Professional footer

## 📝 Template Variables

The template uses Supabase's built-in variable:
- `{{ .ConfirmationURL }}` - Automatically includes redirect to your sign-in page

## 🔗 Redirect Configuration

After setting up the template, configure redirect URLs in Supabase:
- **Site URL**: Your production domain
- **Redirect URLs**: 
  - `https://yourdomain.com/auth`
  - `https://yourdomain.com/auth/callback`

---

**Need help?** See `EMAIL_TEMPLATE_SETUP.md` for detailed instructions.

