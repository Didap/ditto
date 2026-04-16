-- Ditto production migration
-- Run this against your production PostgreSQL database

-- 1. Add deleted_at to designs (soft-delete)
ALTER TABLE designs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Create design_unlocks table (kit/devkit purchases)
CREATE TABLE IF NOT EXISTS design_unlocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  design_slug TEXT NOT NULL,
  feature TEXT NOT NULL,
  credits_spent INTEGER NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX IF NOT EXISTS unlock_user_design_idx ON design_unlocks(user_id, design_slug, feature);

-- 3. Create quest_completions table
CREATE TABLE IF NOT EXISTS quest_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  credits_awarded INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quest_user_idx ON quest_completions(user_id, quest_id);

-- 4. Add email verification columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 5. Fix column types if they were created as TEXT instead of proper types
-- (This handles the case where drizzle-kit push created wrong types)
DO $$
BEGIN
  -- Check if created_at on users is text and fix it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'created_at' AND data_type = 'text'
  ) THEN
    -- Users table: fix timestamp columns
    ALTER TABLE designs DROP CONSTRAINT IF EXISTS designs_user_id_fkey;
    ALTER TABLE quest_completions DROP CONSTRAINT IF EXISTS quest_completions_user_id_fkey;
    ALTER TABLE design_unlocks DROP CONSTRAINT IF EXISTS design_unlocks_user_id_fkey;

    ALTER TABLE users
      ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN created_at = '' THEN NOW() ELSE created_at::TIMESTAMP WITH TIME ZONE END,
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN updated_at = '' THEN NOW() ELSE updated_at::TIMESTAMP WITH TIME ZONE END,
      ALTER COLUMN updated_at SET DEFAULT NOW(),
      ALTER COLUMN last_login_at TYPE TIMESTAMP WITH TIME ZONE USING NULLIF(last_login_at, '')::TIMESTAMP WITH TIME ZONE;

    ALTER TABLE designs ADD CONSTRAINT designs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE quest_completions ADD CONSTRAINT quest_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE design_unlocks ADD CONSTRAINT design_unlocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Check if created_at on designs is text and fix it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'designs' AND column_name = 'created_at' AND data_type = 'text'
  ) THEN
    ALTER TABLE designs
      ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN created_at = '' THEN NOW() ELSE created_at::TIMESTAMP WITH TIME ZONE END,
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN updated_at = '' THEN NOW() ELSE updated_at::TIMESTAMP WITH TIME ZONE END,
      ALTER COLUMN updated_at SET DEFAULT NOW();
  END IF;

  -- Check if tokens on designs is text and fix it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'designs' AND column_name = 'tokens' AND data_type = 'text'
  ) THEN
    ALTER TABLE designs
      ALTER COLUMN tokens TYPE JSONB USING tokens::JSONB,
      ALTER COLUMN resolved TYPE JSONB USING resolved::JSONB;
  END IF;
END $$;

-- 6. Mark all existing users as email-verified (so they don't get locked out)
UPDATE users SET email_verified = NOW() WHERE email_verified IS NULL;

-- 7. Migrate old feature names in design_unlocks
UPDATE design_unlocks SET feature = 'complete' WHERE feature = 'storybook';
UPDATE design_unlocks SET feature = 'complete' WHERE feature = 'devkit' AND EXISTS (
  SELECT 1 FROM design_unlocks du2 WHERE du2.feature = 'kit' AND du2.design_slug = design_unlocks.design_slug AND du2.user_id = design_unlocks.user_id
);
UPDATE design_unlocks SET feature = 'devkit' WHERE feature = 'kit';

-- Done!
SELECT 'Migration complete' AS status;
