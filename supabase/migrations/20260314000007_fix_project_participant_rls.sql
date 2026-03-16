-- Fix chicken-and-egg RLS on project_participants:
-- The insert policy requires is_project_owner(), which checks project_participants,
-- but the table is empty when adding the first participant (the owner).
-- Fix: also allow the project's owner_id (from projects table) to insert.

DROP POLICY IF EXISTS "project_participants_insert" ON project_participants;
CREATE POLICY "project_participants_insert" ON project_participants FOR INSERT WITH CHECK (
  -- Project creator (owner_id on projects table) can add participants
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_participants.project_id
    AND p.owner_id = current_user_id()
  )
  -- Existing project owners can add participants
  OR is_project_owner(project_id, current_user_id())
  -- Workspace admins can add participants
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_participants.project_id
    AND is_workspace_owner(p.workspace_id, current_user_id())
  )
);

NOTIFY pgrst, 'reload schema';
