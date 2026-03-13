-- Fix chat RLS: auth.uid() returns auth.users.id, not users.id
-- Must join through users table on auth_id = auth.uid()

-- Drop existing policies
DROP POLICY IF EXISTS "chats_select" ON chats;
DROP POLICY IF EXISTS "chats_insert" ON chats;
DROP POLICY IF EXISTS "chats_update" ON chats;
DROP POLICY IF EXISTS "chat_members_select" ON chat_members;
DROP POLICY IF EXISTS "chat_members_insert" ON chat_members;
DROP POLICY IF EXISTS "chat_members_update" ON chat_members;
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;

-- Helper to get internal user_id from auth.uid()
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM users WHERE auth_id = auth.uid()
$$;

-- Update security definer functions to keep consistency
CREATE OR REPLACE FUNCTION is_chat_member(p_chat_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_members WHERE chat_id = p_chat_id AND user_id = p_user_id
  )
$$;

CREATE OR REPLACE FUNCTION is_workspace_owner(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_memberships
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id AND membership_role = 'owner'
  )
$$;

-- Chats policies
CREATE POLICY "chats_select" ON chats FOR SELECT USING (
  is_chat_member(id, current_user_id()) OR is_workspace_owner(workspace_id, current_user_id())
);

CREATE POLICY "chats_insert" ON chats FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_memberships wm
    WHERE wm.workspace_id = chats.workspace_id
    AND wm.user_id = current_user_id()
  )
);

CREATE POLICY "chats_update" ON chats FOR UPDATE USING (
  is_workspace_owner(workspace_id, current_user_id())
);

-- Chat members policies
CREATE POLICY "chat_members_select" ON chat_members FOR SELECT USING (
  is_chat_member(chat_id, current_user_id())
  OR EXISTS (
    SELECT 1 FROM chats c
    WHERE c.id = chat_members.chat_id
    AND is_workspace_owner(c.workspace_id, current_user_id())
  )
);

CREATE POLICY "chat_members_insert" ON chat_members FOR INSERT WITH CHECK (
  -- Anyone authenticated can join experience chats
  EXISTS (
    SELECT 1 FROM chats c
    WHERE c.id = chat_members.chat_id AND c.scope = 'experience' AND auth.uid() IS NOT NULL
  )
  OR
  -- Workspace members can be added to other chat types
  EXISTS (
    SELECT 1 FROM chats c
    JOIN workspace_memberships wm ON wm.workspace_id = c.workspace_id
    WHERE c.id = chat_members.chat_id AND wm.user_id = current_user_id()
  )
);

CREATE POLICY "chat_members_update" ON chat_members FOR UPDATE USING (
  chat_members.user_id = current_user_id()
);

-- Chat messages policies
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
  is_chat_member(chat_id, current_user_id())
  OR EXISTS (
    SELECT 1 FROM chats c
    WHERE c.id = chat_messages.chat_id
    AND is_workspace_owner(c.workspace_id, current_user_id())
  )
);

CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

NOTIFY pgrst, 'reload schema';
