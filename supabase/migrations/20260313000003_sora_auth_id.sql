-- Link Sora Kim's public.users row to her auth.users record + set avatar
UPDATE users
SET auth_id = '00000000-0000-0000-0000-000000000032',
    avatar_img = '/images/avatars/sora.png'
WHERE id = '00000000-0000-0000-0000-000000000032';
