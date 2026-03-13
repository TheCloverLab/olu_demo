-- Fix infinite recursion in chat RLS policies
-- The issue: chat_members SELECT policy references chat_members (circular)
-- And chats SELECT policy references chat_members which references chats (also circular)

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view chats they belong to" ON chats;
DROP POLICY IF EXISTS "Workspace owners can create chats" ON chats;
DROP POLICY IF EXISTS "Workspace owners can update chats" ON chats;
DROP POLICY IF EXISTS "Users can view chat members" ON chat_members;
DROP POLICY IF EXISTS "Users can join chats in their workspace" ON chat_members;
DROP POLICY IF EXISTS "Members can update their own membership" ON chat_members;
DROP POLICY IF EXISTS "Chat members can read messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;

-- Use a security definer function to break the recursion
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

-- Chats policies (use security definer function)
CREATE POLICY "chats_select" ON chats FOR SELECT USING (
  is_chat_member(id, auth.uid()) OR is_workspace_owner(workspace_id, auth.uid())
);

CREATE POLICY "chats_insert" ON chats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workspace_memberships wm WHERE wm.workspace_id = chats.workspace_id AND wm.user_id = auth.uid())
);

CREATE POLICY "chats_update" ON chats FOR UPDATE USING (
  is_workspace_owner(workspace_id, auth.uid())
);

-- Chat members policies (use security definer function, no self-reference)
CREATE POLICY "chat_members_select" ON chat_members FOR SELECT USING (
  is_chat_member(chat_id, auth.uid())
  OR EXISTS (SELECT 1 FROM chats c WHERE c.id = chat_members.chat_id AND is_workspace_owner(c.workspace_id, auth.uid()))
);

CREATE POLICY "chat_members_insert" ON chat_members FOR INSERT WITH CHECK (
  -- Anyone authenticated can join experience chats
  EXISTS (SELECT 1 FROM chats c WHERE c.id = chat_members.chat_id AND c.scope = 'experience' AND auth.uid() IS NOT NULL)
  OR
  -- Workspace members can be added to other chat types
  EXISTS (SELECT 1 FROM chats c JOIN workspace_memberships wm ON wm.workspace_id = c.workspace_id WHERE c.id = chat_members.chat_id AND wm.user_id = auth.uid())
);

CREATE POLICY "chat_members_update" ON chat_members FOR UPDATE USING (
  chat_members.user_id = auth.uid()
);

-- Chat messages policies
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
  is_chat_member(chat_id, auth.uid())
  OR EXISTS (SELECT 1 FROM chats c WHERE c.id = chat_messages.chat_id AND is_workspace_owner(c.workspace_id, auth.uid()))
);

CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

NOTIFY pgrst, 'reload schema';
