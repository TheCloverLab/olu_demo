-- Seed a default "All Members" group chat for every workspace that doesn't have one.
-- group_chats.user_id = workspace owner, chat_key = 'all-members'
INSERT INTO group_chats (user_id, chat_key, name, participants, icons, last_message, last_time)
SELECT
  w.owner_user_id,
  'all-members',
  'All Members',
  COALESCE(
    (SELECT ARRAY_AGG(wa.name)
     FROM workspace_agents wa
     WHERE wa.workspace_id = w.id),
    ARRAY['Team']::TEXT[]
  ),
  ARRAY['👥']::TEXT[],
  NULL,
  NULL
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM group_chats gc
  WHERE gc.user_id = w.owner_user_id
  AND gc.chat_key = 'all-members'
);
