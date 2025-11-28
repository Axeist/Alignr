import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not configured" }),
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
    // Show jobs that are:
    // 1. Approved/active jobs that are either open to all (no college_id) or match student's college
    // 2. Pending jobs from the same college (so students can see jobs posted by alumni from their college immediately)
    
    let jobQuery;
    
    if (profile?.college_id) {
      // Student has a college - show:
      // - Approved/active jobs (no college_id OR matching college_id)
      // - Pending jobs from the same college (alumni from same college)
      jobQuery = supabaseClient
        .from("jobs")
        .select("*")
        .or(
          `and(status.in.(approved,active),or(college_id.is.null,college_id.eq.${profile.college_id})),` +
          `and(status.eq.pending,college_id.eq.${profile.college_id})`
        );
    } else {
      // Student has no college - only show approved/active jobs with no college_id (open to all)
      jobQuery = supabaseClient
        .from("jobs")
        .select("*")
        .in("status", ["approved", "active"])
        .is("college_id", null);
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
          const groqResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content: "You are a helpful assistant that returns only valid JSON. Always return valid JSON objects without markdown formatting."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              response_format: { type: "json_object" }
            })
          });

          if (!groqResponse.ok) {
            return { job, match_score: 0, matched_skills: [], missing_skills: [] };
          }

          const groqData = await groqResponse.json();
          const responseText = groqData.choices?.[0]?.message?.content || "{}";
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

