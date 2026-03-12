-- Enable pg_net extension for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: when a user sends a support message, call agent-runtime
CREATE OR REPLACE FUNCTION public.trigger_support_auto_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only for user messages
  IF NEW.from_type != 'user' THEN
    RETURN NEW;
  END IF;

  -- Fire-and-forget HTTP call to agent-runtime webhook
  PERFORM net.http_post(
    url := 'http://olu-agent-runtime-alb-316192720.us-west-2.elb.amazonaws.com/webhook/support-message',
    body := jsonb_build_object(
      'social_chat_id', NEW.social_chat_id,
      'text', NEW.text,
      'message_id', NEW.id
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to social_chat_messages
DROP TRIGGER IF EXISTS on_support_message_insert ON public.social_chat_messages;
CREATE TRIGGER on_support_message_insert
  AFTER INSERT ON public.social_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_support_auto_reply();
