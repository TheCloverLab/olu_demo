import {
  addSocialChatMessage,
  ensureSocialChat,
  getSocialChatMessages,
  getSocialChatsByUser,
} from './data'

export async function ensureDirectSocialChat(userId: string, withUserId: string) {
  return await ensureSocialChat(userId, withUserId)
}

export async function getDirectSocialChats(userId: string) {
  return await getSocialChatsByUser(userId)
}

export async function getDirectSocialMessages(chatId: string) {
  return await getSocialChatMessages(chatId)
}

export async function postDirectSocialMessage(chatId: string, fromType: 'user' | 'other', text: string, time = 'Just now') {
  return await addSocialChatMessage(chatId, fromType, text, time)
}
