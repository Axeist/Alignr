# Setting Up SerpAPI Key

## Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref tkghwmabacbmpfyconyx
   ```

4. **Set the SerpAPI key**:
   ```bash
   supabase secrets set SERP_API_KEY=d5040ac0224af59f167b6abaac97857dd2889f062ac98feeda1cebebbf416d5b
   ```

## Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/tkghwmabacbmpfyconyx
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add a new secret:
   - **Name**: `SERP_API_KEY`
   - **Value**: `d5040ac0224af59f167b6abaac97857dd2889f062ac97857dd2889f062ac98feeda1cebebbf416d5b`
4. Click **Save**

## Option 3: Using Supabase Dashboard (Alternative Path)

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **API** → **Edge Functions**
3. Find the **Environment Variables** section
4. Add `SERP_API_KEY` with the value above

## Verify the Secret is Set

After setting the secret, you can verify it by:

1. **Using CLI**:
   ```bash
   supabase secrets list
   ```

2. **Or test the function**:
   - The function will use the secret automatically when deployed
   - Check the function logs if there are any issues

## Deploy the Function

After setting the secret, deploy the updated function:

```bash
supabase functions deploy search-external-jobs
```

## Notes

- The SerpAPI key is already configured in the code
- The function will automatically use the secret from environment variables
- Free tier of SerpAPI: 100 searches/month
- The implementation is optimized to minimize API calls and token usage

