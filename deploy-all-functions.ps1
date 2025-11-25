# PowerShell script to deploy all Supabase Edge Functions for Alignr

Write-Host "🚀 Deploying Alignr Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Set your Gemini API key
$GEMINI_API_KEY = "AIzaSyDKs8tZ-Np1Gjpj0veH-keEz65BSK-fe_c"

Write-Host "📝 Setting Gemini API Key..." -ForegroundColor Yellow
supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set API key. Make sure you're logged in: supabase login" -ForegroundColor Red
    exit 1
}

Write-Host "✅ API Key set successfully" -ForegroundColor Green
Write-Host ""

# Deploy all functions
Write-Host "📦 Deploying functions..." -ForegroundColor Yellow

Write-Host "1️⃣  Deploying analyze-resume..." -ForegroundColor Cyan
supabase functions deploy analyze-resume

Write-Host "2️⃣  Deploying analyze-linkedin..." -ForegroundColor Cyan
supabase functions deploy analyze-linkedin

Write-Host "3️⃣  Deploying rewrite-bullet..." -ForegroundColor Cyan
supabase functions deploy rewrite-bullet

Write-Host "4️⃣  Deploying generate-skill-path..." -ForegroundColor Cyan
supabase functions deploy generate-skill-path

Write-Host "5️⃣  Deploying generate-career-report..." -ForegroundColor Cyan
supabase functions deploy generate-career-report

Write-Host "6️⃣  Deploying recommend-jobs..." -ForegroundColor Cyan
supabase functions deploy recommend-jobs

Write-Host ""
Write-Host "✅ All functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Functions deployed:" -ForegroundColor Cyan
Write-Host "   ✓ analyze-resume - Resume analysis with ATS scoring"
Write-Host "   ✓ analyze-linkedin - LinkedIn profile optimization"
Write-Host "   ✓ rewrite-bullet - AI-powered resume bullet rewriting"
Write-Host "   ✓ generate-skill-path - Personalized learning paths"
Write-Host "   ✓ generate-career-report - Comprehensive career reports"
Write-Host "   ✓ recommend-jobs - AI-powered job matching"
Write-Host ""
Write-Host "💡 All functions are optimized for minimal token usage" -ForegroundColor Yellow
Write-Host "🔑 Using Gemini 2.0 Flash-Lite model" -ForegroundColor Yellow
Write-Host ""

