import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

serve(async (req) => {
  try {
    const { original_text, context, job_description } = await req.json();

    if (!original_text) {
      return new Response(
        JSON.stringify({ error: "Missing original_text" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = `Rewrite this resume bullet point for maximum impact. Use action verbs, quantify achievements, and add relevant keywords.

Original Text:
${original_text}

${job_description ? `Job Description Keywords: ${job_description.substring(0, 500)}` : ""}

${context ? `Context: ${JSON.stringify(context).substring(0, 500)}` : ""}

Provide 3 improved versions in JSON format:
{
  "rewrites": [
    "<version 1>",
    "<version 2>",
    "<version 3>"
  ]
}

Return ONLY valid JSON.`;

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
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    return new Response(
      JSON.stringify({
        success: true,
        rewrites: result.rewrites || []
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

