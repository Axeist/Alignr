#!/bin/bash

# Quick Deploy Script - Run this after logging in

echo "🚀 Deploying Alignr Functions..."
echo ""

# Check if logged in
if ! npx supabase projects list &>/dev/null; then
  echo "❌ Not logged in. Please run: npx supabase login"
  echo "   Then run this script again."
  exit 1
fi

# Set API key
echo "📝 Setting Gemini API Key..."
npx supabase secrets set GEMINI_API_KEY="AIzaSyDzjqeRJOiI13CCaTYluewK9O-AHTxW8uA" --project-ref tkghwmabacbmpfyconyx

if [ $? -ne 0 ]; then
  echo "❌ Failed to set API key"
  exit 1
fi

echo "✅ API Key set"
echo ""

# Deploy functions
echo "📦 Deploying functions..."
echo ""

echo "1️⃣  analyze-resume..."
npx supabase functions deploy analyze-resume --project-ref tkghwmabacbmpfyconyx

echo "2️⃣  analyze-linkedin..."
npx supabase functions deploy analyze-linkedin --project-ref tkghwmabacbmpfyconyx

echo "3️⃣  rewrite-bullet..."
npx supabase functions deploy rewrite-bullet --project-ref tkghwmabacbmpfyconyx

echo "4️⃣  generate-skill-path..."
npx supabase functions deploy generate-skill-path --project-ref tkghwmabacbmpfyconyx

echo "5️⃣  generate-career-report..."
npx supabase functions deploy generate-career-report --project-ref tkghwmabacbmpfyconyx

echo "6️⃣  recommend-jobs..."
npx supabase functions deploy recommend-jobs --project-ref tkghwmabacbmpfyconyx

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 All 6 functions deployed with Gemini 2.0 Flash-Lite"
echo "💡 Optimized for minimal token usage"

