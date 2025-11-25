import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

serve(async (req) => {
  try {
    const { user_id, target_role, current_skills, skill_gaps } = await req.json();

    if (!user_id || !target_role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user profile and resume data
    const [profileResult, resumeResult] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user_id).single(),
      supabaseClient.from("resumes").select("*").eq("user_id", user_id).eq("is_primary", true).single()
    ]);

    const profile = profileResult.data;
    const resume = resumeResult.data;

    const userSkills = current_skills || resume?.extracted_data?.skills || [];
    const gaps = skill_gaps || [];

    // Call Gemini API
    const prompt = `Create a comprehensive 3-6 month learning path to become a ${target_role}.

Current Skills: ${JSON.stringify(userSkills)}
Skill Gaps: ${JSON.stringify(gaps)}

Provide a structured learning path in JSON format:
{
  "path_name": "<path name>",
  "milestones": [
    {
      "title": "<milestone title>",
      "skills": [<array of skills>],
      "courses": [
        {
          "title": "<course title>",
          "provider": "<provider name>",
          "duration": "<duration>",
          "level": "<Beginner/Intermediate/Advanced>",
          "free": <boolean>,
          "url": "<course URL>"
        }
      ],
      "projects": [
        {
          "title": "<project title>",
          "description": "<description>",
          "tech_stack": [<array of technologies>],
          "hours": "<estimated hours>"
        }
      ],
      "time_estimate": "<2-4 weeks>",
      "completed": false
    }
  ],
  "final_project": {
    "title": "<capstone project title>",
    "description": "<description>",
    "skills": [<all skills learned>]
  }
}

Return ONLY valid JSON, no markdown formatting.`;

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
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const pathData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    // Get college_id from profile
    const collegeId = profile?.college_id || null;

    // Upsert skill path
    const { data: skillPath, error: upsertError } = await supabaseClient
      .from("skill_paths")
      .upsert({
        user_id,
        college_id: collegeId,
        target_role,
        skill_gaps: gaps,
        recommended_courses: pathData.milestones?.flatMap((m: any) => m.courses || []) || [],
        recommended_projects: pathData.milestones?.flatMap((m: any) => m.projects || []) || [],
        milestones: pathData.milestones || [],
        progress_percentage: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting skill path:", upsertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        skill_path: skillPath || pathData
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

