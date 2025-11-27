# 🚀 New Functions Deployment Guide

## Overview
Three new AI-powered functions have been added to replace the skill path and career report features:

1. **assess-career-quiz** - Career assessment quiz with AI insights
2. **suggest-career-paths** - AI-powered career path suggestions  
3. **recommend-skills** - Personalized skills recommendations

## ⚠️ Prerequisites

### 1. Run Database Migration First
**IMPORTANT:** You must run the database migration before deploying functions:

```bash
# Apply the migration
supabase migration up
# OR if using Supabase CLI locally
supabase db push
```

The migration file is: `supabase/migrations/20251128000000_career_quiz_and_paths.sql`

This creates:
- `career_quizzes` table
- `career_path_suggestions` table  
- `skills_recommendations` table
- Adds `quiz_score` column to `profiles` table

### 2. Set Environment Variables
The new functions require `GEMINI_API_KEY`:

```bash
npx supabase secrets set GEMINI_API_KEY="AIzaSyDzjqeRJOiI13CCaTYluewK9O-AHTxW8uA"
```

## 📦 Deployment Steps

### Option 1: Deploy All Functions (Recommended)
```bash
chmod +x deploy-all-functions.sh
./deploy-all-functions.sh
```

This will deploy all functions including the 3 new ones.

### Option 2: Deploy Only New Functions
```bash
# Set Gemini API key
npx supabase secrets set GEMINI_API_KEY="AIzaSyDzjqeRJOiI13CCaTYluewK9O-AHTxW8uA"

# Deploy new functions
npx supabase functions deploy assess-career-quiz
npx supabase functions deploy suggest-career-paths
npx supabase functions deploy recommend-skills

# Also update the modified function
npx supabase functions deploy calculate-career-score
```

## ✅ What Changed

### Modified Function
- **calculate-career-score** - Updated to include quiz scores in calculation
  - New weights: Resume 35%, LinkedIn 25%, Quiz 25%, Activity 15%
  - Previously: Resume 40%, LinkedIn 30%, Skill Path 20%, Activity 10%

### New Functions

#### 1. assess-career-quiz
- **Endpoint:** `/functions/v1/assess-career-quiz`
- **Method:** POST
- **Body:** `{ user_id, quiz_responses }`
- **Returns:** Quiz score, career insights, suggested roles
- **Updates:** `career_quizzes` table, `profiles.quiz_score`, `profiles.career_score`

#### 2. suggest-career-paths
- **Endpoint:** `/functions/v1/suggest-career-paths`
- **Method:** POST
- **Body:** `{ user_id }`
- **Returns:** Suggested career paths with match percentages
- **Updates:** `career_path_suggestions` table

#### 3. recommend-skills
- **Endpoint:** `/functions/v1/recommend-skills`
- **Method:** POST
- **Body:** `{ user_id, target_role? }`
- **Returns:** Skill recommendations, gaps, learning resources, roadmap
- **Updates:** `skills_recommendations` table

## 🧪 Testing

After deployment, test each function:

```bash
# Test career quiz
curl -X POST https://your-project.supabase.co/functions/v1/assess-career-quiz \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_UUID", "quiz_responses": {"interests": "Building things", "work_style": "Team work"}}'

# Test career paths
curl -X POST https://your-project.supabase.co/functions/v1/suggest-career-paths \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_UUID"}'

# Test skills recommendations
curl -X POST https://your-project.supabase.co/functions/v1/recommend-skills \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_UUID", "target_role": "Software Engineer"}'
```

## 📝 Notes

1. **Database Migration Required:** Make sure to run the migration first, otherwise functions will fail
2. **Gemini API Key:** All new functions use Gemini 2.0 Flash model
3. **Career Score:** The quiz score now contributes 25% to the overall career score
4. **Backward Compatibility:** Old skill path and career report pages still exist but navigation points to new pages

## 🔍 Troubleshooting

### Function fails with "relation does not exist"
- **Solution:** Run the database migration first

### Function fails with "GEMINI_API_KEY not configured"
- **Solution:** Set the secret: `npx supabase secrets set GEMINI_API_KEY="YOUR_KEY"`

### Upsert errors in recommend-skills
- **Solution:** Already fixed - uses insert/update pattern instead of upsert

## 📊 Function Dependencies

```
assess-career-quiz
  ├── Reads: profiles
  ├── Writes: career_quizzes, profiles (quiz_score, career_score)
  └── Uses: Gemini API

suggest-career-paths
  ├── Reads: profiles, resumes, linkedin_profiles, career_quizzes
  ├── Writes: career_path_suggestions
  └── Uses: Gemini API

recommend-skills
  ├── Reads: profiles, resumes, career_path_suggestions
  ├── Writes: skills_recommendations
  └── Uses: Gemini API

calculate-career-score (updated)
  ├── Reads: profiles, resumes, linkedin_profiles, applications
  ├── Writes: profiles (career_score)
  └── Now includes quiz_score in calculation
```

