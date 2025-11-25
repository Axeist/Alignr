# 🚀 Deploy All Functions - Quick Guide

## Your API Key
Your Gemini API key has been configured in the deployment scripts:
```
AIzaSyDKs8tZ-Np1Gjpj0veH-keEz65BSK-fe_c
```

## ⚡ Quick Deploy (Choose One)

### Option 1: Using Bash Script (Mac/Linux)
```bash
chmod +x deploy-all-functions.sh
./deploy-all-functions.sh
```

### Option 2: Using PowerShell (Windows)
```powershell
.\deploy-all-functions.ps1
```

### Option 3: Manual Deploy
```bash
# 1. Set API key
supabase secrets set GEMINI_API_KEY="AIzaSyDKs8tZ-Np1Gjpj0veH-keEz65BSK-fe_c"

# 2. Deploy all functions
supabase functions deploy analyze-resume
supabase functions deploy analyze-linkedin
supabase functions deploy rewrite-bullet
supabase functions deploy generate-skill-path
supabase functions deploy generate-career-report
supabase functions deploy recommend-jobs
```

## ✅ What Gets Deployed

1. **analyze-resume** - Resume analysis with ATS scoring
2. **analyze-linkedin** - LinkedIn profile optimization  
3. **rewrite-bullet** - AI-powered resume bullet rewriting
4. **generate-skill-path** - Personalized learning paths
5. **generate-career-report** - Comprehensive career reports
6. **recommend-jobs** - AI-powered job matching

## 💡 Token Optimization Features

All functions have been optimized to use **minimal tokens**:

- ✅ Resume text limited to 3000 characters
- ✅ LinkedIn profile limited to 2000 characters
- ✅ Job descriptions limited to 300 characters
- ✅ Skills arrays limited to top 10-15 items
- ✅ Concise prompts with essential info only
- ✅ Compact JSON structures

## 📊 Expected Token Usage (Per Request)

- **analyze-resume**: ~500-800 tokens
- **analyze-linkedin**: ~400-600 tokens
- **rewrite-bullet**: ~200-300 tokens
- **generate-skill-path**: ~600-900 tokens
- **generate-career-report**: ~800-1200 tokens
- **recommend-jobs**: ~300-500 tokens (per job)

## 🔒 Free Tier Limits

- **15 requests per minute**
- **1,500 requests per day**

With optimizations, you can handle:
- ~20-30 resume analyses per day
- ~30-40 LinkedIn analyses per day
- ~50-75 bullet rewrites per day
- ~15-20 skill paths per day
- ~10-15 career reports per day
- ~30-50 job recommendations per day

## ⚠️ Important Notes

1. **Monitor Usage**: Check your usage at https://aistudio.google.com/app/apikey
2. **Rate Limiting**: Functions include error handling for rate limits
3. **Caching**: Consider caching results to reduce API calls
4. **Upgrade**: If you exceed free tier, upgrade at Google AI Studio

## 🧪 Test After Deployment

```bash
# Test resume analysis
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/analyze-resume \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"resume_url": "test", "user_id": "test"}'
```

## 📝 Next Steps

1. ✅ Run deployment script
2. ✅ Create storage buckets (see STORAGE_BUCKETS_SETUP.sql)
3. ✅ Run database migration (see supabase/migrations/20251126000007_gemini_2_flash_setup.sql)
4. ✅ Test functions in the student portal

## 🆘 Troubleshooting

**"GEMINI_API_KEY not configured"**
- Run: `supabase secrets set GEMINI_API_KEY="your_key"`
- Redeploy functions

**"Rate limit exceeded"**
- Wait 1 minute between requests
- Implement request queuing
- Consider upgrading API tier

**"Function not found"**
- Make sure you're in the project directory
- Check: `supabase link --project-ref YOUR_PROJECT_REF`

