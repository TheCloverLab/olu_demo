-- ============================================================================
-- Agent Scheduled Jobs — cron-like task scheduling
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_agent_id UUID NOT NULL REFERENCES workspace_agents(id) ON DELETE CASCADE,
  job_key TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  task_description TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  run_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_agent_id, job_key)
);

CREATE INDEX idx_scheduled_jobs_agent ON agent_scheduled_jobs(workspace_agent_id);
CREATE INDEX idx_scheduled_jobs_enabled ON agent_scheduled_jobs(enabled) WHERE enabled = true;

-- ============================================================================
-- Agent Memory — per-agent long-term memory with vector search
-- ============================================================================

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES workspace_agents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('semantic', 'episodic', 'procedural')),
  scope TEXT NOT NULL DEFAULT '/',
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  importance REAL NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  embedding extensions.vector(1536),
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW index for fast vector similarity search
CREATE INDEX idx_agent_memories_embedding ON agent_memories
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_agent_memories_agent ON agent_memories(agent_id);
CREATE INDEX idx_agent_memories_type ON agent_memories(agent_id, memory_type);
CREATE INDEX idx_agent_memories_scope ON agent_memories(agent_id, scope);
CREATE INDEX idx_agent_memories_workspace ON agent_memories(workspace_id);
CREATE INDEX idx_agent_memories_metadata ON agent_memories USING gin(metadata);

-- ============================================================================
-- Search function with composite scoring
-- ============================================================================

CREATE OR REPLACE FUNCTION search_agent_memories(
  p_agent_id UUID,
  p_query_embedding extensions.vector(1536),
  p_memory_type TEXT DEFAULT NULL,
  p_scope_prefix TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold REAL DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  memory_type TEXT,
  scope TEXT,
  metadata JSONB,
  importance REAL,
  similarity REAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.memory_type,
    m.scope,
    m.metadata,
    m.importance,
    (1 - (m.embedding <=> p_query_embedding))::REAL AS similarity,
    m.created_at
  FROM agent_memories m
  WHERE m.agent_id = p_agent_id
    AND (1 - (m.embedding <=> p_query_embedding)) >= p_similarity_threshold
    AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
    AND (p_scope_prefix IS NULL OR m.scope LIKE p_scope_prefix || '%')
    AND (m.expires_at IS NULL OR m.expires_at > now())
  ORDER BY (
    0.5 * (1 - (m.embedding <=> p_query_embedding)) +
    0.3 * POW(0.5, EXTRACT(EPOCH FROM (now() - m.created_at)) / 86400.0 / 30.0) +
    0.2 * m.importance
  ) DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- Event Log — tracks events that trigger agent actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_by UUID REFERENCES workspace_agents(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_events_workspace ON agent_events(workspace_id, created_at DESC);
CREATE INDEX idx_agent_events_unprocessed ON agent_events(workspace_id, processed) WHERE processed = false;
CREATE INDEX idx_agent_events_type ON agent_events(event_type);
