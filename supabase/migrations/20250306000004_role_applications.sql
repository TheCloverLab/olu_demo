-- Role application workflow

CREATE TABLE IF NOT EXISTS role_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL CHECK (target_role IN ('creator', 'advertiser', 'supplier')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_applications_user_id ON role_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_role_applications_status ON role_applications(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_role_applications_pending
  ON role_applications(user_id, target_role)
  WHERE status = 'pending';

CREATE TRIGGER update_role_applications_updated_at
  BEFORE UPDATE ON role_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE role_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role applications"
  ON role_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = role_applications.user_id
      AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own role applications"
  ON role_applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = role_applications.user_id
      AND users.auth_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION submit_role_application(target_role_input TEXT, reason_input TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  existing_id UUID;
  new_id UUID;
BEGIN
  IF target_role_input NOT IN ('creator', 'advertiser', 'supplier') THEN
    RAISE EXCEPTION 'Invalid target role';
  END IF;

  SELECT id INTO current_user_id
  FROM users
  WHERE auth_id = auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM users
    WHERE id = current_user_id
    AND roles @> ARRAY[target_role_input]::TEXT[]
  ) THEN
    RAISE EXCEPTION 'Role already assigned';
  END IF;

  SELECT id INTO existing_id
  FROM role_applications
  WHERE user_id = current_user_id
    AND target_role = target_role_input
    AND status = 'pending'
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO role_applications (user_id, target_role, reason)
  VALUES (current_user_id, target_role_input, reason_input)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_role_application(TEXT, TEXT) TO anon, authenticated;
