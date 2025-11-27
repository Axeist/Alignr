import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all user data for comprehensive analysis
    const [profileResult, resumeResult, linkedinResult, quizResult] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user_id).single(),
      supabaseClient.from("resumes").select("*").eq("user_id", user_id).eq("is_primary", true).maybeSingle(),
      supabaseClient.from("linkedin_profiles").select("*").eq("user_id", user_id).maybeSingle(),
      supabaseClient.from("career_quizzes").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);

    const profile = profileResult.data;
    const resume = resumeResult.data;
    const linkedin = linkedinResult.data;
    const quiz = quizResult.data;

    // Build comprehensive data summary
    const userData = {
      profile: {
        name: profile?.full_name || "Student",
        department: profile?.department || "",
        year: profile?.year || "",
        interests: profile?.interests || [],
        target_roles: profile?.target_roles || [],
        bio: profile?.bio || ""
      },
      resume: {
        skills: resume?.extracted_data?.skills || [],
        experience: resume?.extracted_data?.experience || [],
        education: resume?.extracted_data?.education || []
      },
      linkedin: {
        headline: linkedin?.analysis_result?.headline?.text || "",
        about: linkedin?.analysis_result?.about?.text || ""
      },
      quiz: {
        insights: quiz?.career_insights || {},
        suggested_roles: quiz?.suggested_roles || []
      }
    };

    const prompt = `Based on this student's profile, suggest 5-7 personalized career paths. Return JSON only:
{
  "suggested_paths": [
    {
      "career_path": "<career path name>",
      "description": "<brief description>",
      "match_percentage": <0-100>,
      "required_skills": ["<skill1>", "<skill2>", "<skill3>"],
      "growth_potential": "<high/medium/low>",
      "salary_range": "<entry level range>",
      "education_requirements": "<requirements>",
      "why_match": "<why this path matches the student>",
      "next_steps": ["<step1>", "<step2>", "<step3>"]
    }
  ],
  "top_matches": {
    "primary": "<top match career path>",
    "secondary": "<second best match>",
    "exploratory": "<exploratory option>"
  },
  "analysis_summary": "<overall analysis of student's career potential>"
}

User Data: ${JSON.stringify(userData)}`;

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json"
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const suggestions = JSON.parse(responseText);

    // Get college_id from profile
    const collegeId = profile?.college_id || null;

    // Save suggestions
    const { data: pathData, error: pathError } = await supabaseClient
      .from("career_path_suggestions")
      .upsert({
        user_id,
        college_id: collegeId,
        suggested_paths: suggestions.suggested_paths || [],
        top_matches: suggestions.top_matches || {},
        analysis_data: suggestions
      }, {
        onConflict: "user_id"
      })
      .select()
      .single();

    if (pathError) {
      console.error("Error saving career path suggestions:", pathError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        path_id: pathData?.id
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error("Error suggesting career paths:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to suggest career paths" }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }
});

