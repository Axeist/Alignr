#!/bin/bash

# Deploy All Supabase Edge Functions for Alignr
# This script deploys all AI-powered functions with optimized token usage

echo "🚀 Deploying Alignr Edge Functions..."
echo ""

# Set your API keys
GROQ_API_KEY="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"
SERP_API_KEY="d5040ac0224af59f167b6abaac97857dd2889f062ac98feeda1cebebbf416d5b"
GEMINI_API_KEY="AIzaSyDzjqeRJOiI13CCaTYluewK9O-AHTxW8uA"

echo "📝 Setting API Keys..."
npx supabase secrets set GROQ_API_KEY="$GROQ_API_KEY"
npx supabase secrets set SERP_API_KEY="$SERP_API_KEY"
npx supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"

if [ $? -ne 0 ]; then
  echo "❌ Failed to set API keys. Make sure you're logged in: supabase login"
  exit 1
fi

echo "✅ API Keys set successfully"
echo ""

# Deploy all functions
echo "📦 Deploying functions..."

echo "1️⃣  Deploying analyze-resume..."
npx supabase functions deploy analyze-resume

echo "2️⃣  Deploying analyze-linkedin..."
npx supabase functions deploy analyze-linkedin

echo "3️⃣  Deploying rewrite-bullet..."
npx supabase functions deploy rewrite-bullet

echo "4️⃣  Deploying generate-skill-path..."
npx supabase functions deploy generate-skill-path

echo "5️⃣  Deploying generate-career-report..."
npx supabase functions deploy generate-career-report

echo "6️⃣  Deploying recommend-jobs..."
npx supabase functions deploy recommend-jobs

echo "7️⃣  Deploying search-external-jobs..."
npx supabase functions deploy search-external-jobs

echo "8️⃣  Deploying calculate-career-score..."
npx supabase functions deploy calculate-career-score

echo "9️⃣  Deploying assess-career-quiz..."
npx supabase functions deploy assess-career-quiz

echo "🔟 Deploying suggest-career-paths..."
npx supabase functions deploy suggest-career-paths

echo "1️⃣1️⃣ Deploying recommend-skills..."
npx supabase functions deploy recommend-skills

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "📊 Functions deployed:"
echo "   ✓ analyze-resume - Resume analysis with ATS scoring"
echo "   ✓ analyze-linkedin - LinkedIn profile optimization"
echo "   ✓ rewrite-bullet - AI-powered resume bullet rewriting"
echo "   ✓ generate-skill-path - Personalized learning paths"
echo "   ✓ generate-career-report - Comprehensive career reports"
echo "   ✓ recommend-jobs - AI-powered job matching"
echo "   ✓ search-external-jobs - External job search with SerpAPI"
echo "   ✓ calculate-career-score - Automatic career score calculation"
echo "   ✓ assess-career-quiz - Career assessment quiz with AI insights"
echo "   ✓ suggest-career-paths - AI-powered career path suggestions"
echo "   ✓ recommend-skills - Personalized skills recommendations"
echo ""
echo "💡 All functions are optimized for minimal token usage"
echo "🔑 Using Groq (Llama 3.1 8B Instant) model"
echo "🌐 Using SerpAPI for external job search (100 free searches/month)"
echo ""
echo "🧪 Test your functions at: https://your-project.supabase.co/functions/v1/"

