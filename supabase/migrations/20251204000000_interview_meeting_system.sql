-- Migration for Custom Interview Meeting Link System
-- This migration ensures all necessary fields exist for the meeting link system

-- Ensure interviews table has all required fields
-- (Most fields should already exist from previous migrations)

-- Add index on meeting_link for faster lookups
CREATE INDEX IF NOT EXISTS idx_interviews_meeting_link ON public.interviews(meeting_link) WHERE meeting_link IS NOT NULL;

-- Add index on interview_date and interview_time for reminder cron job
CREATE INDEX IF NOT EXISTS idx_interviews_date_time ON public.interviews(interview_date, interview_time) WHERE status = 'pending';

-- Create email_queue table for email processing (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0
);

-- Create index on email_queue for processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status, created_at) WHERE status = 'pending';

-- Enable RLS on email_queue (only service role can access)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access email_queue
CREATE POLICY "Service role only" ON public.email_queue
  FOR ALL
  USING (false); -- No regular users can access, only service role

-- Add comment to interviews table
COMMENT ON COLUMN public.interviews.meeting_link IS 'Auto-generated meeting link in format https://meet.alignr.in/{roomId}';
COMMENT ON COLUMN public.interviews.status IS 'Interview status: pending (scheduled), completed, rejected, selected, cancelled';

