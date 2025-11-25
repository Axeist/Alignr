import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, filters } = await req.json();

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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user profile, resume, and LinkedIn
    const [profileResult, resumeResult, linkedinResult] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user_id).single(),
      supabaseClient.from("resumes").select("*").eq("user_id", user_id).eq("is_primary", true).single(),
      supabaseClient.from("linkedin_profiles").select("*").eq("user_id", user_id).single()
    ]);

    const profile = profileResult.data;
    const resume = resumeResult.data;
    const linkedin = linkedinResult.data;

    // Build job query with filters
    // Show jobs that are approved/active AND either:
    // - Have no college_id (open to all colleges)
    // - Match the student's college_id
    let jobQuery = supabaseClient
      .from("jobs")
      .select("*")
      .in("status", ["approved", "active"]);

    // Filter by college: show jobs with no college_id (all colleges) or matching student's college
    if (profile?.college_id) {
      jobQuery = jobQuery.or(`college_id.is.null,college_id.eq.${profile.college_id}`);
    } else {
      // If student has no college, only show jobs with no college_id (open to all)
      jobQuery = jobQuery.is("college_id", null);
    }

    if (filters?.role) {
      jobQuery = jobQuery.ilike("title", `%${filters.role}%`);
    }
    if (filters?.location) {
      jobQuery = jobQuery.ilike("location", `%${filters.location}%`);
    }
    if (filters?.skills && filters.skills.length > 0) {
      jobQuery = jobQuery.contains("skills_required", filters.skills);
    }

    const { data: jobs, error: jobsError } = await jobQuery.limit(50);

    if (jobsError) throw jobsError;

    // For each job, calculate match score using Gemini
    const jobsWithScores = await Promise.all(
      (jobs || []).map(async (job) => {
        const studentProfile = {
          skills: resume?.extracted_data?.skills || [],
          experience: resume?.extracted_data?.experience || [],
          target_roles: profile?.target_roles || [],
          career_score: profile?.career_score || 0
        };

        // Optimize: Limit job description and requirements
        const jobDesc = (job.description || "").substring(0, 300);
        const jobReq = (job.requirements || "").substring(0, 200);
        const studentSkills = studentProfile.skills.slice(0, 10).join(", ");

        const prompt = `Job match score. Return JSON only:
{
  "match_score": <0-100>,
  "matched_skills": [<skills>],
  "missing_skills": [<skills>],
  "explanation": "<brief>",
  "improvement_tips": [<2-3 tips>]
}

Student skills: ${studentSkills}
Job: ${job.title} at ${job.company_name}
Desc: ${jobDesc}
Req: ${jobReq}
Job skills: ${(job.skills_required || []).slice(0, 10).join(", ")}`;

        try {
          const geminiResponse = await fetch(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: prompt }]
                }]
              })
            }
          );

          if (!geminiResponse.ok) {
            return { job, match_score: 0, matched_skills: [], missing_skills: [] };
          }

          const geminiData = await geminiResponse.json();
          const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const matchData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

          return {
            job,
            match_score: matchData.match_score || 0,
            matched_skills: matchData.matched_skills || [],
            missing_skills: matchData.missing_skills || [],
            explanation: matchData.explanation || "",
            improvement_tips: matchData.improvement_tips || []
          };
        } catch (e) {
          return { job, match_score: 0, matched_skills: [], missing_skills: [] };
        }
      })
    );

    // Sort by match score
    jobsWithScores.sort((a, b) => b.match_score - a.match_score);

    return new Response(
      JSON.stringify({
        success: true,
        jobs: jobsWithScores.slice(0, 20) // Return top 20
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
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

