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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, target_role } = await req.json();

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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user data
    const [profileResult, resumeResult, pathResult] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user_id).single(),
      supabaseClient.from("resumes").select("*").eq("user_id", user_id).eq("is_primary", true).maybeSingle(),
      supabaseClient.from("career_path_suggestions").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);

    const profile = profileResult.data;
    const resume = resumeResult.data;
    const careerPath = pathResult.data;

    // Use target_role from request or from profile/career path
    const role = target_role || 
                 profile?.target_roles?.[0] || 
                 careerPath?.top_matches?.primary || 
                 "Software Engineer";

    const currentSkills = resume?.extracted_data?.skills || [];
    const userInterests = profile?.interests || [];
    const department = profile?.department || "";

    const prompt = `Based on this student's profile, recommend skills to learn for ${role}. Return JSON only:
{
  "recommended_skills": [
    {
      "skill": "<skill name>",
      "category": "<technical/soft/domain>",
      "priority": "<high/medium/low>",
      "current_level": "<beginner/intermediate/advanced>",
      "target_level": "<beginner/intermediate/advanced>",
      "importance": <0-100>,
      "description": "<why this skill is important>",
      "learning_time": "<estimated time to learn>"
    }
  ],
  "skill_gaps": [
    {
      "skill": "<missing skill>",
      "gap_severity": "<critical/high/medium>",
      "impact": "<how this gap affects career>",
      "urgency": "<high/medium/low>"
    }
  ],
  "learning_resources": [
    {
      "skill": "<skill name>",
      "resources": [
        {
          "type": "<course/book/tutorial/project>",
          "title": "<resource title>",
          "provider": "<provider name>",
          "url": "<resource url>",
          "duration": "<time estimate>",
          "cost": "<free/paid/price>",
          "level": "<beginner/intermediate/advanced>"
        }
      ]
    }
  ],
  "priority_skills": ["<top 5 most important skills>"],
  "learning_roadmap": {
    "phase_1": {
      "duration": "<time>",
      "skills": ["<skill1>", "<skill2>"],
      "focus": "<description>"
    },
    "phase_2": {
      "duration": "<time>",
      "skills": ["<skill1>", "<skill2>"],
      "focus": "<description>"
    },
    "phase_3": {
      "duration": "<time>",
      "skills": ["<skill1>", "<skill2>"],
      "focus": "<description>"
    }
  }
}

Current Skills: ${currentSkills.join(", ")}
Target Role: ${role}
Department: ${department}
Interests: ${userInterests.join(", ")}`;

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
      throw new Error(`Groq API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    const responseText = groqData.choices?.[0]?.message?.content || "{}";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    // Get college_id from profile
    const collegeId = profile?.college_id || null;

    // Save recommendations - first try to update existing, then insert if not found
    const { data: existing } = await supabaseClient
      .from("skills_recommendations")
      .select("id")
      .eq("user_id", user_id)
      .eq("target_role", role)
      .maybeSingle();

    let skillsData;
    if (existing) {
      const { data, error } = await supabaseClient
        .from("skills_recommendations")
        .update({
          recommended_skills: recommendations.recommended_skills || [],
          skill_gaps: recommendations.skill_gaps || [],
          learning_resources: recommendations.learning_resources || [],
          priority_skills: recommendations.priority_skills || []
        })
        .eq("id", existing.id)
        .select()
        .single();
      skillsData = data;
      if (error) {
        console.error("Error updating skills recommendations:", error);
      }
    } else {
      const { data, error } = await supabaseClient
        .from("skills_recommendations")
        .insert({
          user_id,
          college_id: collegeId,
          target_role: role,
          recommended_skills: recommendations.recommended_skills || [],
          skill_gaps: recommendations.skill_gaps || [],
          learning_resources: recommendations.learning_resources || [],
          priority_skills: recommendations.priority_skills || []
        })
        .select()
        .single();
      skillsData = data;
      if (error) {
        console.error("Error inserting skills recommendations:", error);
      }
    }


    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        skills_id: skillsData?.id
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error("Error recommending skills:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to recommend skills" }),
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

