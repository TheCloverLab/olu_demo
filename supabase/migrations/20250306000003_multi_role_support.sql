-- Add support for multiple roles per user

-- Add roles array column (keep old role column for backward compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['fan']::TEXT[];

-- Update existing users to have their role in the roles array
UPDATE users SET roles = ARRAY[role]::TEXT[] WHERE roles = ARRAY['fan']::TEXT[];

-- Add check constraint for valid roles
ALTER TABLE users ADD CONSTRAINT valid_roles 
  CHECK (roles <@ ARRAY['creator', 'fan', 'advertiser', 'supplier']::TEXT[]);

-- Create index for faster role queries
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);
