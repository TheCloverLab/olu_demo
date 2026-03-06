-- Onboarding profile completion flag

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Existing seeded/demo users are considered completed.
UPDATE users
SET onboarding_completed = true
WHERE followers > 0 OR verified = true;
