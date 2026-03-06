-- Fix role mutation guard to allow service/admin paths while blocking client self-edits

CREATE OR REPLACE FUNCTION prevent_direct_role_mutation()
RETURNS TRIGGER AS $$
BEGIN
  -- For normal authenticated user sessions (auth.uid present), block role changes.
  IF auth.uid() IS NOT NULL THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.roles IS DISTINCT FROM OLD.roles THEN
      RAISE EXCEPTION 'Direct role mutation is not allowed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
