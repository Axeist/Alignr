import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current time and calculate 15 minutes from now
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    
    // Format times for database query
    const reminderDate = reminderTime.toISOString().split('T')[0];
    const reminderTimeStr = reminderTime.toTimeString().slice(0, 5) + ":00"; // HH:MM:SS format

    // Find interviews scheduled for 15 minutes from now
    const { data: interviews, error: interviewsError } = await supabaseClient
      .from("interviews")
      .select(`
        *,
        applications!inner(
          jobs(title, company_name)
        ),
        student:profiles!interviews_student_id_fkey(full_name, email),
        alumni:profiles!interviews_alumni_id_fkey(full_name, email)
      `)
      .eq("interview_date", reminderDate)
      .eq("status", "pending")
      .gte("interview_time", reminderTimeStr.slice(0, 5))
      .lt("interview_time", reminderTimeStr.slice(0, 5) + ":59");

    if (interviewsError) {
      console.error("Error fetching interviews:", interviewsError);
      throw interviewsError;
    }

    if (!interviews || interviews.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No interviews scheduled for reminder",
          count: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Send reminder emails for each interview
    const emailPromises = interviews.map(async (interview: any) => {
      if (!interview.student?.email || !interview.meeting_link) {
        console.log("Skipping interview - missing email or meeting link:", interview.id);
        return;
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Interview Reminder</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${interview.student?.full_name || "Student"},
              </p>
              <p style="color: #333333; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0; font-weight: bold;">
                Your interview starts in 15 minutes!
              </p>
              <div style="background-color: #fff3cd; border-left: 4px solid #FF6B00; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px;"><strong>Interview Details:</strong></p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Position:</strong> ${interview.applications?.jobs?.title || "Position"} at ${interview.applications?.jobs?.company_name || "Company"}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Time:</strong> ${new Date(`2000-01-01T${interview.interview_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Interviewer:</strong> ${interview.alumni?.full_name || "Interviewer"}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${interview.meeting_link}" 
                   style="display: inline-block; background-color: #CAFF00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Join Meeting Now
                </a>
              </div>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                <strong>Meeting Link:</strong><br>
                <a href="${interview.meeting_link}" style="color: #0066FF; word-break: break-all;">${interview.meeting_link}</a>
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                Good luck with your interview!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: #ffffff; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Alignr. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      // Call send-interview-email function
      try {
        const { error: emailError } = await supabaseClient.functions.invoke("send-interview-email", {
          body: {
            emailData: {
              to: interview.student.email,
              subject: "Interview Reminder — 15 Minutes Left - Alignr",
              html: emailHtml,
              studentName: interview.student.full_name,
              alumniName: interview.alumni?.full_name || "Interviewer",
              interviewDate: interview.interview_date,
              interviewTime: interview.interview_time,
              meetingLink: interview.meeting_link,
              jobTitle: interview.applications?.jobs?.title || "Position",
              companyName: interview.applications?.jobs?.company_name || "Company",
            },
          },
        });

        if (emailError) {
          console.error("Error sending reminder email:", emailError);
        }
      } catch (emailErr) {
        console.error("Error invoking email function:", emailErr);
      }
    });

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reminder emails sent for ${interviews.length} interview(s)`,
        count: interviews.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in reminder cron job:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

