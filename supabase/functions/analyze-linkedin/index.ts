import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

serve(async (req) => {
  try {
    const { linkedin_url, profile_text, user_id, target_roles } = await req.json();

    if (!user_id || (!linkedin_url && !profile_text)) {
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

    // For now, we'll use the provided text. In production, you'd scrape LinkedIn if URL provided.
    const profileContent = profile_text || `LinkedIn Profile: ${linkedin_url}`;

    // Call Gemini API for analysis
    const prompt = `Analyze this LinkedIn profile comprehensively.

Profile Content:
${profileContent}

${target_roles ? `Target Roles: ${JSON.stringify(target_roles)}` : ""}

Provide a comprehensive analysis in JSON format:
{
  "completeness_score": <number 0-100>,
  "headline": {
    "score": <number 0-100>,
    "feedback": "<feedback text>"
  },
  "about": {
    "score": <number 0-100>,
    "feedback": "<feedback text>",
    "rewrite": "<optimized about section>"
  },
  "experience": {
    "score": <number 0-100>,
    "feedback": "<feedback text>"
  },
  "skills": {
    "score": <number 0-100>,
    "feedback": "<feedback text>"
  },
  "recommended_headlines": [<array of 3-5 headline suggestions>],
  "missing_skills": [<array of skills to add>],
  "checklist": [<array of prioritized improvement actions>]
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
    
    // Parse JSON from response
    let analysisResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysisResult = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (e) {
      analysisResult = {
        completeness_score: 0,
        headline: { score: 0, feedback: "" },
        about: { score: 0, feedback: "" },
        experience: { score: 0, feedback: "" },
        skills: { score: 0, feedback: "" }
      };
    }

    // Upsert LinkedIn profile
    const { error: upsertError } = await supabaseClient
      .from("linkedin_profiles")
      .upsert({
        user_id,
        linkedin_url: linkedin_url || null,
        profile_text: profile_text || null,
        completeness_score: analysisResult.completeness_score || 0,
        analysis_result: analysisResult,
        last_analyzed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      });

    if (upsertError) {
      console.error("Error upserting LinkedIn profile:", upsertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        completeness_score: analysisResult.completeness_score,
        section_analysis: {
          headline: analysisResult.headline,
          about: analysisResult.about,
          experience: analysisResult.experience,
          skills: analysisResult.skills
        },
        recommended_headlines: analysisResult.recommended_headlines || [],
        missing_skills: analysisResult.missing_skills || [],
        checklist: analysisResult.checklist || [],
        about_rewrite: analysisResult.about?.rewrite
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

