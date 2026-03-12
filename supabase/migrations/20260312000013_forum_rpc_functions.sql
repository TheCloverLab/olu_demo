-- RPC functions for forum post like/comment counters

CREATE OR REPLACE FUNCTION increment_forum_like_count(post_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_posts SET like_count = like_count + 1 WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_forum_like_count(post_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_forum_comment_count(post_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
