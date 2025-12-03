-- Add rejection_reason field to applications table
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.applications.rejection_reason IS 'Reason provided by alumni/employer when rejecting an application';

