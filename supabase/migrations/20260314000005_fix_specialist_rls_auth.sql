-- Fix specialist_templates & specialist_installs RLS:
-- user_id and created_by reference users.id (internal UUID),
-- NOT auth.uid() (Supabase auth UUID). Use current_user_id() helper.

-- specialist_templates: fix insert (workspace membership check)
DROP POLICY IF EXISTS specialist_templates_insert ON specialist_templates;
CREATE POLICY specialist_templates_insert ON specialist_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_id = specialist_templates.workspace_id
      AND user_id = current_user_id()
    )
  );

-- specialist_templates: fix update
DROP POLICY IF EXISTS specialist_templates_update ON specialist_templates;
CREATE POLICY specialist_templates_update ON specialist_templates FOR UPDATE
  USING (created_by = current_user_id());

-- specialist_templates: fix delete
DROP POLICY IF EXISTS specialist_templates_delete ON specialist_templates;
CREATE POLICY specialist_templates_delete ON specialist_templates FOR DELETE
  USING (created_by = current_user_id());

-- specialist_templates: fix select (created_by check)
DROP POLICY IF EXISTS specialist_templates_select ON specialist_templates;
CREATE POLICY specialist_templates_select ON specialist_templates FOR SELECT
  USING (
    status = 'active'
    OR created_by = current_user_id()
  );

-- specialist_installs: fix select
DROP POLICY IF EXISTS specialist_installs_select ON specialist_installs;
CREATE POLICY specialist_installs_select ON specialist_installs FOR SELECT
  USING (user_id = current_user_id());

-- specialist_installs: fix insert
DROP POLICY IF EXISTS specialist_installs_insert ON specialist_installs;
CREATE POLICY specialist_installs_insert ON specialist_installs FOR INSERT
  WITH CHECK (user_id = current_user_id());
