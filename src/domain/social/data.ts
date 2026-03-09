import { supabase } from '../../lib/supabase'

export async function getSocialChatsByUser(userId: string) {
  const { data, error } = await supabase
    .from('social_chats')
    .select(`
      *,
      with_user:users!social_chats_with_user_id_fkey (
        id,
        name,
        handle,
        avatar_img,
        avatar_color,
        initials
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getSocialChatMessages(socialChatId: string) {
  const { data, error } = await supabase
    .from('social_chat_messages')
    .select('*')
    .eq('social_chat_id', socialChatId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function ensureSocialChat(userId: string, withUserId: string) {
  const { data: existingRows, error: existingError } = await supabase
    .from('social_chats')
    .select('*')
    .eq('user_id', userId)
    .eq('with_user_id', withUserId)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (existingError) throw existingError
  if (existingRows && existingRows.length > 0) return existingRows[0]

  const { data: created, error: createError } = await supabase
    .from('social_chats')
    .insert({
      user_id: userId,
      with_user_id: withUserId,
      last_message: 'Say hi 👋',
      last_time: 'Now',
      unread: 0,
    })
    .select('*')
    .single()

  if (createError) throw createError

  const { error: introError } = await supabase.from('social_chat_messages').insert({
    social_chat_id: created.id,
    from_type: 'other',
    text: 'Hey, thanks for reaching out. I usually reply within a few hours.',
    time: 'Just now',
  })

  if (introError) {
    console.error('Failed to seed intro message', introError)
  }

  return created
}

export async function addSocialChatMessage(socialChatId: string, fromType: 'user' | 'other', text: string, time = 'Just now') {
  const { data, error } = await supabase
    .from('social_chat_messages')
    .insert({
      social_chat_id: socialChatId,
      from_type: fromType,
      text,
      time,
    })
    .select('*')
    .single()

  if (error) throw error

  const { error: updateError } = await supabase
    .from('social_chats')
    .update({
      last_message: text,
      last_time: time,
      unread: 0,
    })
    .eq('id', socialChatId)

  if (updateError) throw updateError
  return data
}
