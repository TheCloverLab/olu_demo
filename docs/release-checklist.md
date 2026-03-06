# Release Checklist (MVP)

## Environment

- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set correctly
- [ ] Supabase project linked: `indiwmqxvnkzapsuvhyh`
- [ ] Email confirmation policy is intentional (currently disabled)

## Auth and onboarding

- [ ] Signup works with email + password only
- [ ] New users are `fan` by default
- [ ] Onboarding page enforces display name + handle
- [ ] Users can upload avatar in onboarding

## Roles and permissions

- [ ] Role applications can be submitted from Settings
- [ ] `role_applications` rows are created as `pending`
- [ ] Direct writes to `users.roles` from client are blocked
- [ ] Console routes redirect if role is missing

## Admin operations

- [ ] `upgrade-role` function deployed
- [ ] `approve-role` function deployed
- [ ] `ROLE_REVIEW_ADMIN_TOKEN` secret configured
- [ ] Admin can approve/reject via `docs/role-approval.md`
- [ ] Ops env vars are set for scripts (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] `npm run ops:role-apps` works
- [ ] `npm run ops:role-review -- <id> approved` works

## Data surfaces

- [ ] Home / Profile / Content / CreatorProfile use Supabase data
- [ ] Team / TeamChat / Chat use Supabase data
- [ ] Creator / Advertiser / Supplier consoles use Supabase data
- [ ] No page in `src` imports `src/data/mock.ts`

## Storage

- [ ] `avatars` bucket exists and is public-read
- [ ] `covers` bucket exists and is public-read
- [ ] User-scoped upload policies enforced for both buckets

## Build and deploy

- [ ] `npm run build` passes
- [ ] Preview in production mode (`npm run preview`)
- [ ] Vercel/hosting env vars set
