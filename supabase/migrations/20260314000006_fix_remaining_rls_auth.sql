-- Fix remaining RLS policies that incorrectly compare auth.uid() against
-- columns referencing users(id). These columns store internal user UUIDs,
-- not Supabase auth UUIDs, so we must use current_user_id() instead.
--
-- Tables fixed:
--   experience_video_items — video_items_manage policy

-- experience_video_items: wm.user_id references users(id), not auth.uid()
DROP POLICY IF EXISTS "video_items_manage" ON experience_video_items;
CREATE POLICY "video_items_manage" ON experience_video_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workspace_experiences we
    JOIN workspace_memberships wm ON wm.workspace_id = we.workspace_id
    WHERE we.id = experience_video_items.experience_id
      AND wm.user_id = current_user_id()
      AND wm.membership_role IN ('owner', 'admin')
  )
);

NOTIFY pgrst, 'reload schema';
