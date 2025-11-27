# Quick Start: Email Confirmation Template

## 🚀 3-Step Setup

### Step 1: Copy Template
1. Open `confirm-signup.html` 
2. Copy **ALL** the HTML content (Ctrl+A, Ctrl+C)

### Step 2: Paste in Supabase
1. Go to Supabase Dashboard → **Authentication** → **Email Templates** → **Confirm sign up**
2. Click **"Source"** tab
3. Select all existing content and **DELETE** it
4. **PASTE** the copied HTML
5. Set **Subject** to: `Confirm Your Signup - Alignr`
6. Click **"Save changes"** ✅

### Step 3: Configure Redirect
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://alignr.cuephoria.in`
3. Add **Redirect URLs**:
   - `https://alignr.cuephoria.in/auth`
   - `https://alignr.cuephoria.in/auth/callback`
   - `https://alignr.cuephoria.in/*`
4. Save ✅

**Result:** After clicking the confirmation link, users will be redirected to `https://alignr.cuephoria.in/auth` to sign in.

## ✨ What You Get

- ✅ Professional design with Alignr logo
- ✅ Brand colors (Blue #0066FF, Cyan #06B6D4, Neon Green #CAFF00)
- ✅ Responsive layout (works on mobile)
- ✅ Clear CTA button
- ✅ Automatic redirect to sign-in page
- ✅ Professional footer with branding

## 🧪 Test It

1. Sign up with a test email
2. Check inbox for confirmation email
3. Click the button → Should redirect to `/auth` sign-in page

## 📝 Notes

- The `{{ .ConfirmationURL }}` variable automatically includes the redirect
- Logo URL: `https://iili.io/fqdZCfn.png`
- Link expires in 24 hours (Supabase default)

## 🆘 Troubleshooting

**Email not sending?** → Check Supabase project settings  
**Redirect not working?** → Verify redirect URLs in Step 3  
**Logo not showing?** → Some email clients block images by default

---

For detailed instructions, see `EMAIL_TEMPLATE_SETUP.md`

