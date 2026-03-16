-- ============================================================================
-- PROJECT FILES STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Project participants can read files in their projects
CREATE POLICY "project_files_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND is_project_participant(
    (storage.foldername(name))[1]::uuid,
    current_user_id()
  )
);

-- Project participants can upload files
CREATE POLICY "project_files_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND is_project_participant(
    (storage.foldername(name))[1]::uuid,
    current_user_id()
  )
);

-- Project owners can delete files
CREATE POLICY "project_files_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND is_project_owner(
    (storage.foldername(name))[1]::uuid,
    current_user_id()
  )
);

NOTIFY pgrst, 'reload schema';
