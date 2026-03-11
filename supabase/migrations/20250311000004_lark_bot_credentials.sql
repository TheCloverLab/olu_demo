-- Add Lark bot credentials to workspace_agents for multi-bot architecture.
-- Each agent can have its own Lark bot app for receiving and sending messages.

ALTER TABLE workspace_agents
  ADD COLUMN IF NOT EXISTS lark_app_id TEXT,
  ADD COLUMN IF NOT EXISTS lark_app_secret TEXT;

COMMENT ON COLUMN workspace_agents.lark_app_id IS 'Lark/Feishu bot App ID for this agent';
COMMENT ON COLUMN workspace_agents.lark_app_secret IS 'Lark/Feishu bot App Secret for this agent';

-- Populate Lark bot credentials for the 5 demo agents.
-- Matches by agent_key since UUIDs may differ between seed.sql and create-demo-accounts.mjs.

UPDATE workspace_agents SET lark_app_id = 'cli_a93a7467a9385ed0', lark_app_secret = 'RFhZ9C2KWBoFu3RxUYEYeb8POaLWeLzK' WHERE agent_key = 'aria';
UPDATE workspace_agents SET lark_app_id = 'cli_a93a71cc64789ed3', lark_app_secret = 'tEmmHMpP01fG3xmhg0FSrbTzzVgsUS6A' WHERE agent_key = 'chan';
UPDATE workspace_agents SET lark_app_id = 'cli_a93a74d7aab99ed1', lark_app_secret = 'J9fS4RqN0Ts6lEaYTNKMFbDHAmOTcroX' WHERE agent_key = 'eric';
UPDATE workspace_agents SET lark_app_id = 'cli_a93a6cd212b89ed4', lark_app_secret = 'Xabt1Z2xWK7KP1vqZ9kJzbD5Z2vpUVXO' WHERE agent_key = 'lisa';
UPDATE workspace_agents SET lark_app_id = 'cli_a93a70897d789ed0', lark_app_secret = 'XnZiZ5VltpRk7EvGXGxgmcxT4M5mGSgX' WHERE agent_key = 'max';
