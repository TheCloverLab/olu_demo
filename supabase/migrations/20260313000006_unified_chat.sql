-- ============================================================================
-- UNIFIED CHAT SYSTEM
-- Replaces: social_chats, social_chat_messages, group_chats, group_chat_messages,
--           experience_chat_messages, conversations
-- ============================================================================

-- Unified chat rooms
CREATE TABLE chats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  scope           TEXT NOT NULL CHECK (scope IN ('experience', 'support', 'team', 'agent')),
  name            TEXT,

  -- Scope-specific references (nullable, depends on scope)
  experience_id   UUID REFERENCES workspace_experiences(id) ON DELETE CASCADE,
  agent_id        UUID REFERENCES workspace_agents(id) ON DELETE CASCADE,

  -- Metadata
  config          JSONB DEFAULT '{}'::jsonb,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chats_workspace ON chats(workspace_id);
CREATE INDEX idx_chats_scope ON chats(workspace_id, scope);
CREATE INDEX idx_chats_experience ON chats(experience_id) WHERE experience_id IS NOT NULL;
CREATE INDEX idx_chats_agent ON chats(agent_id) WHERE agent_id IS NOT NULL;

-- Chat members
CREATE TABLE chat_members (
  chat_id    UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  unread     INTEGER DEFAULT 0,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX idx_chat_members_user ON chat_members(user_id);

-- Unified messages
CREATE TABLE chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id      UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id    TEXT NOT NULL,          -- user UUID, agent UUID, or 'system'
  sender_type  TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
  sender_name  TEXT,
  sender_avatar TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'tool_call', 'system')),
  content      TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,  -- attachments, tool results, reasoning, etc.
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id, created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chats: members can see their chats
CREATE POLICY "Users can view chats they belong to"
  ON chats FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_members WHERE chat_members.chat_id = chats.id AND chat_members.user_id = auth.uid())
    OR
    -- Workspace owners can see all chats in their workspace
    EXISTS (SELECT 1 FROM workspace_memberships wm WHERE wm.workspace_id = chats.workspace_id AND wm.user_id = auth.uid() AND wm.membership_role = 'owner')
  );

CREATE POLICY "Workspace owners can create chats"
  ON chats FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workspace_memberships wm WHERE wm.workspace_id = chats.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Workspace owners can update chats"
  ON chats FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workspace_memberships wm WHERE wm.workspace_id = chats.workspace_id AND wm.user_id = auth.uid())
  );

-- Chat members: visible to chat participants and workspace owners
CREATE POLICY "Users can view chat members"
  ON chat_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_members cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM chats c JOIN workspace_memberships wm ON wm.workspace_id = c.workspace_id WHERE c.id = chat_members.chat_id AND wm.user_id = auth.uid() AND wm.membership_role = 'owner')
  );

CREATE POLICY "Users can join chats in their workspace"
  ON chat_members FOR INSERT WITH CHECK (
    -- Workspace members can be added
    EXISTS (SELECT 1 FROM chats c JOIN workspace_memberships wm ON wm.workspace_id = c.workspace_id WHERE c.id = chat_members.chat_id AND wm.user_id = chat_members.user_id)
    OR
    -- Consumer members can join experience chats
    EXISTS (SELECT 1 FROM chats c WHERE c.id = chat_members.chat_id AND c.scope = 'experience')
  );

CREATE POLICY "Members can update their own membership"
  ON chat_members FOR UPDATE USING (
    chat_members.user_id = auth.uid()
  );

-- Messages: readable by chat members
CREATE POLICY "Chat members can read messages"
  ON chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_members cm WHERE cm.chat_id = chat_messages.chat_id AND cm.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM chats c JOIN workspace_memberships wm ON wm.workspace_id = c.workspace_id WHERE c.id = chat_messages.chat_id AND wm.user_id = auth.uid() AND wm.membership_role = 'owner')
  );

CREATE POLICY "Authenticated users can send messages"
  ON chat_messages FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================================================
-- DATA MIGRATION: Move existing chat data into unified tables
-- ============================================================================

-- 1. Migrate experience group chats
-- Create a chat room for each group_chat experience
INSERT INTO chats (id, workspace_id, scope, experience_id, name, created_at)
SELECT
  e.id,  -- reuse experience ID as chat ID for simplicity
  e.workspace_id,
  'experience',
  e.id,
  e.name,
  e.created_at
FROM workspace_experiences e
WHERE e.type = 'group_chat' AND e.status = 'active'
ON CONFLICT (id) DO NOTHING;

-- Migrate experience_chat_messages
INSERT INTO chat_messages (chat_id, sender_id, sender_type, sender_name, sender_avatar, message_type, content, metadata, created_at)
SELECT
  ecm.experience_id,  -- chat_id = experience_id (from above)
  ecm.user_id::text,
  'user',
  ecm.author_name,
  ecm.author_avatar,
  'text',
  ecm.text,
  jsonb_build_object('author_color', ecm.author_color),
  ecm.created_at
FROM experience_chat_messages ecm
WHERE EXISTS (SELECT 1 FROM chats c WHERE c.id = ecm.experience_id);

-- 2. Migrate social/support chats
INSERT INTO chats (id, workspace_id, scope, name, last_message, last_message_at, created_at, updated_at)
SELECT
  sc.id,
  COALESCE(
    (SELECT wm.workspace_id FROM workspace_memberships wm WHERE wm.user_id = sc.with_user_id AND wm.membership_role = 'owner' LIMIT 1),
    (SELECT wm.workspace_id FROM workspace_memberships wm WHERE wm.user_id = sc.user_id LIMIT 1)
  ),
  'support',
  'Support Chat',
  sc.last_message,
  CASE WHEN sc.last_time IS NOT NULL AND sc.last_time ~ '^\d+$' THEN to_timestamp(sc.last_time::bigint / 1000) ELSE sc.updated_at END,
  sc.created_at,
  sc.updated_at
FROM social_chats sc
WHERE EXISTS (
  SELECT 1 FROM workspace_memberships wm WHERE wm.user_id = sc.with_user_id OR wm.user_id = sc.user_id
)
ON CONFLICT (id) DO NOTHING;

-- Add support chat members
INSERT INTO chat_members (chat_id, user_id, role)
SELECT sc.id, sc.user_id, 'member'
FROM social_chats sc WHERE EXISTS (SELECT 1 FROM chats c WHERE c.id = sc.id)
ON CONFLICT DO NOTHING;

INSERT INTO chat_members (chat_id, user_id, role)
SELECT sc.id, sc.with_user_id, 'owner'
FROM social_chats sc WHERE EXISTS (SELECT 1 FROM chats c WHERE c.id = sc.id)
ON CONFLICT DO NOTHING;

-- Migrate social chat messages
INSERT INTO chat_messages (chat_id, sender_id, sender_type, message_type, content, created_at)
SELECT
  scm.social_chat_id,
  CASE scm.from_type
    WHEN 'user' THEN (SELECT sc.user_id::text FROM social_chats sc WHERE sc.id = scm.social_chat_id)
    ELSE (SELECT sc.with_user_id::text FROM social_chats sc WHERE sc.id = scm.social_chat_id)
  END,
  'user',
  'text',
  scm.text,
  scm.created_at
FROM social_chat_messages scm
WHERE EXISTS (SELECT 1 FROM chats c WHERE c.id = scm.social_chat_id);

-- 3. Agent conversations: TeamChat still uses old tables (conversations + ai_agents)
-- Will be migrated separately when TeamChat component is unified.

-- 4. Migrate team group chats
INSERT INTO chats (id, workspace_id, scope, name, last_message, last_message_at, created_at, updated_at)
SELECT
  gc.id,
  (SELECT wm.workspace_id FROM workspace_memberships wm WHERE wm.user_id = gc.user_id LIMIT 1),
  'team',
  gc.name,
  gc.last_message,
  CASE WHEN gc.last_time IS NOT NULL AND gc.last_time ~ '^\d+$' THEN to_timestamp(gc.last_time::bigint / 1000) ELSE gc.updated_at END,
  gc.created_at,
  gc.updated_at
FROM group_chats gc
WHERE EXISTS (SELECT 1 FROM workspace_memberships wm WHERE wm.user_id = gc.user_id)
ON CONFLICT (id) DO NOTHING;

-- Add group chat owner as member
INSERT INTO chat_members (chat_id, user_id, role)
SELECT gc.id, gc.user_id, 'owner'
FROM group_chats gc WHERE EXISTS (SELECT 1 FROM chats c WHERE c.id = gc.id)
ON CONFLICT DO NOTHING;

-- Store participants info in chat config
UPDATE chats SET config = jsonb_build_object(
  'participants', gc.participants,
  'icons', gc.icons,
  'chat_key', gc.chat_key
)
FROM group_chats gc WHERE chats.id = gc.id;

-- Migrate group chat messages
INSERT INTO chat_messages (chat_id, sender_id, sender_type, sender_name, sender_avatar, message_type, content, metadata, created_at)
SELECT
  gcm.group_chat_id,
  COALESCE(
    (SELECT u.id::text FROM users u WHERE u.name = gcm.from_name LIMIT 1),
    gcm.from_name
  ),
  'user',
  gcm.from_name,
  gcm.avatar,
  CASE
    WHEN gcm.attachments IS NOT NULL AND gcm.attachments != '[]'::jsonb THEN 'image'
    ELSE 'text'
  END,
  gcm.text,
  COALESCE(gcm.attachments, '[]'::jsonb),
  gcm.created_at
FROM group_chat_messages gcm
WHERE EXISTS (SELECT 1 FROM chats c WHERE c.id = gcm.group_chat_id);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

NOTIFY pgrst, 'reload schema';
