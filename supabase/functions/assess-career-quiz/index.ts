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
    const { user_id, quiz_responses } = await req.json();

    if (!user_id || !quiz_responses) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id and quiz_responses" }),
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

    // Fetch user profile for context
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    // Build prompt for AI assessment
    const prompt = `Analyze this career assessment quiz and provide insights. Return JSON only:
{
  "quiz_score": <0-100 based on completeness and thoughtfulness>,
  "career_insights": {
    "strengths": ["<strength1>", "<strength2>", "<strength3>"],
    "interests": ["<interest1>", "<interest2>", "<interest3>"],
    "personality_traits": ["<trait1>", "<trait2>", "<trait3>"],
    "work_style": "<description>",
    "career_readiness": "<assessment>"
  },
  "suggested_roles": [
    {
      "role": "<role name>",
      "match_percentage": <0-100>,
      "reason": "<why this role matches>"
    }
  ],
  "recommendations": "<personalized career advice>"
}

Quiz Responses: ${JSON.stringify(quiz_responses)}
User Profile: ${profile?.full_name || "Student"}, ${profile?.department || "N/A"}, ${profile?.year || "N/A"}`;

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
    const assessment = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    // Calculate quiz score (completeness + AI assessment)
    const responseCount = Object.keys(quiz_responses).length;
    const completenessScore = Math.min((responseCount / 15) * 50, 50); // Max 50 points for completeness
    const aiScore = assessment.quiz_score || 50; // AI assessment score
    const finalScore = Math.round(completenessScore + (aiScore * 0.5));

    // Get college_id from profile
    const collegeId = profile?.college_id || null;

    // Save quiz results
    const { data: quizData, error: quizError } = await supabaseClient
      .from("career_quizzes")
      .upsert({
        user_id,
        college_id: collegeId,
        quiz_responses,
        quiz_score: finalScore,
        career_insights: assessment.career_insights || {},
        suggested_roles: assessment.suggested_roles?.map((r: any) => r.role) || [],
        completed_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      })
      .select()
      .single();

    if (quizError) {
      console.error("Error saving quiz:", quizError);
    }

    // Update profile with quiz score
    await supabaseClient
      .from("profiles")
      .update({ quiz_score: finalScore })
      .eq("user_id", user_id);

    // Recalculate career score
    try {
      const { data: profileData } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id", user_id)
        .single();
      
      const { data: resumeData } = await supabaseClient
        .from("resumes")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_primary", true)
        .maybeSingle();
      
      const { data: linkedinData } = await supabaseClient
        .from("linkedin_profiles")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle();
      
      const { data: applicationsData } = await supabaseClient
        .from("applications")
        .select("id")
        .eq("user_id", user_id);

      const resumeScore = resumeData?.ats_score || 0;
      const linkedinScore = linkedinData?.completeness_score || 0;
      const quizScore = finalScore;
      const applicationCount = applicationsData?.length || 0;
      const activityScore = Math.min(applicationCount * 10, 100);

      const careerScore = Math.round(
        (resumeScore * 0.35) +
        (linkedinScore * 0.25) +
        (quizScore * 0.25) +
        (activityScore * 0.15)
      );

      await supabaseClient
        .from("profiles")
        .update({ career_score: careerScore })
        .eq("user_id", user_id);
    } catch (e) {
      console.warn("Failed to recalculate career score:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        quiz_score: finalScore,
        assessment,
        quiz_id: quizData?.id
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error("Error assessing career quiz:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to assess career quiz" }),
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

