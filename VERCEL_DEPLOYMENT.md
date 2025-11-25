# Vercel Deployment Configuration

## 404 Error on Page Refresh

If you're getting 404 errors when refreshing pages or navigating directly to routes, this is because Vercel needs to be configured to handle Single Page Application (SPA) routing.

## Solution

A `vercel.json` file has been created with the correct configuration:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This tells Vercel to serve `index.html` for all routes, allowing React Router to handle routing client-side.

## Deployment Steps

1. **Commit and push the `vercel.json` file**:
   ```bash
   git add vercel.json
   git commit -m "Add Vercel SPA routing configuration"
   git push
   ```

2. **Redeploy on Vercel**:
   - The file will be automatically detected on next push
   - Or manually trigger a redeploy in Vercel dashboard

3. **Verify**:
   - After deployment, try refreshing `/auth` or any other route
   - All routes should now work correctly

## How It Works

- When you visit `/auth` directly or refresh the page, Vercel looks for a file at that path
- Since it's a SPA, there's no actual `/auth` file
- The `rewrites` rule tells Vercel to serve `index.html` instead
- React Router then takes over and renders the correct component based on the URL

## Additional Configuration

The `vercel.json` also includes:
- Cache headers for static assets (CSS, JS files) for better performance
- All routes are rewritten to `index.html` to support client-side routing

## Troubleshooting

If 404 errors persist after deployment:

1. **Check that `vercel.json` is in the root directory**
2. **Verify the file was committed and pushed**
3. **Check Vercel deployment logs** for any errors
4. **Clear browser cache** and try again
5. **Ensure the build output includes `index.html`** in the `dist` folder

## Alternative: Netlify

If using Netlify instead, create `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Alternative: Other Hosting

For other hosting providers, ensure they support:
- SPA routing (rewrite all routes to index.html)
- Or configure a catch-all route that serves index.html

