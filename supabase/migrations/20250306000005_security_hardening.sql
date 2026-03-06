-- Security hardening: role-safe updates and role-aware write policies

-- 1) Prevent clients from directly mutating role/roles on users table.
--    Role changes must go through approval flow and service-role operations.
CREATE OR REPLACE FUNCTION prevent_direct_role_mutation()
RETURNS TRIGGER AS $$
DECLARE
  jwt_role TEXT;
BEGIN
  jwt_role := current_setting('request.jwt.claim.role', true);

  -- Allow internal/service role paths only.
  IF jwt_role IS DISTINCT FROM 'service_role' THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.roles IS DISTINCT FROM OLD.roles THEN
      RAISE EXCEPTION 'Direct role mutation is not allowed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_direct_role_mutation ON users;
CREATE TRIGGER trg_prevent_direct_role_mutation
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION prevent_direct_role_mutation();

-- 2) Tighten posts write policies to require creator role.
DROP POLICY IF EXISTS "Creators can insert own posts" ON posts;
DROP POLICY IF EXISTS "Creators can update own posts" ON posts;
DROP POLICY IF EXISTS "Creators can delete own posts" ON posts;

CREATE POLICY "Creators can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = posts.creator_id
        AND users.auth_id = auth.uid()
        AND users.roles @> ARRAY['creator']::TEXT[]
    )
  );

CREATE POLICY "Creators can update own posts"
  ON posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = posts.creator_id
        AND users.auth_id = auth.uid()
        AND users.roles @> ARRAY['creator']::TEXT[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = posts.creator_id
        AND users.auth_id = auth.uid()
        AND users.roles @> ARRAY['creator']::TEXT[]
    )
  );

CREATE POLICY "Creators can delete own posts"
  ON posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = posts.creator_id
        AND users.auth_id = auth.uid()
        AND users.roles @> ARRAY['creator']::TEXT[]
    )
  );

-- 3) Tighten advertiser campaign writes to require advertiser role.
DROP POLICY IF EXISTS "Advertisers can manage own campaigns" ON campaigns;

CREATE POLICY "Advertisers can manage own campaigns"
  ON campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = campaigns.advertiser_id
        AND users.auth_id = auth.uid()
        AND users.roles @> ARRAY['advertiser']::TEXT[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = campaigns.advertiser_id
        AND users.auth_id = auth.uid()
        AND users.roles @> ARRAY['advertiser']::TEXT[]
    )
  );

-- 4) Tighten supplier writes to require supplier role.
DROP POLICY IF EXISTS "Suppliers can manage own products" ON supplier_products;

CREATE POLICY "Suppliers can manage own products"
  ON supplier_products FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = supplier_products.supplier_id
        AND users.auth_id = auth.uid()
        AND users.roles @> ARRAY['supplier']::TEXT[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = supplier_products.supplier_id
        AND users.auth_id = auth.uid()
        AND users.roles @> ARRAY['supplier']::TEXT[]
    )
  );
