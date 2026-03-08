export default async function handler(req, res) {
  res.status(410).json({
    error: 'deprecated',
    detail: 'Chat runtime moved to Supabase Edge Functions (agent-chat). Frontend should call Supabase functions instead of /api/chat.',
  })
}
