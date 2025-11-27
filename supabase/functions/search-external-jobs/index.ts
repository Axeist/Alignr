import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const SERP_API_KEY = Deno.env.get("SERP_API_KEY");
const SERP_API_URL = "https://serpapi.com/search";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface JobSearchParams {
  user_id: string;
  query?: string;
  location?: string;
  platforms?: string[];
  limit?: number;
  auto_suggest?: boolean;
}

interface ExternalJob {
  title: string;
  company_name: string;
  description: string;
  location: string;
  job_type?: string;
  salary_range?: string;
  experience_level?: string;
  skills_required?: string[];
  source_platform: string;
  external_url: string;
  external_job_id?: string;
  posted_date?: string;
}

// Extract job roles from resume and LinkedIn (optimized for minimal tokens)
async function extractSuggestedJobRoles(
  resume: any,
  linkedin: any,
  profile: any
): Promise<string[]> {
  if (!GROQ_API_KEY) {
    // Fallback: extract from skills
    const skills = resume?.extracted_data?.skills || [];
    return skills.slice(0, 3).map((s: string) => `${s} Developer`);
  }

  // Minimize token usage - only essential data
  const resumeSkills = (resume?.extracted_data?.skills || []).slice(0, 8).join(", ");
  const resumeExp = (resume?.extracted_data?.experience || []).slice(0, 2).map((e: any) => e.title || e.role).join(", ");
  const linkedinText = (linkedin?.profile_text || "").substring(0, 200);
  const targetRoles = (profile?.target_roles || []).join(", ");

  // Minimal prompt for token efficiency
  const prompt = `Suggest 5 job titles. JSON only: {"suggested_roles": [<5 titles>]}
Skills: ${resumeSkills}
Experience: ${resumeExp}
LinkedIn: ${linkedinText}
Target: ${targetRoles || "any"}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Fastest, cheapest model
        messages: [
          {
            role: "system",
            content: "Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3, // Lower for consistency
        max_tokens: 150, // Limit response size
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const matchData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    
    return matchData.suggested_roles || [];
  } catch (e) {
    console.error("Role extraction error:", e);
    return [];
  }
}

// Search jobs using SerpAPI (Google Jobs engine)
async function searchJobsOnPlatform(
  query: string,
  location?: string
): Promise<ExternalJob[]> {
  if (!SERP_API_KEY) {
    console.warn("SERP_API_KEY not configured, returning empty results");
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: "google_jobs",
      q: query,
      location: location || "",
      api_key: SERP_API_KEY,
      num: "10", // Limit to 10 results per query to save API credits
    });

    const response = await fetch(`${SERP_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("SerpAPI error:", errorText);
      return [];
    }

    const data = await response.json();
    const jobs = data.jobs_results || [];

    // Helper function to safely convert date to ISO string
    const safeDateToISO = (dateValue: string | undefined | null): string | null => {
      if (!dateValue) return null;
      try {
        const date = new Date(dateValue);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return null;
        }
        return date.toISOString();
      } catch (error) {
        console.warn("Invalid date value:", dateValue);
        return null;
      }
    };

    return jobs.map((job: any) => ({
      title: job.title || "Job Title",
      company_name: job.company_name || "Company",
      description: job.description || "",
      location: job.location || location || "Location not specified",
      job_type: job.schedule_type || job.detected_extensions?.schedule_type || "Full-time",
      salary_range: job.detected_extensions?.salary || job.salary || "",
      experience_level: job.detected_extensions?.work_type || "",
      skills_required: [], // Extract from description if needed
      source_platform: "google_jobs", // SerpAPI uses Google Jobs which aggregates from multiple sources
      external_url: job.apply_options?.[0]?.link || job.link || "",
      external_job_id: job.job_id || `job_${Date.now()}_${Math.random()}`,
      posted_date: safeDateToISO(job.detected_extensions?.posted_at) || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("SerpAPI search error:", error);
    return [];
  }
}

// Calculate match score (optimized for minimal tokens)
async function calculateMatchScore(
  job: ExternalJob,
  resume: any
): Promise<{
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
}> {
  if (!GROQ_API_KEY) {
    return { match_score: 50, matched_skills: [], missing_skills: [] };
  }

  // Minimize token usage
  const studentSkills = (resume?.extracted_data?.skills || []).slice(0, 8).join(", ");
  const jobTitle = job.title.substring(0, 50);
  const jobDesc = (job.description || "").substring(0, 150);

  // Ultra-minimal prompt
  const prompt = `Score 0-100. JSON: {"match_score": <0-100>, "matched_skills": [<3 max>], "missing_skills": [<2 max>]}
Skills: ${studentSkills}
Job: ${jobTitle}
Desc: ${jobDesc}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 100, // Very limited response
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return { match_score: 50, matched_skills: [], missing_skills: [] };
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const matchData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    return {
      match_score: matchData.match_score || 50,
      matched_skills: (matchData.matched_skills || []).slice(0, 3),
      missing_skills: (matchData.missing_skills || []).slice(0, 2),
    };
  } catch (e) {
    console.error("Match score calculation error:", e);
    return { match_score: 50, matched_skills: [], missing_skills: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, query, location, platforms, limit = 15, auto_suggest = false }:
      JobSearchParams = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: user_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user profile, resume, and LinkedIn
    const [profileResult, resumeResult, linkedinResult] = await Promise.all([
      supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id", user_id)
        .single(),
      supabaseClient
        .from("resumes")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_primary", true)
        .single(),
      supabaseClient
        .from("linkedin_profiles")
        .select("*")
        .eq("user_id", user_id)
        .single(),
    ]);

    const profile = profileResult.data;
    const resume = resumeResult.data;
    const linkedin = linkedinResult.data;

    // Extract job roles if auto_suggest is true or no query provided
    let searchQueries: string[] = [];
    
    if (auto_suggest || !query) {
      const suggestedRoles = await extractSuggestedJobRoles(resume, linkedin, profile);
      searchQueries = suggestedRoles.length > 0 ? suggestedRoles.slice(0, 3) : ["Software Engineer"]; // Limit to 3 roles to save API credits
    } else {
      searchQueries = [query];
    }

    // Search jobs for each suggested role (limit to save API credits)
    const allJobs: ExternalJob[] = [];
    for (const searchQuery of searchQueries.slice(0, 3)) { // Max 3 queries
      try {
        const jobs = await searchJobsOnPlatform(searchQuery, location);
        allJobs.push(...jobs.slice(0, 5)); // Max 5 jobs per query
      } catch (error) {
        console.error(`Error searching for ${searchQuery}:`, error);
      }
    }

    // Remove duplicates based on external_url
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex((j) => j.external_url === job.external_url)
    );

    // Calculate match scores (batch process, but limit to top 20 to save tokens)
    const jobsToScore = uniqueJobs.slice(0, 20);
    const jobsWithScores = await Promise.all(
      jobsToScore.map(async (job) => {
        const matchData = await calculateMatchScore(job, resume);
        return {
          ...job,
          match_score: matchData.match_score,
          matched_skills: matchData.matched_skills,
          missing_skills: matchData.missing_skills,
        };
      })
    );

    // Sort by match score
    jobsWithScores.sort((a, b) => b.match_score - a.match_score);

    // Helper function to safely convert date to ISO string
    const safeDateToISO = (dateValue: string | undefined | null): string | null => {
      if (!dateValue) return null;
      try {
        const date = new Date(dateValue);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return null;
        }
        return date.toISOString();
      } catch (error) {
        console.warn("Invalid date value:", dateValue);
        return null;
      }
    };

    // Save top jobs to database for tracking
    const jobsToSave = jobsWithScores.slice(0, limit).map((job) => ({
      user_id,
      title: job.title,
      company_name: job.company_name,
      description: job.description.substring(0, 1000), // Limit description length
      location: job.location,
      job_type: job.job_type,
      salary_range: job.salary_range,
      experience_level: job.experience_level,
      skills_required: job.skills_required || [],
      source_platform: job.source_platform,
      external_url: job.external_url,
      external_job_id: job.external_job_id,
      match_score: job.match_score,
      matched_skills: job.matched_skills,
      missing_skills: job.missing_skills,
      posted_date: safeDateToISO(job.posted_date),
    }));

    // Upsert jobs (avoid duplicates)
    if (jobsToSave.length > 0) {
      await supabaseClient.from("external_jobs").upsert(jobsToSave, {
        onConflict: "user_id,external_url",
        ignoreDuplicates: false,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobs: jobsWithScores.slice(0, limit),
        total: jobsWithScores.length,
        suggested_roles: searchQueries,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
