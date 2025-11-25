# Student Portal AI Features Setup Guide

This guide will help you set up all the AI-powered features in the student portal.

## 🎯 Features Overview

The student portal includes the following AI-powered features:

1. **Resume Builder** - Upload and analyze resumes with ATS scoring
2. **LinkedIn Analysis** - Analyze and optimize LinkedIn profiles
3. **Career Report** - Generate comprehensive career analysis reports
4. **Skill Path** - Generate personalized learning paths
5. **AI Rewrite Tool** - Optimize resume bullet points with AI

## 🔑 Gemini API Key Setup

All AI features use **Gemini 2.0 Flash-Lite** model for optimal performance and cost-efficiency. Here's how to get an API key:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Setting the API Key in Supabase

Once you have your API key, set it as a secret in Supabase:

```bash
# Make sure you're logged in and linked to your project
supabase login
supabase link --project-ref your-project-ref

# Set the Gemini API key
supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** Replace `your_actual_api_key_here` with your actual API key from Google AI Studio.

## 📦 Storage Buckets Setup

Make sure you have created the following storage buckets in Supabase:

1. **resumes** - For storing uploaded resume files (public access)
2. **career-reports** - For storing generated career reports (public access)
3. **avatars** - For user profile pictures (public access)
4. **logos** - For college/company logos (public access)

### Creating Storage Buckets

1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Click "New bucket"
4. Create each bucket with the names above
5. Set them to **Public** access

## 🚀 Deploying Edge Functions

All AI features use Supabase Edge Functions. Deploy them with:

```bash
# Deploy all AI-related functions
supabase functions deploy analyze-resume
supabase functions deploy analyze-linkedin
supabase functions deploy rewrite-bullet
supabase functions deploy generate-skill-path
supabase functions deploy generate-career-report
supabase functions deploy recommend-jobs
```

## ✅ Testing the Features

### 1. Resume Builder (`/student/resume`)
- Upload a PDF or DOCX resume
- The system will automatically analyze it
- View ATS score, strengths, gaps, and suggestions
- Use the AI Rewrite tool to optimize bullet points

### 2. LinkedIn Analysis (`/student/linkedin`)
- Paste your LinkedIn URL or profile text
- Get completeness score and section-by-section analysis
- View recommended headlines and missing skills
- See optimized About section rewrite

### 3. Career Report (`/student/career-report`)
- Click "Generate Report"
- Get a comprehensive career analysis including:
  - Career summary and scores
  - Recommended roles
  - Skills gap analysis
  - Learning resources
  - 30/60/90-day action plan
- Download as HTML report

### 4. Skill Path (`/student/skills`)
- Enter your target role
- Get a personalized learning path with:
  - Milestones and progress tracking
  - Recommended courses
  - Project ideas
  - Final capstone project

## 🔧 Troubleshooting

### "GEMINI_API_KEY not configured" Error
- Make sure you've set the secret: `supabase secrets set GEMINI_API_KEY=your_key`
- Verify the key is correct in Google AI Studio
- Redeploy the function after setting the secret

### Resume Analysis Not Working
- Check that the `resumes` storage bucket exists and is public
- Verify the file is a valid PDF or DOCX
- Check browser console for detailed error messages

### Career Report Generation Fails
- Ensure the `career-reports` storage bucket exists and is public
- Make sure you have uploaded a resume and LinkedIn profile first
- Check that your profile has sufficient data

### LinkedIn Analysis Returns Empty Results
- Make sure you've pasted sufficient profile text (at least 200 characters)
- Try using the "Paste Profile Text" option instead of URL
- Verify the Gemini API key is valid and has quota remaining

## 📊 API Usage & Costs

- **Gemini 2.0 Flash-Lite** is used for all AI features (optimized for cost-efficiency and high throughput)
- Input token limit: 1,048,576 tokens
- Output token limit: 65,536 tokens
- Supports: text, images, video, audio, and PDFs
- Free tier: 15 requests per minute
- Paid tier: Check [Google AI Studio pricing](https://ai.google.dev/pricing)

## 🎓 Next Steps

1. Set up your Gemini API key
2. Deploy all edge functions
3. Create required storage buckets
4. Test each feature with sample data
5. Monitor API usage in Google AI Studio

For more help, check the main [README.md](./README.md) file.

