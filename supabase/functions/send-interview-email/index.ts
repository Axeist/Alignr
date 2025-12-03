import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailData {
  to: string;
  subject: string;
  html: string;
  studentName?: string;
  alumniName?: string;
  interviewDate?: string;
  interviewTime?: string;
  meetingLink?: string;
  jobTitle?: string;
  companyName?: string;
}

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

    const { emailData }: { emailData: EmailData } = await req.json();

    // Option 1: Use Resend (recommended for production)
    // Uncomment and configure if you have Resend API key
    /*
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Alignr <noreply@alignr.in>",
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
        }),
      });
      
      if (!resendResponse.ok) {
        throw new Error("Failed to send email via Resend");
      }
      
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    */

    // Option 2: Store in email_queue table for processing by external service
    // This allows you to process emails asynchronously
    const { error: queueError } = await supabaseClient
      .from("email_queue")
      .insert({
        to_email: emailData.to,
        subject: emailData.subject,
        html_content: emailData.html,
        status: "pending",
        created_at: new Date().toISOString(),
      });

    if (queueError) {
      // If email_queue table doesn't exist, just log
      console.log("Email queue error (table may not exist):", queueError);
      console.log("Email data:", {
        to: emailData.to,
        subject: emailData.subject,
      });
    }

    // For development: Log email data
    console.log("Email to send:", {
      to: emailData.to,
      subject: emailData.subject,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email queued for sending",
        note: "Configure RESEND_API_KEY or email_queue table for actual email delivery"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

