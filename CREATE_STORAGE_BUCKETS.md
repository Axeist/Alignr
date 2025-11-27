# 🪣 Create Storage Buckets

This guide will help you create all required storage buckets for Alignr.

## Required Buckets

1. **resumes** - For uploaded resume files (PDF/DOCX)
2. **career-reports** - For generated career reports (HTML)
3. **avatars** - For user profile pictures
4. **logos** - For college and company logos

## Method 1: Using Node.js Script (Recommended)

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx/settings/api
2. Find the **"service_role"** key in the API settings
3. **⚠️ Important**: This key has admin privileges - keep it secret!

### Step 2: Run the Script

```bash
# Set the service role key and run the script
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here node scripts/create-storage-buckets.js
```

The script will:
- Check if buckets already exist
- Create missing buckets with proper configuration
- Verify all buckets are created

## Method 2: Using Supabase Dashboard (Manual)

1. Go to: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx/storage/buckets
2. Click **"New bucket"** for each bucket below

### Bucket 1: resumes
- **Name**: `resumes`
- **Public**: ✅ Yes
- **File size limit**: `10 MB`
- **Allowed MIME types**: 
  - `application/pdf`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Bucket 2: career-reports
- **Name**: `career-reports`
- **Public**: ✅ Yes
- **File size limit**: `5 MB`
- **Allowed MIME types**: 
  - `text/html`

### Bucket 3: avatars
- **Name**: `avatars`
- **Public**: ✅ Yes
- **File size limit**: `2 MB`
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/webp`

### Bucket 4: logos
- **Name**: `logos`
- **Public**: ✅ Yes
- **File size limit**: `1 MB`
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/svg+xml`

## Method 3: Using cURL (Advanced)

If you have your service role key, you can use these commands:

```bash
PROJECT_REF="tkghwmabacbmpfyconyx"
SERVICE_KEY="your_service_role_key_here"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Create resumes bucket
curl -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SERVICE_KEY}" \
  -d '{"name":"resumes","public":true,"file_size_limit":10485760,"allowed_mime_types":["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}'

# Create career-reports bucket
curl -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SERVICE_KEY}" \
  -d '{"name":"career-reports","public":true,"file_size_limit":5242880,"allowed_mime_types":["text/html"]}'

# Create avatars bucket
curl -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SERVICE_KEY}" \
  -d '{"name":"avatars","public":true,"file_size_limit":2097152,"allowed_mime_types":["image/jpeg","image/png","image/webp"]}'

# Create logos bucket
curl -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SERVICE_KEY}" \
  -d '{"name":"logos","public":true,"file_size_limit":1048576,"allowed_mime_types":["image/jpeg","image/png","image/svg+xml"]}'
```

## Verify Buckets

After creating buckets, verify they exist:

```sql
SELECT name, public, file_size_limit 
FROM storage.buckets 
WHERE name IN ('resumes', 'career-reports', 'avatars', 'logos');
```

Or check in the Dashboard: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx/storage/buckets

## Notes

- All buckets should be **PUBLIC** for easy access
- File size limits are in bytes (shown above in MB for clarity)
- MIME type restrictions help prevent malicious uploads
- RLS policies in migrations will control access at the file level


