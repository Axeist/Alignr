# 🚀 Deploy Functions via Supabase Dashboard

## Step 1: Set Gemini API Key (Secrets)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (project ID: `tkghwmabacbmpfyconyx`)
3. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
4. Click **Add new secret**
5. Enter:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyDzjqeRJOiI13CCaTYluewK9O-AHTxW8uA`
6. Click **Save**

## Step 2: Deploy Functions via Dashboard

### Option A: Deploy via Dashboard UI

1. Go to **Edge Functions** in the left sidebar
2. For each function, you'll need to:
   - Click **Create a new function** (if it doesn't exist)
   - Or click on existing function to edit
   - Copy the code from the function file
   - Paste it in the editor
   - Click **Deploy**

### Option B: Deploy via Dashboard (Recommended - Using ZIP upload)

The easiest way is to use the Supabase CLI but you can also:

1. Go to **Edge Functions** → **Create a new function**
2. For each function, you'll need to manually copy-paste the code

## Step 3: Functions to Deploy

You need to deploy these 6 functions:

### 1. analyze-resume
- **File**: `supabase/functions/analyze-resume/index.ts`
- Copy the entire contents and paste in dashboard

### 2. analyze-linkedin
- **File**: `supabase/functions/analyze-linkedin/index.ts`
- Copy the entire contents and paste in dashboard

### 3. rewrite-bullet
- **File**: `supabase/functions/rewrite-bullet/index.ts`
- Copy the entire contents and paste in dashboard

### 4. generate-skill-path
- **File**: `supabase/functions/generate-skill-path/index.ts`
- Copy the entire contents and paste in dashboard

### 5. generate-career-report
- **File**: `supabase/functions/generate-career-report/index.ts`
- Copy the entire contents and paste in dashboard

### 6. recommend-jobs
- **File**: `supabase/functions/recommend-jobs/index.ts`
- Copy the entire contents and paste in dashboard

## ⚠️ Important Notes

- Make sure to set the **GEMINI_API_KEY** secret first before deploying
- Each function needs to be deployed separately
- After deployment, test each function to ensure it works

## 🧪 Testing Functions

After deployment, you can test functions in the dashboard:
1. Go to **Edge Functions**
2. Click on a function
3. Go to **Invoke** tab
4. Enter test JSON and click **Invoke**

## 📝 Quick Reference

**Dashboard URL**: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx

**Functions Location**: Edge Functions → Create/Edit function

**Secrets Location**: Project Settings → Edge Functions → Secrets

