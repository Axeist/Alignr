-- Add DELETE policy for college_events
-- This allows college admins and organizers to delete events

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "College admins can delete events" ON public.college_events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON public.college_events;
DROP POLICY IF EXISTS "College and admins can delete events" ON public.college_events;

-- Create DELETE policy: College admins can delete events from their college, 
-- and organizers can delete their own events
CREATE POLICY "College and organizers can delete events" ON public.college_events
  FOR DELETE
  USING (
    -- College admins can delete events from their college
    (
      public.has_role(auth.uid(), 'college')
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND p.college_id = college_events.college_id
      )
    )
    OR
    -- Organizers can delete their own events
    (auth.uid() = organizer_id)
    OR
    -- Admins can delete any events
    (public.has_role(auth.uid(), 'admin'))
  );

