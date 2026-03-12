-- Create a helper function to reload PostgREST schema cache
CREATE OR REPLACE FUNCTION reload_pgrst_schema()
RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
