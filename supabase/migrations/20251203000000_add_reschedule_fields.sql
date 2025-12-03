-- Add reschedule fields to interviews table
-- These fields store the requested reschedule details

-- Add reschedule request fields
ALTER TABLE public.interviews 
  ADD COLUMN IF NOT EXISTS requested_date DATE,
  ADD COLUMN IF NOT EXISTS requested_time TIME,
  ADD COLUMN IF NOT EXISTS requested_mode TEXT CHECK (requested_mode IN ('online', 'offline', 'phone', 'video_call') OR requested_mode IS NULL),
  ADD COLUMN IF NOT EXISTS requested_location TEXT,
  ADD COLUMN IF NOT EXISTS requested_meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS reschedule_status TEXT DEFAULT NULL CHECK (reschedule_status IN ('pending', 'accepted', 'rejected') OR reschedule_status IS NULL);

-- Add index for reschedule_status for faster queries
CREATE INDEX IF NOT EXISTS idx_interviews_reschedule_status ON public.interviews(reschedule_status) WHERE reschedule_status IS NOT NULL;

-- Add 'rescheduling_pending' to application_status enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'rescheduling_pending' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
  ) THEN
    ALTER TYPE public.application_status ADD VALUE 'rescheduling_pending';
  END IF;
END $$;

