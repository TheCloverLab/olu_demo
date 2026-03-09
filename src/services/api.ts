// ==========================================================================
// Re-export shim — all raw queries have moved to domain data layers.
// This file exists only for backward compatibility with tests and any
// remaining consumers. New code should import from domain/ directly.
// ==========================================================================

// --- profile domain ---
export {
  getUsers,
  getUserByHandle,
  getUserById,
  getCreators,
  getCreatorsForDiscover,
  getPublicCommunityCreatorIds,
  getPublicConsumerAppsForUser,
} from '../domain/profile/data'

// --- consumer domain ---
export {
  // posts
  getPosts,
  getPostsByCreator,
  createPost,
  updatePost,
  getPostById,
  // courses
  getConsumerCourses,
  getConsumerCoursesForDiscover,
  createConsumerCourse,
  getConsumerCourseBySlug,
  getConsumerCourseSections,
  updateConsumerCourse,
  createConsumerCourseSection,
  updateConsumerCourseSection,
  // membership & engagement
  getConsumerMembership,
  upsertConsumerMembership,
  getConsumerCoursePurchase,
  getConsumerCoursePurchases,
  createConsumerCoursePurchase,
  getConsumerLessonProgress,
  upsertConsumerLessonProgress,
  // fans / CRM
  getFansByCreator,
  // products
  getProductsByCreator,
  // membership tiers
  getMembershipTiersByCreator,
  updateMembershipTier,
} from '../domain/consumer/data'

// --- social domain ---
export {
  getSocialChatsByUser,
  getSocialChatMessages,
  ensureSocialChat,
  addSocialChatMessage,
} from '../domain/social/data'

// --- team domain ---
export {
  getAgentsByUser,
  getAgentsWithTasks,
  getAgentTasks,
  getConversations,
  addConversationMessage,
  getGroupChatsByUser,
  getGroupChatMessages,
  addGroupChatMessage,
} from '../domain/team/data'

// --- campaign domain ---
export {
  advanceBusinessCampaign,
  approveBusinessCampaignTarget,
  getLatestBusinessCampaignForAdvertiser,
  getLatestBusinessCampaignForCreator,
  rejectBusinessCampaignTarget,
  startBusinessCampaignDemo,
} from '../domain/campaign/api'

// --- workspace domain ---
export {
  getMyRoleApplications,
  submitRoleApplication,
} from '../domain/workspace/api'
