# ✅ AI Functions Setup Checklist

## 🔍 Current Status Check

Based on the 500 error you're seeing, here's what to verify:

### 1. ✅ GEMINI_API_KEY Configuration

**Check in Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx
2. Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
3. Verify `GEMINI_API_KEY` exists and has a valid value
4. If missing, add it:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key from https://aistudio.google.com/app/apikey

**Or via CLI:**
```bash
supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
```

### 2. ✅ Edge Functions Deployment

**Verify all functions are deployed:**
```bash
supabase functions list
```

**If any are missing, deploy them:**
```bash
supabase functions deploy analyze-linkedin
supabase functions deploy analyze-resume
supabase functions deploy rewrite-bullet
supabase functions deploy recommend-jobs
supabase functions deploy generate-skill-path
supabase functions deploy generate-career-report
```

### 3. ✅ Database Tables

**Verify `linkedin_profiles` table exists:**
- Check in Supabase Dashboard → Table Editor
- Should have columns: `user_id`, `linkedin_url`, `profile_text`, `completeness_score`, `analysis_result`, `last_analyzed`, `updated_at`

### 4. ✅ Function Logs

**Check function logs for detailed errors:**
1. Go to Supabase Dashboard → Edge Functions
2. Click on `analyze-linkedin`
3. Go to **Logs** tab
4. Look for recent errors - this will show the exact issue

### 5. ✅ Test Function Directly

**Test in Supabase Dashboard:**
1. Go to Edge Functions → `analyze-linkedin`
2. Click **Invoke** tab
3. Use this test payload:
```json
{
  "user_id": "your-user-id-here",
  "linkedin_url": "https://www.linkedin.com/in/test-profile/"
}
```
4. Check the response for specific error messages

## 🐛 Common Issues & Solutions

### Issue: "GEMINI_API_KEY not configured"
**Solution:** Set the secret in Supabase (see step 1 above)

### Issue: "Failed to analyze LinkedIn profile"
**Possible causes:**
- Invalid Gemini API key
- API quota exceeded
- Network error

**Solution:**
- Verify API key is valid at https://aistudio.google.com/app/apikey
- Check API usage/quota
- Review function logs for specific error

### Issue: Database upsert error
**Solution:**
- Verify `linkedin_profiles` table exists
- Check RLS policies allow inserts/updates
- Verify `user_id` is valid

## 📋 Quick Verification Script

Run this to check everything:

```bash
# 1. Check if logged in
supabase projects list

# 2. Check secrets
supabase secrets list

# 3. Check functions
supabase functions list

# 4. Test a function
curl -X POST \
  'https://tkghwmabacbmpfyconyx.supabase.co/functions/v1/analyze-linkedin' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"test","linkedin_url":"https://linkedin.com/in/test"}'
```

## ✅ All Functions Status

| Function | Status | Notes |
|----------|--------|-------|
| `analyze-linkedin` | ⚠️ Needs verification | 500 error detected |
| `analyze-resume` | ✅ Code fixed | Ready to deploy |
| `rewrite-bullet` | ✅ Code fixed | Ready to deploy |
| `recommend-jobs` | ✅ Code fixed | Ready to deploy |
| `generate-skill-path` | ✅ Code fixed | Ready to deploy |
| `generate-career-report` | ✅ Code fixed | Ready to deploy |

## 🚀 Next Steps

1. **Set GEMINI_API_KEY** in Supabase secrets
2. **Redeploy all functions** with the fixed code
3. **Check function logs** for any remaining errors
4. **Test each function** individually

## 📞 Need Help?

If errors persist after following this checklist:
1. Check Supabase Dashboard → Edge Functions → Logs
2. Look for specific error messages
3. Verify API key is valid and has quota
4. Check database permissions/RLS policies


