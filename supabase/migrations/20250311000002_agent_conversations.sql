-- Agent conversation history for multi-turn chat support
-- Each agent + source (Lark chat, API session) has its own conversation thread.

create table if not exists agent_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_key text not null,                    -- agentId:sourceId
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text,
  tool_calls jsonb,
  tool_call_id text,
  name text,
  created_at timestamptz not null default now()
);

-- Index for fast lookups by conversation key + chronological order
create index if not exists idx_agent_conversations_key_time
  on agent_conversations (conversation_key, created_at desc);

-- RLS: service role only (agent runtime uses service role key)
alter table agent_conversations enable row level security;
