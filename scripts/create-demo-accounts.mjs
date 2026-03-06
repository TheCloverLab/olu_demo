import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const ACCOUNTS = [
  {
    email: 'luna.demo@olu.app',
    password: 'Demo123!Creator',
    profileHandle: '@lunachen',
    role: 'creator',
    roles: ['creator', 'fan'],
    fullName: 'Luna Chen',
  },
  {
    email: 'alex.demo@olu.app',
    password: 'Demo123!Fan',
    profileHandle: '@alexpark',
    role: 'fan',
    roles: ['fan'],
    fullName: 'Alex Park',
  },
  {
    email: 'gameverse.demo@olu.app',
    password: 'Demo123!Ads',
    profileHandle: '@gameverse',
    role: 'advertiser',
    roles: ['advertiser', 'fan'],
    fullName: 'GameVerse Studios',
  },
  {
    email: 'artisan.demo@olu.app',
    password: 'Demo123!Supply',
    profileHandle: '@artisancraft',
    role: 'supplier',
    roles: ['supplier', 'fan'],
    fullName: 'ArtisanCraft Co.',
  },
  {
    email: 'maya.demo@olu.app',
    password: 'Demo123!Hybrid',
    profileHandle: '@mayarivers',
    role: 'fan',
    roles: ['fan', 'creator', 'advertiser'],
    fullName: 'Maya Rivers',
    createNewProfile: true,
  },
]

async function getAuthUserByEmail(email) {
  let page = 1
  while (page < 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < 200) break
    page += 1
  }
  return null
}

async function ensureAuthUser({ email, password, fullName }) {
  const existing = await getAuthUserByEmail(email)
  if (existing) return existing

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: fullName },
  })

  if (error) throw error
  return data.user
}

async function ensureProfile(account, authUserId) {
  if (account.createNewProfile) {
    const { data: existing, error: existingErr } = await admin
      .from('users')
      .select('id')
      .eq('handle', account.profileHandle)
      .maybeSingle()
    if (existingErr) throw existingErr

    if (existing?.id) {
      const { error: updateErr } = await admin
        .from('users')
        .update({
          auth_id: authUserId,
          email: account.email,
          role: account.role,
          roles: account.roles,
          onboarding_completed: true,
        })
        .eq('id', existing.id)
      if (updateErr) throw updateErr
      return existing.id
    }

    const username = account.profileHandle.replace('@', '')
    const initials = account.fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const { data: inserted, error: insertErr } = await admin
      .from('users')
      .insert({
        auth_id: authUserId,
        username,
        handle: account.profileHandle,
        email: account.email,
        role: account.role,
        roles: account.roles,
        name: account.fullName,
        bio: 'Producer, strategist, and creator operator bridging audience growth with brand partnerships.',
        avatar_color: 'from-indigo-500 to-sky-500',
        initials,
        followers: 28400,
        following: 392,
        posts: 123,
        verified: true,
        onboarding_completed: true,
      })
      .select('id')
      .single()

    if (insertErr) throw insertErr
    return inserted.id
  }

  const { data: profile, error: profileErr } = await admin
    .from('users')
    .select('id')
    .eq('handle', account.profileHandle)
    .single()

  if (profileErr) throw profileErr

  const { error: updateErr } = await admin
    .from('users')
    .update({
      auth_id: authUserId,
      email: account.email,
      role: account.role,
      roles: account.roles,
      onboarding_completed: true,
    })
    .eq('id', profile.id)

  if (updateErr) throw updateErr
  return profile.id
}

async function ensureFanDemoData(alexId) {
  const { data: luna, error: lunaErr } = await admin.from('users').select('id').eq('handle', '@lunachen').single()
  if (lunaErr) throw lunaErr
  const { data: kai, error: kaiErr } = await admin.from('users').select('id').eq('handle', '@kaivibe').single()
  if (kaiErr) throw kaiErr

  const chatsToCreate = [
    {
      with_user_id: luna.id,
      last_message: 'The VIP behind-the-scenes stream was amazing. Thanks again!',
      last_time: '18m ago',
      unread: 1,
      messages: [
        { from_type: 'other', text: 'Hey Alex! New VIP stream replay is up.', time: '10:14 AM' },
        { from_type: 'user', text: 'Watching now. This production setup is wild 🔥', time: '10:16 AM' },
        { from_type: 'other', text: 'Glad you like it. More BTS clips dropping this week.', time: '10:17 AM' },
      ],
    },
    {
      with_user_id: kai.id,
      last_message: 'Your remix was selected for community spotlight.',
      last_time: '2h ago',
      unread: 0,
      messages: [
        { from_type: 'other', text: 'Alex, your remix made the shortlist.', time: '8:30 AM' },
        { from_type: 'user', text: 'No way. Appreciate the feedback!', time: '8:31 AM' },
        { from_type: 'other', text: 'You are featured in this week\'s spotlight.', time: '8:35 AM' },
      ],
    },
  ]

  for (const chatDef of chatsToCreate) {
    const { data: existing, error: existingErr } = await admin
      .from('social_chats')
      .select('id')
      .eq('user_id', alexId)
      .eq('with_user_id', chatDef.with_user_id)
      .maybeSingle()
    if (existingErr) throw existingErr

    let chatId = existing?.id
    if (!chatId) {
      const { data: created, error: createErr } = await admin
        .from('social_chats')
        .insert({
          user_id: alexId,
          with_user_id: chatDef.with_user_id,
          last_message: chatDef.last_message,
          last_time: chatDef.last_time,
          unread: chatDef.unread,
        })
        .select('id')
        .single()
      if (createErr) throw createErr
      chatId = created.id
    }

    const { data: msgExisting, error: msgErr } = await admin
      .from('social_chat_messages')
      .select('id')
      .eq('social_chat_id', chatId)
      .limit(1)
    if (msgErr) throw msgErr

    if (!msgExisting || msgExisting.length === 0) {
      const payload = chatDef.messages.map((m) => ({ ...m, social_chat_id: chatId }))
      const { error: insertMsgErr } = await admin.from('social_chat_messages').insert(payload)
      if (insertMsgErr) throw insertMsgErr
    }
  }
}

async function ensureMayaDemoData(mayaId) {
  const { data: existingPosts, error: postsErr } = await admin
    .from('posts')
    .select('id')
    .eq('creator_id', mayaId)
    .limit(1)
  if (postsErr) throw postsErr

  if (!existingPosts || existingPosts.length === 0) {
    const { error: insertPostErr } = await admin.from('posts').insert([
      {
        creator_id: mayaId,
        type: 'video',
        title: 'Creator Systems: How I run 3 channels with AI copilots',
        preview: 'A tactical walkthrough of pipeline, scripting, and post-production automation.',
        gradient_bg: 'from-indigo-900 to-sky-900',
        emoji: '🎬',
        likes: 18240,
        comments: 612,
        tips: 94,
        locked: false,
        allow_fan_creation: true,
        fan_creation_fee: 0.2,
        sponsored: false,
        tags: ['Creator Economy', 'Workflow', 'AI'],
      },
    ])
    if (insertPostErr) throw insertPostErr
  }

  const { data: existingCampaigns, error: campErr } = await admin
    .from('campaigns')
    .select('id')
    .eq('advertiser_id', mayaId)
    .limit(1)
  if (campErr) throw campErr

  if (!existingCampaigns || existingCampaigns.length === 0) {
    const { error: insertCampErr } = await admin.from('campaigns').insert([
      {
        advertiser_id: mayaId,
        name: 'Creator Tools Q2 Launch',
        status: 'active',
        budget: 28000,
        spent: 12600,
        start_date: '2026-02-15',
        end_date: '2026-04-30',
        agent_key: 'max',
        reach: 980000,
        target_reach: 1800000,
        conversions: 3120,
        target_conversions: 6000,
      },
    ])
    if (insertCampErr) throw insertCampErr
  }

  const { data: existingTiers, error: tierErr } = await admin
    .from('membership_tiers')
    .select('id')
    .eq('creator_id', mayaId)
    .limit(1)
  if (tierErr) throw tierErr

  if (!existingTiers || existingTiers.length === 0) {
    const { error: insertTierErr } = await admin.from('membership_tiers').insert([
      {
        creator_id: mayaId,
        tier_key: 'free',
        name: 'Free',
        price: 0,
        description: 'Public updates and community threads.',
        perks: ['Weekly public update', 'Access to open Q&A'],
        subscriber_count: 5400,
      },
      {
        creator_id: mayaId,
        tier_key: 'pro',
        name: 'Pro Studio',
        price: 12,
        description: 'Templates, breakdowns, and monthly office hours.',
        perks: ['Template library', 'Creator playbooks', 'Monthly office hours'],
        subscriber_count: 970,
      },
    ])
    if (insertTierErr) throw insertTierErr
  }
}

const summary = []

for (const account of ACCOUNTS) {
  const authUser = await ensureAuthUser(account)
  const profileId = await ensureProfile(account, authUser.id)

  if (account.profileHandle === '@alexpark') {
    await ensureFanDemoData(profileId)
  }

  if (account.profileHandle === '@mayarivers') {
    await ensureMayaDemoData(profileId)
  }

  summary.push({
    email: account.email,
    password: account.password,
    role: account.role,
    roles: account.roles.join(', '),
    profile: account.profileHandle,
  })
}

console.table(summary)
