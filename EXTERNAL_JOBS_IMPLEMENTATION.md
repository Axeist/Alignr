# External Jobs Implementation Guide

## Overview
The job board now supports two types of jobs:
1. **Internal Jobs**: Jobs posted by alumni, colleges, and employers within the platform
2. **External Jobs**: Jobs found from external platforms like LinkedIn, Indeed, Naukri, Glassdoor, etc.

## Features Implemented

### 1. Database Schema
- **external_jobs** table: Stores jobs found from external platforms
- **external_job_applications** table: Tracks applications to external jobs
- Both tables have proper RLS policies for user data security

### 2. Edge Function
- **search-external-jobs**: Searches for jobs across multiple platforms
- Currently uses mock data structure
- Ready for integration with real job search APIs

### 3. UI Features
- **Tab System**: Switch between "Internal Jobs" and "External Jobs"
- **Search Interface**: Search external jobs by title/keywords and location
- **Platform Selection**: Choose which platforms to search (LinkedIn, Indeed, Naukri, Glassdoor)
- **Match Scoring**: AI-powered match scores for external jobs
- **Save Jobs**: Save external jobs for later
- **Track Applications**: Track applications to external jobs with URLs
- **Apply Links**: Direct links to apply on external platforms

## How to Integrate Real Job Search APIs

### Option 1: SerpAPI (Recommended)
SerpAPI provides job search results from multiple platforms including LinkedIn, Indeed, Google Jobs, etc.

1. Sign up at https://serpapi.com/
2. Get your API key
3. Update `supabase/functions/search-external-jobs/index.ts`:

```typescript
const SERP_API_KEY = Deno.env.get("SERP_API_KEY");
const SERP_API_URL = "https://serpapi.com/search";

async function searchJobsOnPlatform(
  platform: string,
  query: string,
  location?: string
): Promise<ExternalJob[]> {
  const params = new URLSearchParams({
    engine: "google_jobs",
    q: query,
    location: location || "",
    api_key: SERP_API_KEY || "",
  });

  const response = await fetch(`${SERP_API_URL}?${params}`);
  const data = await response.json();

  return data.jobs_results?.map((job: any) => ({
    title: job.title,
    company_name: job.company_name,
    description: job.description,
    location: job.location,
    job_type: job.schedule_type,
    salary_range: job.detected_extensions?.salary,
    experience_level: job.detected_extensions?.work_type,
    skills_required: [], // Extract from description
    source_platform: platform,
    external_url: job.apply_options?.[0]?.link || job.link,
    external_job_id: job.job_id,
    posted_date: job.detected_extensions?.posted_at,
  })) || [];
}
```

### Option 2: RapidAPI Job Search
RapidAPI has multiple job search endpoints.

1. Sign up at https://rapidapi.com/
2. Subscribe to a job search API (e.g., "LinkedIn Jobs", "Indeed Jobs")
3. Update the function with RapidAPI endpoints

### Option 3: Direct Platform APIs
Some platforms offer official APIs:
- **LinkedIn**: LinkedIn Jobs API (requires partnership)
- **Indeed**: Indeed Publisher API
- **Naukri**: Naukri API (requires partnership)

### Option 4: Web Scraping (Not Recommended)
While possible, web scraping violates most platforms' Terms of Service and is not recommended.

## Environment Variables

Add these to your Supabase Edge Function secrets:

```bash
# For SerpAPI
supabase secrets set SERP_API_KEY=your_serpapi_key

# For RapidAPI
supabase secrets set RAPID_API_KEY=your_rapidapi_key

# Existing
supabase secrets set GROQ_API_KEY=your_groq_key
```

## Usage

1. **Search External Jobs**:
   - Navigate to Job Board
   - Click "External Jobs" tab
   - Enter job title/keywords
   - Optionally add location
   - Select platforms to search
   - Click "Search"

2. **Save Jobs**:
   - Click "Save" button on any external job
   - Saved jobs are stored in the database

3. **Track Applications**:
   - Click "Track Application" on an external job
   - Enter the application URL
   - Select resume used (optional)
   - Click "Track Application"
   - Applications appear in "My Applications"

4. **Apply to Jobs**:
   - Click "Apply" button
   - Opens the job posting in a new tab
   - Apply directly on the external platform

## Database Queries

### Get all external jobs for a user:
```sql
SELECT * FROM external_jobs 
WHERE user_id = 'user_id' 
ORDER BY created_at DESC;
```

### Get tracked applications:
```sql
SELECT eja.*, ej.title, ej.company_name, ej.external_url
FROM external_job_applications eja
JOIN external_jobs ej ON eja.external_job_id = ej.id
WHERE eja.user_id = 'user_id'
ORDER BY eja.application_date DESC;
```

### Get saved external jobs:
```sql
SELECT * FROM external_jobs 
WHERE user_id = 'user_id' AND is_saved = true
ORDER BY created_at DESC;
```

## Next Steps

1. **Integrate Real APIs**: Replace mock data with real job search APIs
2. **Add More Platforms**: Extend to more job platforms
3. **Improve Matching**: Enhance AI matching algorithm
4. **Notifications**: Notify users of new matching jobs
5. **Analytics**: Track application success rates
6. **Resume Optimization**: Suggest resume improvements based on job requirements

## Notes

- The current implementation uses mock data for demonstration
- Real API integration requires API keys and may have usage limits
- Some platforms may require partnerships for API access
- Always respect rate limits and Terms of Service

