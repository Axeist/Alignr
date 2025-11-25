import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

serve(async (req) => {
  try {
    const { resume_url, user_id, resume_id, target_role } = await req.json();

    if (!resume_url || !user_id) {
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

    // Download resume file from storage
    const filePath = resume_url.split("/storage/v1/object/public/resumes/")[1] || resume_url;
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from("resumes")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error("Failed to download resume file");
    }

    // Extract text from PDF (simplified - in production, use pdf-parse or similar)
    const arrayBuffer = await fileData.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);
    // Note: This is a simplified extraction. For production, use a proper PDF parser.

    // Call Gemini API for analysis
    const prompt = `Analyze this resume as an ATS (Applicant Tracking System) specialist. 

Resume Text:
${text.substring(0, 10000)} ${text.length > 10000 ? "...(truncated)" : ""}

${target_role ? `Target Role: ${target_role}` : ""}

Provide a comprehensive analysis in JSON format with the following structure:
{
  "ats_score": <number 0-100>,
  "keywords_score": <number 0-100>,
  "formatting_score": <number 0-100>,
  "achievements_score": <number 0-100>,
  "action_verbs_score": <number 0-100>,
  "extracted_data": {
    "skills": [<array of skills>],
    "experience": [<array of experience entries>],
    "education": [<array of education entries>],
    "projects": [<array of projects>]
  },
  "strengths": [<array of 3-5 strengths>],
  "gaps": [<array of 3-5 gaps/weaknesses>],
  "target_roles": [
    {"name": "<role name>", "match": <percentage>}
  ],
  "suggestions": [<array of improvement suggestions>]
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
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

