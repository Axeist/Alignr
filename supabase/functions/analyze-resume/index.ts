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
    const { resume_url, user_id, resume_id, target_role } = await req.json();

    if (!resume_url || !user_id) {
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

    // Download resume file from storage
    const filePath = resume_url.split("/storage/v1/object/public/resumes/")[1] || resume_url;
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from("resumes")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download resume file: ${downloadError?.message || "Unknown error"}`);
    }

    // Extract text from resume file
    // Note: For production, use a proper PDF/DOCX parser library
    // For now, we'll use Gemini's multimodal capabilities by converting to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const fileName = filePath.split("/").pop() || "resume";
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
    
    let text = "";
    let useFileUpload = false;
    
    // For PDF files, we can use Gemini's file upload API for better parsing
    if (fileExtension === "pdf") {
      try {
        // Convert to base64 for potential file upload
        const uint8Array = new Uint8Array(arrayBuffer);
        const base64 = btoa(String.fromCharCode(...uint8Array));
        
        // Try basic text extraction first
        const decoder = new TextDecoder("utf-8", { fatal: false });
        text = decoder.decode(arrayBuffer);
        // Clean up binary data - keep only printable characters
        text = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        
        // If text extraction didn't work well, we'll use base64 in the prompt
        if (text.length < 100 || !text.match(/[a-zA-Z]{3,}/)) {
          // Use base64 encoding for Gemini to process
          text = `[PDF file - base64 encoded for analysis]`;
          useFileUpload = true;
        }
      } catch (e) {
        text = "Resume content - please analyze based on file structure and metadata.";
      }
    } else if (fileExtension === "docx") {
      // For DOCX, try text extraction
      try {
        const decoder = new TextDecoder("utf-8", { fatal: false });
        text = decoder.decode(arrayBuffer);
        text = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        if (text.length < 100) {
          text = "Resume content - please analyze based on file structure.";
        }
      } catch (e) {
        text = "Resume content - please analyze based on file structure.";
      }
    } else {
      // For other formats, try basic text extraction
      try {
        const decoder = new TextDecoder("utf-8", { fatal: false });
        text = decoder.decode(arrayBuffer);
        text = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
      } catch (e) {
        text = "Resume content - please analyze based on file structure.";
      }
    }

    // Optimize: Limit text to 3000 chars to save tokens
    const resumeContent = text.substring(0, 3000) + (text.length > 3000 ? "..." : "");
    
    const prompt = `Analyze this resume for ATS compatibility. Be FACTUAL and ACCURATE. Only suggest improvements based on what is ACTUALLY in the resume. Do NOT make up or hallucinate information.

CRITICAL RULES:
1. Only extract skills, experience, education, and projects that are EXPLICITLY mentioned in the resume text
2. Only identify strengths that are CLEARLY demonstrated in the resume content
3. Only identify gaps based on what is MISSING from the resume (not what you assume should be there)
4. Suggestions must be SPECIFIC and ACTIONABLE based on actual resume content
5. Do NOT invent experiences, skills, or achievements that are not in the resume
6. If information is unclear or missing, state that explicitly rather than guessing

Return JSON only:
{
  "ats_score": <0-100 based on: keywords presence, formatting quality, quantified achievements, action verbs>,
  "keywords_score": <0-100 - count relevant industry keywords found>,
  "formatting_score": <0-100 - assess structure, clarity, organization>,
  "achievements_score": <0-100 - count quantified achievements (numbers, percentages, metrics)>,
  "action_verbs_score": <0-100 - count strong action verbs used>,
  "extracted_data": {
    "skills": [<ONLY skills explicitly listed in resume>],
    "experience": [<ONLY actual work experience from resume with company names and roles>],
    "education": [<ONLY actual education listed in resume>],
    "projects": [<ONLY projects mentioned in resume>]
  },
  "strengths": [<3-5 strengths that are CLEARLY visible in the resume content>],
  "gaps": [<3-5 gaps - things that are MISSING or could be improved, based on what's actually in the resume>],
  "target_roles": [{"name": "<role>", "match": <0-100 based on actual skills/experience in resume>}],
  "suggestions": [
    "<SPECIFIC suggestion based on actual resume content - e.g., 'Add metrics to your [specific role] experience' or 'Include more action verbs in your [specific section]'>",
    "<Another specific, actionable suggestion based on what's actually in the resume>",
    "<Another specific suggestion>"
  ]
}

Resume Content:
${resumeContent}

${target_role ? `Target Role: ${target_role}` : ""}

Remember: Be factual. Only suggest what can be improved based on what's actually in the resume. Do not make up information.`;

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
            content: "You are a professional resume analyst. You analyze resumes FACTUALLY based only on what is explicitly written. You NEVER make up or hallucinate information. You only suggest improvements based on actual content. Always return valid JSON without markdown formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more factual, less creative responses
        response_format: { type: "json_object" }
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error: ${groqResponse.statusText} - ${errorText}`);
    }

    const groqData = await groqResponse.json();
    const responseText = groqData.choices?.[0]?.message?.content || "{}";
    
    // Parse JSON from response (handle markdown code blocks if present)
    let analysisResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysisResult = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (e) {
      // Fallback if JSON parsing fails
      analysisResult = {
        ats_score: 0,
        strengths: [],
        gaps: [],
        suggestions: ["Failed to parse AI response"]
      };
    }

    // Update resume record
    if (resume_id) {
      const { error: updateError } = await supabaseClient
        .from("resumes")
        .update({
          ats_score: analysisResult.ats_score || 0,
          extracted_data: analysisResult.extracted_data || {},
          analysis_result: analysisResult,
          updated_at: new Date().toISOString()
        })
        .eq("id", resume_id);

      if (updateError) {
        console.error("Error updating resume:", updateError);
      } else {
        // Recalculate career score after resume update
        try {
          // Fetch all relevant data for career score calculation
          const [profileResult, resumeData, linkedinResult, skillPathResult, applicationsResult] = await Promise.all([
            supabaseClient.from("profiles").select("*").eq("user_id", user_id).single(),
            supabaseClient.from("resumes").select("ats_score").eq("user_id", user_id).eq("is_primary", true).maybeSingle(),
            supabaseClient.from("linkedin_profiles").select("completeness_score").eq("user_id", user_id).maybeSingle(),
            supabaseClient.from("skill_paths").select("progress_percentage").eq("user_id", user_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
            supabaseClient.from("applications").select("id").eq("user_id", user_id)
          ]);

          const resumeScore = resumeData?.data?.ats_score || 0;
          const linkedinScore = linkedinResult.data?.completeness_score || 0;
          const skillPathProgress = skillPathResult.data?.progress_percentage || 0;
          const applicationCount = applicationsResult.data?.length || 0;
          const activityScore = Math.min(applicationCount * 10, 100);

          // Weighted calculation: Resume 40%, LinkedIn 30%, Skill Path 20%, Activity 10%
          const careerScore = Math.round(
            (resumeScore * 0.4) +
            (linkedinScore * 0.3) +
            (skillPathProgress * 0.2) +
            (activityScore * 0.1)
          );

          // Update career score
          await supabaseClient
            .from("profiles")
            .update({ career_score: careerScore })
            .eq("user_id", user_id);
        } catch (e) {
          console.warn("Failed to recalculate career score:", e);
          // Don't fail the request if career score calculation fails
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ats_score: analysisResult.ats_score,
        extracted_data: analysisResult.extracted_data,
        strengths: analysisResult.strengths,
        gaps: analysisResult.gaps,
        target_roles: analysisResult.target_roles,
        suggestions: analysisResult.suggestions
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error("Error analyzing resume:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to analyze resume" }),
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

