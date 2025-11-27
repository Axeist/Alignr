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

    // Fetch user profile data
    const [profileResult, resumeResult, linkedinResult] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user_id).single(),
      supabaseClient.from("resumes").select("*").eq("user_id", user_id).eq("is_primary", true).maybeSingle(),
      supabaseClient.from("linkedin_profiles").select("*").eq("user_id", user_id).maybeSingle()
    ]);

    const profile = profileResult.data;
    const resume = resumeResult.data;
    const linkedin = linkedinResult.data;

    // Build user context
    const userContext = {
      name: profile?.full_name || "Student",
      department: profile?.department || "",
      year: profile?.year || "",
      interests: profile?.interests || [],
      target_roles: profile?.target_roles || [],
      bio: profile?.bio || "",
      skills: resume?.extracted_data?.skills || [],
      experience: resume?.extracted_data?.experience || [],
      education: resume?.extracted_data?.education || [],
      linkedin_headline: linkedin?.analysis_result?.headline?.text || ""
    };

    const prompt = `Generate 15 personalized career assessment quiz questions based on this student's profile. Return JSON only:
{
  "questions": [
    {
      "id": "<unique_id>",
      "category": "<category_name>",
      "question": "<personalized question text>",
      "options": ["<option1>", "<option2>", "<option3>", "<option4>", "<option5>"]
    }
  ]
}

Student Profile:
- Name: ${userContext.name}
- Department: ${userContext.department || "Not specified"}
- Year: ${userContext.year || "Not specified"}
- Interests: ${userContext.interests.join(", ") || "Not specified"}
- Target Roles: ${userContext.target_roles.join(", ") || "Not specified"}
- Bio: ${userContext.bio || "Not provided"}
- Skills: ${userContext.skills.slice(0, 10).join(", ") || "Not specified"}
- Experience: ${JSON.stringify(userContext.experience?.slice(0, 3) || [])}
- Education: ${JSON.stringify(userContext.education || [])}
- LinkedIn Headline: ${userContext.linkedin_headline || "Not provided"}

Requirements:
1. Questions should be personalized based on their department, interests, target roles, and background
2. Include questions about: interests & passions, work style, current skills, learning preferences, career goals, work-life balance, challenges, values, team preferences, industry interest, location, growth, projects, feedback style, future vision
3. Each question should have 5 options
4. Make questions relevant to their field (${userContext.department || "general"})
5. Reference their interests (${userContext.interests.join(", ") || "general"}) and target roles (${userContext.target_roles.join(", ") || "general careers"}) when relevant
6. Use their experience and education to tailor questions`;

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
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    const responseText = groqData.choices?.[0]?.message?.content || "{}";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const questionsData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    return new Response(
      JSON.stringify({
        success: true,
        questions: questionsData.questions || []
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error("Error generating quiz questions:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate quiz questions" }),
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

