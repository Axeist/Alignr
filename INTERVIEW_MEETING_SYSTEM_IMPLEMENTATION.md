# Custom Interview Meeting Link System - Implementation Summary

## Overview
This document summarizes the implementation of the custom interview meeting link system that replaces Google Meet with auto-generated meeting links.

## ✅ Completed Features

### 1. Shortlist Modal
- **Location**: `src/components/ShortlistInterviewModal.tsx`
- **Functionality**: 
  - Shows modal when Alumni clicks "Shortlist"
  - Displays two buttons: "Proceed with Student's Proposed Date & Time" and "Request for Reschedule"
  - Shows student's proposed schedule if available

### 2. Meeting Link Generation
- **Location**: `src/lib/meeting.ts`
- **Functions**:
  - `generateRoomId(length)`: Generates unique 10-character room ID
  - `generateMeetingLink(roomId)`: Creates URL in format `https://meet.alignr.in/{roomId}`

### 3. Interview Scheduling Flow
- **Location**: `src/pages/alumni/Applications.tsx`
- **When "Proceed" is clicked**:
  - Generates unique meeting link automatically
  - Saves interview record with:
    - `student_id`
    - `alumni_id`
    - `interview_date` (uses student's proposed date or defaults to tomorrow)
    - `interview_time` (uses student's proposed time or defaults to 10:00 AM)
    - `meeting_link` (auto-generated)
    - `status` = "pending" (represents "Interview Scheduled")
  - Sends immediate email notification to student
  - Updates application status to "interview_scheduled"

### 4. Email System
- **Email Service**: `supabase/functions/send-interview-email/index.ts`
  - Sends interview scheduled emails
  - Can be integrated with Resend, SendGrid, or other email services
  - Falls back to email_queue table for async processing

- **Email Templates**: `src/lib/email-templates.ts`
  - `generateInterviewScheduledEmail()`: Immediate notification email
  - `generateInterviewReminderEmail()`: 15-minute reminder email

- **Reminder Cron Job**: `supabase/functions/send-interview-reminders/index.ts`
  - Checks for interviews 15 minutes before scheduled time
  - Sends reminder emails automatically
  - Can be scheduled using Supabase Cron or external scheduler

### 5. Meeting UI Page
- **Location**: `src/pages/Meet.tsx`
- **Route**: `/meet/:roomId`
- **Features**:
  - Embeds Jitsi Meet using IFrame API
  - Auto-joins user to meeting room
  - Custom controls (mute, video, screen share)
  - Shows participant count
  - Uses public Jitsi instance (meet.jit.si)

### 6. Student Portal Updates
- **Location**: `src/pages/student/Applications.tsx`
- **Changes**:
  - Removed meeting link input field (auto-generated)
  - Shows interview details in read-only mode:
    - Date
    - Time
    - Meeting link (clickable)
    - Status: "Interview Scheduled"
  - Students cannot edit interview details once scheduled
  - Can only request reschedule

### 7. Alumni Portal Updates
- **Location**: `src/pages/alumni/Interviews.tsx`
- **Already displays**:
  - Meeting links
  - Scheduled date/time
  - Student information
  - Interview status

### 8. Reschedule Flow
- **When "Request for Reschedule" is clicked**:
  - Sets application status to "rescheduling_pending"
  - Student can propose new date/time
  - Alumni gets Accept/Reject options
  - If Accept → generates new meeting link
  - If Reject → keeps old schedule + old meeting link

## Database Schema

### Interviews Table
- `id` (UUID)
- `application_id` (UUID)
- `student_id` (UUID)
- `alumni_id` (UUID)
- `job_id` (UUID)
- `interview_date` (DATE) - Final confirmed date
- `interview_time` (TIME) - Final confirmed time
- `mode` (TEXT) - online, offline, phone, video_call
- `status` (TEXT) - pending (scheduled), completed, rejected, selected, cancelled
- `meeting_link` (TEXT) - Auto-generated link
- `location` (TEXT) - For offline interviews
- `requested_date` (DATE) - For reschedule requests
- `requested_time` (TIME) - For reschedule requests
- `reschedule_status` (TEXT) - pending, accepted, rejected

### Email Queue Table (Optional)
- `id` (UUID)
- `to_email` (TEXT)
- `subject` (TEXT)
- `html_content` (TEXT)
- `status` (TEXT) - pending, sent, failed
- `created_at` (TIMESTAMPTZ)
- `sent_at` (TIMESTAMPTZ)

## Setup Instructions

### 1. Deploy Edge Functions
```bash
# Deploy email sending function
supabase functions deploy send-interview-email

# Deploy reminder cron job
supabase functions deploy send-interview-reminders
```

### 2. Configure Email Service
Edit `supabase/functions/send-interview-email/index.ts` and:
- Option 1: Add Resend API key and uncomment Resend integration
- Option 2: Use email_queue table and process with external service
- Option 3: Integrate with SendGrid, AWS SES, or other email service

### 3. Set Up Cron Job
Configure the reminder function to run every minute:
- **Supabase Dashboard**: Go to Database → Cron Jobs
- **Or use external scheduler**: Call the function endpoint every minute
- **Or use pg_cron**: Set up PostgreSQL cron job

Example cron schedule (every minute):
```sql
SELECT cron.schedule(
  'send-interview-reminders',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-interview-reminders',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### 4. Configure Jitsi (Optional)
For production, consider:
- Self-hosting Jitsi Meet
- Using Jitsi Cloud with custom domain
- Configuring authentication if needed

Current implementation uses public Jitsi instance (meet.jit.si).

## Email Integration Options

### Option 1: Resend (Recommended)
1. Sign up at https://resend.com
2. Get API key
3. Add to Supabase secrets: `RESEND_API_KEY`
4. Uncomment Resend code in `send-interview-email/index.ts`

### Option 2: Email Queue + External Processor
1. Emails are stored in `email_queue` table
2. Create external service to process queue
3. Poll `email_queue` table for pending emails
4. Send via your preferred email service

### Option 3: Supabase Email (Limited)
- Supabase has limited email capabilities
- Consider using Supabase Auth email templates for simple notifications
- For production, use dedicated email service

## Testing

### Test Interview Scheduling
1. As Alumni, go to Applications page
2. Click "Shortlist" on an application
3. Click "Proceed" in modal
4. Verify:
   - Meeting link is generated
   - Interview record is created
   - Email is sent (check logs)
   - Student portal shows interview details

### Test Meeting Page
1. Navigate to `/meet/{roomId}`
2. Verify:
   - Jitsi loads correctly
   - Can join meeting
   - Controls work (mute, video, etc.)

### Test Reminder Emails
1. Schedule interview for 15 minutes from now
2. Wait for cron job to run
3. Verify reminder email is sent

## Notes

- Meeting links use format: `https://meet.alignr.in/{roomId}`
- Room IDs are 10-character alphanumeric strings
- Jitsi Meet is embedded via IFrame API (no API keys needed)
- Email sending requires external service integration
- Cron job should run every minute to catch all 15-minute reminders

## Future Enhancements

- [ ] Add meeting recording functionality
- [ ] Integrate with calendar (Google Calendar, Outlook)
- [ ] Add meeting analytics
- [ ] Support for multiple interview rounds
- [ ] Video quality settings
- [ ] Waiting room functionality
- [ ] Meeting notes integration

