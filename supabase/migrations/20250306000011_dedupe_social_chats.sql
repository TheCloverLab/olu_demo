-- Deduplicate social chats and enforce uniqueness

-- 1) Rank duplicates, keeping the most recently updated chat per (user_id, with_user_id)
WITH ranked AS (
  SELECT
    id,
    user_id,
    with_user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, with_user_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn,
    FIRST_VALUE(id) OVER (
      PARTITION BY user_id, with_user_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS keep_id
  FROM social_chats
)
-- 2) Move messages from duplicate chats to the kept chat
UPDATE social_chat_messages m
SET social_chat_id = r.keep_id
FROM ranked r
WHERE m.social_chat_id = r.id
  AND r.rn > 1;

-- 3) Remove duplicate chat rows
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, with_user_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM social_chats
)
DELETE FROM social_chats s
USING ranked r
WHERE s.id = r.id
  AND r.rn > 1;

-- 4) Prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_social_chats_user_with_user
  ON social_chats(user_id, with_user_id);
