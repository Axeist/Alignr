# 📋 Step-by-Step: Deploy via Supabase Dashboard

## ✅ Quick Checklist

- [ ] Set GEMINI_API_KEY secret
- [ ] Deploy analyze-resume
- [ ] Deploy analyze-linkedin
- [ ] Deploy rewrite-bullet
- [ ] Deploy generate-skill-path
- [ ] Deploy generate-career-report
- [ ] Deploy recommend-jobs

---

## 🔑 Step 1: Set API Key Secret

1. Open: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx
2. Click **Project Settings** (gear icon, bottom left)
3. Click **Edge Functions** in left menu
4. Click **Secrets** tab
5. Click **Add new secret** button
6. Fill in:
   ```
   Name: GEMINI_API_KEY
   Value: AIzaSyDKs8tZ-Np1Gjpj0veH-keEz65BSK-fe_c
   ```
7. Click **Save**

---

## 📦 Step 2: Deploy Functions

For each function below, follow these steps:

### For Each Function:

1. Go to **Edge Functions** in left sidebar
2. Click **Create a new function** (or edit if exists)
3. Enter function name (e.g., `analyze-resume`)
4. Copy the code from the file listed below
5. Paste into the code editor
6. Click **Deploy**

---

### Function 1: analyze-resume

**File to copy from**: `supabase/functions/analyze-resume/index.ts`

**Steps**:
1. Open the file in your editor
2. Copy ALL the code
3. In Supabase Dashboard → Edge Functions → Create function
4. Name: `analyze-resume`
5. Paste code
6. Click **Deploy**

---

### Function 2: analyze-linkedin

**File to copy from**: `supabase/functions/analyze-linkedin/index.ts`

**Steps**:
1. Copy code from file
2. Create function named: `analyze-linkedin`
3. Paste and deploy

---

### Function 3: rewrite-bullet

**File to copy from**: `supabase/functions/rewrite-bullet/index.ts`

**Steps**:
1. Copy code from file
2. Create function named: `rewrite-bullet`
3. Paste and deploy

---

### Function 4: generate-skill-path

**File to copy from**: `supabase/functions/generate-skill-path/index.ts`

**Steps**:
1. Copy code from file
2. Create function named: `generate-skill-path`
3. Paste and deploy

---

### Function 5: generate-career-report

**File to copy from**: `supabase/functions/generate-career-report/index.ts`

**Steps**:
1. Copy code from file
2. Create function named: `generate-career-report`
3. Paste and deploy

---

### Function 6: recommend-jobs

**File to copy from**: `supabase/functions/recommend-jobs/index.ts`

**Steps**:
1. Copy code from file
2. Create function named: `recommend-jobs`
3. Paste and deploy

---

## 🎯 Dashboard Navigation

**Main Dashboard**: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx

**Edge Functions**: Left sidebar → Edge Functions

**Secrets**: Project Settings → Edge Functions → Secrets tab

**Function Editor**: Edge Functions → Click function → Code tab

---

## ✅ Verification

After deploying all functions:

1. Go to **Edge Functions** list
2. You should see all 6 functions listed
3. Each should show "Active" status
4. Test one function using the **Invoke** tab

---

## 🆘 Troubleshooting

**Function not showing?**
- Make sure you clicked "Deploy" after pasting code
- Check for syntax errors in the code editor

**Secret not working?**
- Verify secret name is exactly: `GEMINI_API_KEY` (case-sensitive)
- Make sure you saved the secret before deploying functions

**Function errors?**
- Check the **Logs** tab in the function editor
- Verify the API key is set correctly

