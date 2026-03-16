-- ============================================================================
-- PROJECT-CENTRIC AI WORKSPACE — Phase 1 (MVP)
-- PRD: Project-Centric AI Workspace (2026-03-14)
--
-- Leverages existing unified chat system (chats, chat_members, chat_messages)
-- instead of creating parallel project_conversations/project_messages tables.
-- ============================================================================

-- ============================================================================
-- 1. PROJECTS — Core project table
-- ============================================================================
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL DEFAULT 'short_term'
                  CHECK (type IN ('short_term', 'ongoing')),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'paused', 'archived', 'completed')),
  runtime_type  TEXT NOT NULL DEFAULT 'langgraph'
                  CHECK (runtime_type IN ('langgraph', 'openclaw')),
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { model, skills[], instructions, budget: { monthly_limit }, ... }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(workspace_id, status);

-- ============================================================================
-- 2. PROJECT PARTICIPANTS — Who's in the project
-- ============================================================================
CREATE TABLE project_participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  role        TEXT NOT NULL DEFAULT 'participant'
                CHECK (role IN ('owner', 'participant')),
  added_by    UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_participants_user ON project_participants(user_id);

-- ============================================================================
-- 3. EXTEND CHATS — Add project scope + project_id
-- ============================================================================

-- Add 'project' and 'quick' to allowed scope values
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_scope_check;
ALTER TABLE chats ADD CONSTRAINT chats_scope_check
  CHECK (scope IN ('experience', 'support', 'team', 'agent', 'project', 'quick'));

-- Add project reference
ALTER TABLE chats ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX idx_chats_project ON chats(project_id) WHERE project_id IS NOT NULL;

-- Add is_default flag for the auto-created default conversation per project
ALTER TABLE chats ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- 4. PROJECT TASKS — AI-managed task board
-- ============================================================================
CREATE TABLE project_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'done', 'blocked')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress        INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  parent_task_id  UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
  assigned_to     TEXT,
    -- 'lead' | 'sub-agent:<id>' | null
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_status ON project_tasks(project_id, status);
CREATE INDEX idx_project_tasks_parent ON project_tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- ============================================================================
-- 5. PROJECT FILES — Deliverables and attachments
-- ============================================================================
CREATE TABLE project_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  file_path   TEXT NOT NULL,   -- Supabase Storage path
  mime_type   TEXT,
  size_bytes  BIGINT,
  created_by  TEXT,            -- 'user' | 'agent'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_files_project ON project_files(project_id);

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is project participant
CREATE OR REPLACE FUNCTION is_project_participant(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_participants WHERE project_id = p_project_id AND user_id = p_user_id
  )
$$;

-- Helper: check if user is project owner
CREATE OR REPLACE FUNCTION is_project_owner(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_participants
    WHERE project_id = p_project_id AND user_id = p_user_id AND role = 'owner'
  )
$$;

-- Projects: visible to participants + workspace admins
CREATE POLICY "projects_select" ON projects FOR SELECT USING (
  is_project_participant(id, current_user_id())
  OR is_workspace_owner(workspace_id, current_user_id())
);

CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_memberships wm
    WHERE wm.workspace_id = projects.workspace_id
    AND wm.user_id = current_user_id()
  )
);

CREATE POLICY "projects_update" ON projects FOR UPDATE USING (
  is_project_owner(id, current_user_id())
  OR is_workspace_owner(workspace_id, current_user_id())
);

CREATE POLICY "projects_delete" ON projects FOR DELETE USING (
  is_project_owner(id, current_user_id())
  OR is_workspace_owner(workspace_id, current_user_id())
);

-- Project participants: visible to fellow participants + workspace admins
CREATE POLICY "project_participants_select" ON project_participants FOR SELECT USING (
  is_project_participant(project_id, current_user_id())
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_participants.project_id
    AND is_workspace_owner(p.workspace_id, current_user_id())
  )
);

CREATE POLICY "project_participants_insert" ON project_participants FOR INSERT WITH CHECK (
  -- Project owner or workspace admin can add participants
  is_project_owner(project_id, current_user_id())
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_participants.project_id
    AND is_workspace_owner(p.workspace_id, current_user_id())
  )
);

CREATE POLICY "project_participants_delete" ON project_participants FOR DELETE USING (
  is_project_owner(project_id, current_user_id())
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_participants.project_id
    AND is_workspace_owner(p.workspace_id, current_user_id())
  )
);

-- Project tasks: visible to project participants
CREATE POLICY "project_tasks_select" ON project_tasks FOR SELECT USING (
  is_project_participant(project_id, current_user_id())
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_tasks.project_id
    AND is_workspace_owner(p.workspace_id, current_user_id())
  )
);

CREATE POLICY "project_tasks_insert" ON project_tasks FOR INSERT WITH CHECK (
  is_project_participant(project_id, current_user_id())
);

CREATE POLICY "project_tasks_update" ON project_tasks FOR UPDATE USING (
  is_project_participant(project_id, current_user_id())
);

-- Project files: visible to project participants
CREATE POLICY "project_files_select" ON project_files FOR SELECT USING (
  is_project_participant(project_id, current_user_id())
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_files.project_id
    AND is_workspace_owner(p.workspace_id, current_user_id())
  )
);

CREATE POLICY "project_files_insert" ON project_files FOR INSERT WITH CHECK (
  is_project_participant(project_id, current_user_id())
);

-- ============================================================================
-- 7. UPDATE CHATS RLS — Allow project scope
-- ============================================================================

-- Update chats insert policy to allow project scope
DROP POLICY IF EXISTS "chats_insert" ON chats;
CREATE POLICY "chats_insert" ON chats FOR INSERT WITH CHECK (
  -- Workspace members can create chats
  EXISTS (
    SELECT 1 FROM workspace_memberships wm
    WHERE wm.workspace_id = chats.workspace_id
    AND wm.user_id = current_user_id()
  )
);

-- Update chats select to include project-based visibility
DROP POLICY IF EXISTS "chats_select" ON chats;
CREATE POLICY "chats_select" ON chats FOR SELECT USING (
  is_chat_member(id, current_user_id())
  OR is_workspace_owner(workspace_id, current_user_id())
  -- Project participants can see project chats
  OR (project_id IS NOT NULL AND is_project_participant(project_id, current_user_id()))
);

-- ============================================================================
-- 8. REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_tasks;

NOTIFY pgrst, 'reload schema';
