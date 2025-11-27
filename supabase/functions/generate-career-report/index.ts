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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all user data
    const [profileResult, resumeResult, linkedinResult, skillPathResult, applicationsResult] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user_id).single(),
      supabaseClient.from("resumes").select("*").eq("user_id", user_id).eq("is_primary", true).single(),
      supabaseClient.from("linkedin_profiles").select("*").eq("user_id", user_id).single(),
      supabaseClient.from("skill_paths").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(1).single(),
      supabaseClient.from("applications").select("*, jobs(*)").eq("user_id", user_id).order("applied_at", { ascending: false }).limit(10)
    ]);

    const profile = profileResult.data;
    const resume = resumeResult.data;
    const linkedin = linkedinResult.data;
    const skillPath = skillPathResult.data;
    const applications = applicationsResult.data || [];

    // Build comprehensive prompt for Gemini
    const userData = {
      profile: {
        name: profile?.full_name || "Student",
        email: profile?.email || "",
        college: profile?.college_name || "",
        target_roles: profile?.target_roles || [],
        career_score: profile?.career_score || 0,
        bio: profile?.bio || ""
      },
      resume: {
        ats_score: resume?.ats_score || 0,
        strengths: resume?.analysis_result?.strengths || [],
        gaps: resume?.analysis_result?.gaps || [],
        skills: resume?.extracted_data?.skills || [],
        experience: resume?.extracted_data?.experience || [],
        education: resume?.extracted_data?.education || []
      },
      linkedin: {
        completeness_score: linkedin?.completeness_score || 0,
        headline_score: linkedin?.analysis_result?.headline?.score || 0,
        about_score: linkedin?.analysis_result?.about?.score || 0,
        experience_score: linkedin?.analysis_result?.experience?.score || 0,
        skills_score: linkedin?.analysis_result?.skills?.score || 0
      },
      skill_path: {
        target_role: skillPath?.target_role || "",
        progress: skillPath?.progress_percentage || 0,
        milestones: skillPath?.milestones || []
      },
      applications: {
        total: applications.length,
        recent: applications.slice(0, 5).map((app: any) => ({
          job_title: app.jobs?.title || "",
          company: app.jobs?.company_name || "",
          status: app.status
        }))
      }
    };

    // Optimize: Create compact data summary
    const compactData = {
      name: userData.profile.name,
      scores: {
        career: userData.profile.career_score,
        resume: userData.resume.ats_score,
        linkedin: userData.linkedin.completeness_score
      },
      skills: userData.resume.skills.slice(0, 15),
      target: userData.profile.target_roles.slice(0, 3),
      role: userData.skill_path.target_role
    };

    const prompt = `Career report. Return JSON only:
{
  "career_summary": {
    "overview": "<2-3 para summary>",
    "career_score": ${compactData.scores.career},
    "resume_score": ${compactData.scores.resume},
    "linkedin_score": ${compactData.scores.linkedin},
    "overall_assessment": "<brief assessment>"
  },
  "profile_scores": {
    "career_score": {"value": ${compactData.scores.career}, "breakdown": "<text>"},
    "resume_score": {"value": ${compactData.scores.resume}, "breakdown": "<text>"},
    "linkedin_score": {"value": ${compactData.scores.linkedin}, "breakdown": "<text>"}
  },
  "recommended_roles": [{"role": "<name>", "match_percentage": <0-100>, "reason": "<text>", "required_skills": [<skills>], "salary_range": "<range>"}],
  "skills_gap_analysis": {
    "current_skills": [<skills>],
    "missing_skills": [<skills>],
    "priority_skills": [<top5>],
    "gap_explanation": "<text>"
  },
  "learning_resources": {
    "courses": [{"title": "<title>", "provider": "<name>", "url": "<url>", "duration": "<time>", "level": "<level>", "free": <bool>}],
    "resources": [{"title": "<title>", "type": "<type>", "url": "<url>", "description": "<desc>"}]
  },
  "action_plan": {
    "30_days": [<3 items>],
    "60_days": [<3 items>],
    "90_days": [<3 items>]
  },
  "next_steps": [<3 steps>]
}

Data: ${JSON.stringify(compactData)}`;

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
    
    // Parse JSON from response
    let reportData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      reportData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (e) {
      throw new Error(`Failed to parse AI response: ${e.message}`);
    }

    // Generate HTML report
    const htmlReport = generateHTMLReport(userData, reportData);

    // Upload HTML report to storage
    const fileName = `career-reports/${user_id}/${Date.now()}.html`;
    const { error: uploadError } = await supabaseClient.storage
      .from("career-reports")
      .upload(fileName, htmlReport, {
        contentType: "text/html",
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload report: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from("career-reports")
      .getPublicUrl(fileName);

    // Save report metadata to database (if career_reports table exists)
    // For now, we'll just return the URL

    return new Response(
      JSON.stringify({
        success: true,
        report_url: publicUrl,
        report_data: reportData
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: any) {
    console.error("Error generating career report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate career report" }),
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

function generateHTMLReport(userData: any, reportData: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Career Report - ${userData.profile.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.1em; opacity: 0.9; }
    .content { padding: 40px; }
    .section { margin-bottom: 40px; }
    .section h2 {
      color: #667eea;
      font-size: 1.8em;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    .section h3 {
      color: #764ba2;
      font-size: 1.3em;
      margin: 20px 0 10px 0;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .score-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .score-value {
      font-size: 3em;
      font-weight: bold;
      color: #667eea;
    }
    .score-label {
      font-size: 1.1em;
      color: #666;
      margin-top: 10px;
    }
    ul { margin-left: 20px; margin-top: 10px; }
    li { margin-bottom: 8px; }
    .role-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      border-left: 4px solid #667eea;
    }
    .action-plan {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .action-period {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }
    .badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.9em;
      margin: 5px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Career Report</h1>
      <p>${userData.profile.name} - ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="content">
      <div class="section">
        <h2>Career Summary</h2>
        <p>${reportData.career_summary?.overview || "No summary available"}</p>
        <div class="score-grid">
          <div class="score-card">
            <div class="score-value">${reportData.career_summary?.career_score || 0}</div>
            <div class="score-label">Career Score</div>
          </div>
          <div class="score-card">
            <div class="score-value">${reportData.career_summary?.resume_score || 0}</div>
            <div class="score-label">Resume Score</div>
          </div>
          <div class="score-card">
            <div class="score-value">${reportData.career_summary?.linkedin_score || 0}</div>
            <div class="score-label">LinkedIn Score</div>
          </div>
        </div>
        <p><strong>Overall Assessment:</strong> ${reportData.career_summary?.overall_assessment || ""}</p>
      </div>

      <div class="section">
        <h2>Recommended Roles</h2>
        ${(reportData.recommended_roles || []).map((role: any) => `
          <div class="role-card">
            <h3>${role.role} - ${role.match_percentage}% Match</h3>
            <p>${role.reason || ""}</p>
            <p><strong>Required Skills:</strong> ${(role.required_skills || []).map((s: string) => `<span class="badge">${s}</span>`).join("")}</p>
            <p><strong>Salary Range:</strong> ${role.salary_range || "Not specified"}</p>
          </div>
        `).join("")}
      </div>

      <div class="section">
        <h2>Skills Gap Analysis</h2>
        <h3>Current Skills</h3>
        <p>${(reportData.skills_gap_analysis?.current_skills || []).map((s: string) => `<span class="badge">${s}</span>`).join("")}</p>
        <h3>Missing Skills</h3>
        <p>${(reportData.skills_gap_analysis?.missing_skills || []).map((s: string) => `<span class="badge" style="background: #e74c3c;">${s}</span>`).join("")}</p>
        <h3>Priority Skills to Learn</h3>
        <ul>
          ${(reportData.skills_gap_analysis?.priority_skills || []).map((s: string) => `<li>${s}</li>`).join("")}
        </ul>
        <p>${reportData.skills_gap_analysis?.gap_explanation || ""}</p>
      </div>

      <div class="section">
        <h2>Learning Resources</h2>
        <h3>Recommended Courses</h3>
        <ul>
          ${(reportData.learning_resources?.courses || []).map((course: any) => `
            <li><strong>${course.title}</strong> - ${course.provider} (${course.duration}) - <a href="${course.url}" target="_blank">View Course</a></li>
          `).join("")}
        </ul>
        <h3>Additional Resources</h3>
        <ul>
          ${(reportData.learning_resources?.resources || []).map((resource: any) => `
            <li><strong>${resource.title}</strong> (${resource.type}) - <a href="${resource.url}" target="_blank">View Resource</a></li>
          `).join("")}
        </ul>
      </div>

      <div class="section">
        <h2>30/60/90-Day Action Plan</h2>
        <div class="action-plan">
          <div class="action-period">
            <h3>30 Days</h3>
            <ul>
              ${(reportData.action_plan?.["30_days"] || []).map((action: string) => `<li>${action}</li>`).join("")}
            </ul>
          </div>
          <div class="action-period">
            <h3>60 Days</h3>
            <ul>
              ${(reportData.action_plan?.["60_days"] || []).map((action: string) => `<li>${action}</li>`).join("")}
            </ul>
          </div>
          <div class="action-period">
            <h3>90 Days</h3>
            <ul>
              ${(reportData.action_plan?.["90_days"] || []).map((action: string) => `<li>${action}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Next Steps</h2>
        <ul>
          ${(reportData.next_steps || []).map((step: string) => `<li>${step}</li>`).join("")}
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()} | Alignr Career Platform</p>
    </div>
  </div>
</body>
</html>`;
}

