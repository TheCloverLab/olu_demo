# Role Approval Flow

This project uses an application-based role upgrade model.

## User flow

1. New users sign up as `fan` by default.
2. In Settings, users can apply for `creator`, `advertiser`, or `supplier`.
3. The app calls the `upgrade-role` edge function.
4. A row is created in `role_applications` with status `pending`.

## Approving/rejecting applications

Use the `approve-role` edge function with admin token.

## CLI ops scripts (recommended for day-to-day)

Set env vars once:

```bash
export SUPABASE_URL="https://indiwmqxvnkzapsuvhyh.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

List pending applications:

```bash
npm run ops:role-apps
```

List all statuses:

```bash
npm run ops:role-apps -- all
```

Approve:

```bash
npm run ops:role-review -- <applicationId> approved "approved by ops"
```

Reject:

```bash
npm run ops:role-review -- <applicationId> rejected "missing business details"
```

### Approve

```bash
curl -X POST "https://indiwmqxvnkzapsuvhyh.functions.supabase.co/approve-role" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <ROLE_REVIEW_ADMIN_TOKEN>" \
  -d '{"applicationId":"<uuid>","action":"approved","reviewNote":"approved"}'
```

### Reject

```bash
curl -X POST "https://indiwmqxvnkzapsuvhyh.functions.supabase.co/approve-role" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <ROLE_REVIEW_ADMIN_TOKEN>" \
  -d '{"applicationId":"<uuid>","action":"rejected","reviewNote":"missing info"}'
```

## Data model

- `role_applications`
  - `target_role`: creator | advertiser | supplier
  - `status`: pending | approved | rejected
  - unique pending constraint per `(user_id, target_role)`

## Security

- Direct client updates to `users.role` and `users.roles` are blocked by trigger.
- Role changes should only happen via service-role path (approval function).
