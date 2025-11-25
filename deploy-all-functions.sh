#!/bin/bash

# Deploy All Supabase Edge Functions for Alignr
# This script deploys all AI-powered functions with optimized token usage

echo "🚀 Deploying Alignr Edge Functions..."
echo ""

# Set your Gemini API key
GEMINI_API_KEY="AIzaSyDKs8tZ-Np1Gjpj0veH-keEz65BSK-fe_c"

echo "📝 Setting Gemini API Key..."
supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"

if [ $? -ne 0 ]; then
  echo "❌ Failed to set API key. Make sure you're logged in: supabase login"
  exit 1
fi

echo "✅ API Key set successfully"
echo ""

# Deploy all functions
echo "📦 Deploying functions..."

echo "1️⃣  Deploying analyze-resume..."
supabase functions deploy analyze-resume

echo "2️⃣  Deploying analyze-linkedin..."
supabase functions deploy analyze-linkedin

echo "3️⃣  Deploying rewrite-bullet..."
supabase functions deploy rewrite-bullet

echo "4️⃣  Deploying generate-skill-path..."
supabase functions deploy generate-skill-path

echo "5️⃣  Deploying generate-career-report..."
supabase functions deploy generate-career-report

echo "6️⃣  Deploying recommend-jobs..."
supabase functions deploy recommend-jobs

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
echo ""
echo "💡 All functions are optimized for minimal token usage"
echo "🔑 Using Gemini 2.0 Flash-Lite model"
echo ""
echo "🧪 Test your functions at: https://your-project.supabase.co/functions/v1/"

