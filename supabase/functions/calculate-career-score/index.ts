import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all relevant data
    const [profileResult, resumeResult, linkedinResult, applicationsResult] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user_id).single(),
      supabaseClient.from("resumes").select("*").eq("user_id", user_id).eq("is_primary", true).maybeSingle(),
      supabaseClient.from("linkedin_profiles").select("*").eq("user_id", user_id).maybeSingle(),
      supabaseClient.from("applications").select("id").eq("user_id", user_id)
    ]);

    const profile = profileResult.data;
    const resume = resumeResult.data;
    const linkedin = linkedinResult.data;
    const applications = applicationsResult.data || [];

    // Calculate career score components
    const resumeScore = resume?.ats_score || 0;
    const linkedinScore = linkedin?.completeness_score || 0;
    const quizScore = profile?.quiz_score || 0;
    
    // Activity score based on number of applications (capped at 10 applications = 100 points)
    const applicationCount = applications.length;
    const activityScore = Math.min(applicationCount * 10, 100);

    // Weighted calculation
    // Resume: 35%, LinkedIn: 25%, Quiz: 25%, Activity: 15%
    const careerScore = Math.round(
      (resumeScore * 0.35) +
      (linkedinScore * 0.25) +
      (quizScore * 0.25) +
      (activityScore * 0.15)
    );

    // Update profile with calculated career score
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ career_score: careerScore })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating career score:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        career_score: careerScore,
        breakdown: {
          resume_score: resumeScore,
          linkedin_score: linkedinScore,
          quiz_score: quizScore,
          activity_score: activityScore
        }
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error("Error calculating career score:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to calculate career score" }),
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

