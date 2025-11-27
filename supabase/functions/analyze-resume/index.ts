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
    
    const prompt = `ATS resume analysis. Return JSON only:
{
  "ats_score": <0-100>,
  "keywords_score": <0-100>,
  "formatting_score": <0-100>,
  "achievements_score": <0-100>,
  "action_verbs_score": <0-100>,
  "extracted_data": {
    "skills": [<skills>],
    "experience": [<experience>],
    "education": [<education>],
    "projects": [<projects>]
  },
  "strengths": [<3-5 strengths>],
  "gaps": [<3-5 gaps>],
  "target_roles": [{"name": "<role>", "match": <0-100>}],
  "suggestions": [<3-5 suggestions>]
}

Resume: ${resumeContent}
${target_role ? `Target: ${target_role}` : ""}`;

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

