-- Event Notification System
-- This migration creates a table to track which students want to be notified about events
-- and a function to create notifications 1 hour before events

-- Create event_notification_subscriptions table
CREATE TABLE IF NOT EXISTS public.event_notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.event_notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Users can view own event notification subscriptions" ON public.event_notification_subscriptions;
DROP POLICY IF EXISTS "Users can insert own event notification subscriptions" ON public.event_notification_subscriptions;
DROP POLICY IF EXISTS "Users can delete own event notification subscriptions" ON public.event_notification_subscriptions;
DROP POLICY IF EXISTS "System can update event notification subscriptions" ON public.event_notification_subscriptions;

-- RLS Policies for event_notification_subscriptions
CREATE POLICY "Users can view own event notification subscriptions" 
  ON public.event_notification_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event notification subscriptions" 
  ON public.event_notification_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own event notification subscriptions" 
  ON public.event_notification_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can update event notification subscriptions" 
  ON public.event_notification_subscriptions 
  FOR UPDATE 
  USING (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_notification_subscriptions_event_id 
  ON public.event_notification_subscriptions(event_id);

CREATE INDEX IF NOT EXISTS idx_event_notification_subscriptions_user_id 
  ON public.event_notification_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_event_notification_subscriptions_notification_sent 
  ON public.event_notification_subscriptions(notification_sent);

-- Function to send event reminder notifications (to be called by cron job)
CREATE OR REPLACE FUNCTION send_event_reminder_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notifications_sent INTEGER := 0;
  v_subscription RECORD;
  v_event RECORD;
  v_one_hour_ago TIMESTAMPTZ;
  v_one_hour_from_now TIMESTAMPTZ;
BEGIN
  -- Calculate time window: events happening between now and 1 hour from now
  v_one_hour_from_now := NOW() + INTERVAL '1 hour';
  
  -- Find all subscriptions for events happening within the next hour
  -- where notification hasn't been sent yet
  FOR v_subscription IN
    SELECT ens.id, ens.user_id, ens.event_id
    FROM public.event_notification_subscriptions ens
    INNER JOIN public.college_events ce ON ens.event_id = ce.id
    WHERE ens.notification_sent = false
      AND ce.event_date > NOW()
      AND ce.event_date <= v_one_hour_from_now
  LOOP
    -- Get event details
    SELECT * INTO v_event
    FROM public.college_events
    WHERE id = v_subscription.event_id;
    
    -- Create notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      is_read
    ) VALUES (
      v_subscription.user_id,
      'event_reminder',
      'Event Reminder: ' || v_event.title,
      'Your event "' || v_event.title || '" starts in less than an hour at ' || 
      TO_CHAR(v_event.event_date, 'Mon DD, YYYY at HH24:MI') || 
      CASE WHEN v_event.location IS NOT NULL THEN ' at ' || v_event.location ELSE '' END || '.',
      '/student/events',
      false
    );
    
    -- Mark subscription as notification sent
    UPDATE public.event_notification_subscriptions
    SET notification_sent = true
    WHERE id = v_subscription.id;
    
    v_notifications_sent := v_notifications_sent + 1;
  END LOOP;
  
  RETURN v_notifications_sent;
END;
$$;

-- Create a function that students can call to subscribe to event notifications
CREATE OR REPLACE FUNCTION subscribe_to_event_notification(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if event exists and is in the future
  IF NOT EXISTS (
    SELECT 1 FROM public.college_events 
    WHERE id = p_event_id 
    AND event_date > NOW()
  ) THEN
    RAISE EXCEPTION 'Event not found or has already passed';
  END IF;
  
  -- Insert subscription (ON CONFLICT will handle duplicate subscriptions)
  INSERT INTO public.event_notification_subscriptions (user_id, event_id)
  VALUES (v_user_id, p_event_id)
  ON CONFLICT (user_id, event_id) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Create a function that students can call to unsubscribe from event notifications
CREATE OR REPLACE FUNCTION unsubscribe_from_event_notification(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Delete subscription
  DELETE FROM public.event_notification_subscriptions
  WHERE user_id = v_user_id AND event_id = p_event_id;
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_reminder_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION subscribe_to_event_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_from_event_notification(UUID) TO authenticated;

-- Note: To enable automatic event reminder notifications, you need to set up a cron job
-- that calls send_event_reminder_notifications() periodically (e.g., every 15 minutes)
-- 
-- If you have pg_cron extension enabled in Supabase, you can run this SQL:
-- 
-- SELECT cron.schedule(
--   'send-event-reminders',
--   '*/15 * * * *', -- Every 15 minutes
--   $$SELECT send_event_reminder_notifications()$$
-- );
--
-- Alternatively, you can use Supabase Edge Functions with a scheduled trigger,
-- or an external cron service to call the function via HTTP.

