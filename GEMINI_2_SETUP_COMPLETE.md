# Gemini 2.0 Flash-Lite Setup Complete ✅

## What Was Updated

### 1. All Edge Functions Updated
All AI edge functions now use **Gemini 2.0 Flash-Lite** (`gemini-2.0-flash-exp`):
- ✅ `analyze-resume` - Resume analysis with ATS scoring
- ✅ `analyze-linkedin` - LinkedIn profile optimization
- ✅ `rewrite-bullet` - Resume bullet point rewriting
- ✅ `generate-skill-path` - Personalized learning paths
- ✅ `generate-career-report` - Comprehensive career reports
- ✅ `recommend-jobs` - AI-powered job matching

### 2. Database Migration Created
Created migration file: `supabase/migrations/20251126000007_gemini_2_flash_setup.sql`

This migration includes:
- ✅ `career_reports` table with full schema
- ✅ RLS policies for career reports
- ✅ Storage bucket policies for all required buckets
- ✅ XP tracking for report generation
- ✅ Indexes for performance
- ✅ Triggers for updated_at timestamps

### 3. Storage Buckets Setup Guide
Created: `STORAGE_BUCKETS_SETUP.sql` with detailed instructions

## Next Steps

### Step 1: Run the Migration
```bash
# Apply the migration
supabase db push

# Or run it manually in Supabase SQL Editor
# Copy contents of: supabase/migrations/20251126000007_gemini_2_flash_setup.sql
```

### Step 2: Create Storage Buckets
You **must** create storage buckets via Supabase Dashboard:

1. Go to **Supabase Dashboard** → **Storage**
2. Create these 4 buckets:

#### Bucket 1: `resumes`
- **Public**: Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: 
  - `application/pdf`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### Bucket 2: `career-reports`
- **Public**: Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `text/html`

#### Bucket 3: `avatars`
- **Public**: Yes
- **File size limit**: 2 MB
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/webp`

#### Bucket 4: `logos`
- **Public**: Yes
- **File size limit**: 1 MB
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/svg+xml`

### Step 3: Set Gemini API Key
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

### Step 4: Deploy Edge Functions
```bash
supabase functions deploy analyze-resume
supabase functions deploy analyze-linkedin
supabase functions deploy rewrite-bullet
supabase functions deploy generate-skill-path
supabase functions deploy generate-career-report
supabase functions deploy recommend-jobs
```

### Step 5: Verify Setup
Run this SQL to verify tables and policies:
```sql
-- Check career_reports table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'career_reports';

-- Check storage buckets exist
SELECT name, public, file_size_limit 
FROM storage.buckets 
WHERE name IN ('resumes', 'career-reports', 'avatars', 'logos');

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'career_reports';
```

## Model Information

**Gemini 2.0 Flash-Lite** Features:
- ✅ Optimized for cost-efficiency
- ✅ High throughput support
- ✅ Input: 1,048,576 tokens
- ✅ Output: 65,536 tokens
- ✅ Supports: text, images, video, audio, PDFs
- ✅ Fast response times

## Testing

After setup, test each feature:

1. **Resume Builder**: Upload a PDF resume at `/student/resume`
2. **LinkedIn Analysis**: Paste LinkedIn profile at `/student/linkedin`
3. **Career Report**: Generate report at `/student/career-report`
4. **Skill Path**: Create learning path at `/student/skills`
5. **AI Rewrite**: Use rewrite tool in Resume page

## Troubleshooting

### "GEMINI_API_KEY not configured"
- Make sure you ran: `supabase secrets set GEMINI_API_KEY=your_key`
- Redeploy functions after setting secret

### "Storage bucket not found"
- Verify buckets are created in Supabase Dashboard
- Check bucket names match exactly: `resumes`, `career-reports`, `avatars`, `logos`

### "RLS policy violation"
- Run the migration to create policies
- Check user is authenticated: `SELECT auth.uid();`

## Files Created/Updated

1. ✅ `supabase/migrations/20251126000007_gemini_2_flash_setup.sql` - Database migration
2. ✅ `STORAGE_BUCKETS_SETUP.sql` - Storage setup guide
3. ✅ All edge functions updated to use `gemini-2.0-flash-exp`
4. ✅ `STUDENT_PORTAL_SETUP.md` - Updated with Gemini 2.0 info

## Ready to Use! 🚀

Once you complete the steps above, all AI features will be fully functional with Gemini 2.0 Flash-Lite!

