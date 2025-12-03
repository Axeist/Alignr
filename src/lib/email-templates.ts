/**
 * Email templates for interview scheduling
 */

export interface InterviewEmailData {
  studentName: string;
  alumniName: string;
  interviewDate: string;
  interviewTime: string;
  meetingLink: string;
  jobTitle: string;
  companyName: string;
}

/**
 * Generate interview scheduled email HTML
 */
export function generateInterviewScheduledEmail(data: InterviewEmailData): string {
  const formattedDate = new Date(data.interviewDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = new Date(`2000-01-01T${data.interviewTime}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduled</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066FF 0%, #06B6D4 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Interview Scheduled</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${data.studentName},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your interview has been scheduled for the position of <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong>.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #0066FF; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px;"><strong>Interview Details:</strong></p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Time:</strong> ${formattedTime}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Interviewer:</strong> ${data.alumniName}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.meetingLink}" 
                   style="display: inline-block; background-color: #CAFF00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Join Meeting
                </a>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                <strong>Meeting Link:</strong><br>
                <a href="${data.meetingLink}" style="color: #0066FF; word-break: break-all;">${data.meetingLink}</a>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                  <strong>Instructions:</strong>
                </p>
                <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Please join the meeting 5 minutes before the scheduled time</li>
                  <li>Ensure you have a stable internet connection</li>
                  <li>Test your microphone and camera beforehand</li>
                  <li>Have your resume and any relevant documents ready</li>
                </ul>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                Best of luck with your interview!
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 10px 0 0 0;">
                Best regards,<br>
                The Alignr Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
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
}

/**
 * Generate interview reminder email HTML (15 minutes before)
 */
export function generateInterviewReminderEmail(data: InterviewEmailData): string {
  const formattedTime = new Date(`2000-01-01T${data.interviewTime}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `
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
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Interview Reminder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${data.studentName},
              </p>
              
              <p style="color: #333333; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0; font-weight: bold;">
                Your interview starts in 15 minutes!
              </p>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #FF6B00; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px;"><strong>Interview Details:</strong></p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Position:</strong> ${data.jobTitle} at ${data.companyName}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Time:</strong> ${formattedTime}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Interviewer:</strong> ${data.alumniName}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.meetingLink}" 
                   style="display: inline-block; background-color: #CAFF00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Join Meeting Now
                </a>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                <strong>Meeting Link:</strong><br>
                <a href="${data.meetingLink}" style="color: #0066FF; word-break: break-all;">${data.meetingLink}</a>
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                Good luck with your interview!
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 10px 0 0 0;">
                Best regards,<br>
                The Alignr Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
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
}

