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
    const { linkedin_url, profile_text, user_id, target_roles } = await req.json();

    if (!user_id || (!linkedin_url && !profile_text)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    // Optimize: Limit profile text to 2000 chars
    const profileContent = (profile_text || `LinkedIn: ${linkedin_url}`).substring(0, 2000);

    const prompt = `LinkedIn analysis. Return JSON only:
{
  "completeness_score": <0-100>,
  "headline": {"score": <0-100>, "feedback": "<text>"},
  "about": {"score": <0-100>, "feedback": "<text>", "rewrite": "<optimized>"},
  "experience": {"score": <0-100>, "feedback": "<text>"},
  "skills": {"score": <0-100>, "feedback": "<text>"},
  "recommended_headlines": [<3-5 headlines>],
  "missing_skills": [<skills>],
  "checklist": [<3-5 actions>]
}

Profile: ${profileContent}
${target_roles ? `Target: ${target_roles.join(", ")}` : ""}`;

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
      const errorText = await geminiResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      // Handle specific error cases
      if (geminiResponse.status === 429) {
        const errorMessage = errorData?.error?.message || "API quota exceeded";
        console.error("Gemini API quota exceeded:", errorMessage);
        return new Response(
          JSON.stringify({ 
            error: "AI service is currently at capacity. Please try again later or contact support if this persists.",
            code: "QUOTA_EXCEEDED",
            details: "The AI analysis service has reached its usage limit. Please wait a few minutes before trying again."
          }),
          { 
            status: 429,
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        );
      }

      if (geminiResponse.status === 503 || geminiResponse.status === 502) {
        return new Response(
          JSON.stringify({ 
            error: "AI service is temporarily unavailable. Please try again in a few moments.",
            code: "SERVICE_UNAVAILABLE"
          }),
          { 
            status: 503,
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        );
      }

      // For other errors, throw with more context
      throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorData?.error?.message || errorText}`);
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

    // Upsert LinkedIn profile - ensure about_rewrite is stored in analysis_result
    const analysisResultWithRewrite = {
      ...analysisResult,
      about: {
        ...analysisResult.about,
        rewrite: analysisResult.about?.rewrite || ""
      }
    };

    const { error: upsertError } = await supabaseClient
      .from("linkedin_profiles")
      .upsert({
        user_id,
        linkedin_url: linkedin_url || null,
        profile_text: profile_text || null,
        completeness_score: analysisResult.completeness_score || 0,
        analysis_result: analysisResultWithRewrite,
        last_analyzed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      });

    if (upsertError) {
      console.error("Error upserting LinkedIn profile:", upsertError);
      // Don't fail the request if upsert fails - analysis is still valid
      // Just log the error
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
        about_rewrite: analysisResult.about?.rewrite || ""
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error("Error analyzing LinkedIn profile:", error);
    
    // Check if it's a known error type
    const errorMessage = error.message || "Failed to analyze LinkedIn profile";
    
    // Provide user-friendly error messages
    let userMessage = errorMessage;
    let statusCode = 500;
    
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      userMessage = "AI service is currently at capacity. Please try again later.";
      statusCode = 429;
    } else if (errorMessage.includes("GEMINI_API_KEY")) {
      userMessage = "AI service is not properly configured. Please contact support.";
      statusCode = 503;
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        code: statusCode === 429 ? "QUOTA_EXCEEDED" : statusCode === 503 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR"
      }),
      { 
        status: statusCode, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }
});

