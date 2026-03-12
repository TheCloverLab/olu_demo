import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const DEMO_PASSWORD = 'Demo123!'

// 10 consumers, 3 creator_ops, 2 marketing, 2 supply_chain
const ACCOUNTS = [
  // ── Consumers (10) ──────────────────────────────────────────────
  { email: 'alex.demo@olu.app', handle: '@alexpark', name: 'Alex Park', color: 'from-pink-500 to-rose-600', avatarImg: '/images/avatars/alex.jpg', modules: [], bio: 'Music lover and part-time DJ. Exploring the indie scene one beat at a time.', followers: 1240, following: 89, posts: 43 },
  { email: 'jordan.demo@olu.app', handle: '@jordanlee', name: 'Jordan Lee', color: 'from-blue-500 to-blue-700', avatarImg: 'https://api.dicebear.com/9.x/notionists/svg?seed=jordanlee&backgroundColor=c0aede', modules: [], bio: 'Freelance photographer based in Seoul. Shooting street and portrait.', followers: 3200, following: 215, posts: 127 },
  { email: 'mia.demo@olu.app', handle: '@miazhang', name: 'Mia Zhang', color: 'from-violet-500 to-purple-600', avatarImg: 'https://api.dicebear.com/9.x/notionists/svg?seed=miazhang&backgroundColor=ffd5dc', modules: [], bio: 'UX designer by day, watercolor painter by night. Dog mom.', followers: 890, following: 312, posts: 56 },
  { email: 'ryan.demo@olu.app', handle: '@ryankim', name: 'Ryan Kim', color: 'from-amber-500 to-orange-600', avatarImg: 'https://api.dicebear.com/9.x/notionists/svg?seed=ryankim&backgroundColor=ffdfbf', modules: [], bio: 'Fitness junkie and meal prep enthusiast. Currently training for my first marathon.', followers: 2100, following: 178, posts: 89 },
  { email: 'sofia.demo@olu.app', handle: '@sofiamartinez', name: 'Sofia Martinez', color: 'from-rose-500 to-pink-600', avatarImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', modules: [], bio: 'Book reviewer and podcast host. Reading 52 books a year since 2023.', followers: 4500, following: 340, posts: 201 },
  { email: 'david.demo@olu.app', handle: '@davidchen', name: 'David Chen', color: 'from-emerald-500 to-green-600', avatarImg: 'https://api.dicebear.com/9.x/notionists/svg?seed=davidchen&backgroundColor=b6e3f4', modules: [], bio: 'Software engineer at a startup. Weekend rock climber.', followers: 670, following: 145, posts: 28 },
  { email: 'emma.demo@olu.app', handle: '@emmawilson', name: 'Emma Wilson', color: 'from-sky-500 to-blue-600', avatarImg: 'https://api.dicebear.com/9.x/notionists/svg?seed=emmawilson&backgroundColor=d1d4f9', modules: [], bio: 'Travel blogger documenting hidden gems across Southeast Asia.', followers: 8900, following: 520, posts: 312 },
  { email: 'lucas.demo@olu.app', handle: '@lucasbrown', name: 'Lucas Brown', color: 'from-orange-500 to-red-600', avatarImg: 'https://api.dicebear.com/9.x/notionists/svg?seed=lucasbrown&backgroundColor=ffd5dc', modules: [], bio: 'Sneakerhead and streetwear collector. Always hunting for the next drop.', followers: 1800, following: 234, posts: 67 },
  { email: 'nina.demo@olu.app', handle: '@ninapatel', name: 'Nina Patel', color: 'from-yellow-500 to-amber-600', avatarImg: 'https://api.dicebear.com/9.x/notionists/svg?seed=ninapatel&backgroundColor=c0aede', modules: [], bio: 'Med student and amateur chef. Cooking my way through residency.', followers: 950, following: 167, posts: 45 },
  { email: 'tyler.demo@olu.app', handle: '@tylerwang', name: 'Tyler Wang', color: 'from-teal-500 to-cyan-600', avatarImg: 'https://api.dicebear.com/9.x/notionists/svg?seed=tylerwang&backgroundColor=b6e3f4', modules: [], bio: 'Competitive gamer and esports commentator. Rank: Immortal.', followers: 15600, following: 89, posts: 234 },

  // ── Creator Ops (3) ─────────────────────────────────────────────
  { email: 'luna.demo@olu.app', handle: '@lunachen', name: 'Luna Chen', color: 'from-zinc-600 to-zinc-500', avatarImg: '/images/avatars/luna.jpg', coverImg: '/images/covers/lunachen.jpg', modules: ['creator_ops'], verified: true, followers: 234000, following: 312, posts: 847, bio: 'Digital artist & gamer | Creating worlds one pixel at a time', communityTitle: 'Pixel Realm', communityCover: '/images/covers/dragonart.jpg' },
  { email: 'kai.demo@olu.app', handle: '@kaivibe', name: 'Kai Vibe', color: 'from-amber-500 to-orange-600', avatarImg: '/images/avatars/kai.jpg', coverImg: '/images/covers/kaivibe.jpg', modules: ['creator_ops'], verified: true, followers: 167000, following: 201, posts: 512, bio: 'Lo-fi producer blending analog warmth with digital dreams. 2M+ streams.', communityTitle: 'The Listening Room', communityCover: '/images/covers/midnightdrift.jpg' },
  { email: 'zara.demo@olu.app', handle: '@zaranova', name: 'Zara Nova', color: 'from-purple-400 to-pink-600', avatarImg: '/images/avatars/zara.jpg', coverImg: '/images/covers/zaranova.jpg', modules: ['creator_ops'], verified: true, followers: 201000, following: 411, posts: 601, bio: 'Fashion designer and lifestyle creator. Sustainable style for the modern wardrobe.', communityTitle: 'Nova Style Lab', communityCover: '/images/covers/neoncity.jpg' },

  // ── Marketing (2) ───────────────────────────────────────────────
  { email: 'gameverse.demo@olu.app', handle: '@gameverse', name: 'GameVerse Studios', color: 'from-blue-500 to-cyan-600', avatarImg: '/images/avatars/gameverse.jpg', coverImg: '/images/covers/gameverse.jpg', modules: ['marketing'], verified: true, followers: 89000, following: 234, posts: 156, bio: 'Indie game studio behind Galaxy Quest and Neon Drift. Building worlds players actually want to live in.', communityTitle: 'GameVerse Arena', communityCover: '/images/covers/gameverse.jpg' },
  { email: 'marcus.demo@olu.app', handle: '@techmarkus', name: 'Marcus Chen', color: 'from-blue-400 to-blue-600', avatarImg: '/images/avatars/marcus.jpg', coverImg: '/images/covers/marcuschen.jpg', modules: ['marketing'], verified: true, followers: 412000, following: 290, posts: 903, bio: 'Tech reviewer and brand strategist. Honest takes on gadgets, games, and growth.', communityTitle: 'Tech & Gaming Hub', communityCover: '/images/covers/marcuschen.jpg' },

  // ── Supply Chain (2) ────────────────────────────────────────────
  { email: 'artisan.demo@olu.app', handle: '@artisancraft', name: 'ArtisanCraft Co.', color: 'from-emerald-500 to-teal-600', avatarImg: '/images/avatars/artisancraft.jpg', coverImg: '/images/covers/artisancraft.jpg', modules: ['supply_chain'], verified: true, followers: 12000, following: 567, posts: 89, bio: 'Premium creator merch. From design to doorstep in 5 days. Trusted by 200+ creators.', communityTitle: 'Artisan Workshop', communityCover: '/images/covers/artisancraft.jpg' },
  { email: 'yuki.demo@olu.app', handle: '@yukidraws', name: 'Yuki Draws', color: 'from-pink-400 to-rose-600', avatarImg: '/images/avatars/yuki.jpg', coverImg: '/images/covers/yukidraws.jpg', modules: ['supply_chain'], verified: false, followers: 89000, following: 140, posts: 377, bio: 'Character illustrator and print shop owner. Turning fan art into real products.' },
]

// Agent templates to hire per workspace
const WORKSPACE_AGENTS = {
  creator_ops: [
    { agentKey: 'lisa', templateKey: 'ip_manager', name: 'Lisa', role: 'IP Manager', avatarImg: '/images/agents/lisa.jpg', color: 'from-zinc-600 to-zinc-500', description: 'Manages and licenses creator IP.', lastMessage: 'Received 3 new IP licensing requests.', lastTime: '12m ago', larkAppId: 'cli_a93a6cd212b89ed4', larkAppSecret: 'Xabt1Z2xWK7KP1vqZ9kJzbD5Z2vpUVXO' },
    { agentKey: 'eric', templateKey: 'data_analyst', name: 'Eric', role: 'Data Analyst', avatarImg: '/images/agents/eric.jpg', color: 'from-blue-500 to-blue-700', description: 'Analyzes performance and growth metrics.', lastMessage: 'Weekly report ready.', lastTime: '2h ago', larkAppId: 'cli_a93a74d7aab99ed1', larkAppSecret: 'J9fS4RqN0Ts6lEaYTNKMFbDHAmOTcroX' },
    { agentKey: 'aria', templateKey: 'community_manager', name: 'Aria', role: 'Community Manager', avatarImg: '/images/agents/aria.jpg', color: 'from-pink-500 to-rose-500', description: 'Runs community events and rewards top fans.', lastMessage: 'Community engagement up 12% this week.', lastTime: '30m ago', larkAppId: 'cli_a93a7467a9385ed0', larkAppSecret: 'RFhZ9C2KWBoFu3RxUYEYeb8POaLWeLzK' },
    { agentKey: 'zephyr', templateKey: 'growth_officer', name: 'Zephyr', role: 'Growth Officer', avatarImg: '/images/agents/zephyr.jpg', color: 'from-emerald-500 to-teal-600', description: 'Drives follower and subscriber growth.', lastMessage: 'Identified 3 new audience segments.', lastTime: '45m ago' },
  ],
  marketing: [
    { agentKey: 'max', templateKey: 'marketing_manager', name: 'Max', role: 'Marketing Manager', avatarImg: '/images/agents/max.jpg', color: 'from-blue-500 to-cyan-500', description: 'Plans influencer campaigns end-to-end.', lastMessage: 'Luna team responded positively.', lastTime: '15m ago', larkAppId: 'cli_a93a70897d789ed0', larkAppSecret: 'XnZiZ5VltpRk7EvGXGxgmcxT4M5mGSgX' },
    { agentKey: 'debian', templateKey: 'ip_manager', name: 'Debian', role: 'IP Manager', avatarImg: '/images/agents/debian.jpg', color: 'from-red-500 to-rose-600', description: 'Reviews IP and brand compliance.', lastMessage: 'Reviewing IP portfolio.', lastTime: '1h ago' },
    { agentKey: 'sage', templateKey: 'data_analyst', name: 'Sage', role: 'Data Analyst', avatarImg: '/images/agents/finance.jpg', color: 'from-yellow-500 to-amber-600', description: 'Tracks campaign analytics and ROI.', lastMessage: 'Campaign metrics compiled.', lastTime: '35m ago' },
  ],
  supply_chain: [
    { agentKey: 'chan', templateKey: 'channel_manager', name: 'Chan', role: 'Channel Manager', avatarImg: '/images/agents/chan.jpg', color: 'from-emerald-500 to-green-600', description: 'Manages supplier and creator partnerships.', lastMessage: 'Hoodie design approved.', lastTime: '20m ago', larkAppId: 'cli_a93a71cc64789ed3', larkAppSecret: 'tEmmHMpP01fG3xmhg0FSrbTzzVgsUS6A' },
  ],
}

// Tasks per agent (keyed by agentKey)
const AGENT_TASKS = {
  lisa: [
    { task_key: 'lisa-ip-audit', title: 'Audit Q1 IP licensing agreements', status: 'done', priority: 'high', due: 'Mar 5', progress: 100 },
    { task_key: 'lisa-takedown-batch', title: 'Process 12 unauthorized reprint takedowns', status: 'in_progress', priority: 'high', due: 'Today', progress: 75 },
    { task_key: 'lisa-new-license', title: 'Draft license terms for Pixel Realm merch line', status: 'in_progress', priority: 'medium', due: 'Mar 14', progress: 40 },
    { task_key: 'lisa-royalty-report', title: 'Generate monthly royalty collection report', status: 'pending', priority: 'medium', due: 'Mar 20' },
    { task_key: 'lisa-partner-review', title: 'Review ArtisanCraft partnership IP clauses', status: 'pending', priority: 'low', due: 'Mar 25' },
  ],
  eric: [
    { task_key: 'eric-weekly-report', title: 'Compile weekly engagement analytics', status: 'done', priority: 'medium', due: 'Mar 7', progress: 100 },
    { task_key: 'eric-growth-deep', title: 'Deep-dive: subscriber growth vs churn analysis', status: 'in_progress', priority: 'high', due: 'Today', progress: 60 },
    { task_key: 'eric-revenue-dash', title: 'Build revenue dashboard for community tiers', status: 'in_progress', priority: 'medium', due: 'Mar 15', progress: 30 },
    { task_key: 'eric-ab-test', title: 'Analyze A/B test results for onboarding flow', status: 'pending', priority: 'high', due: 'Mar 12' },
    { task_key: 'eric-benchmark', title: 'Benchmark creator metrics against industry averages', status: 'pending', priority: 'low', due: 'Mar 28' },
  ],
  max: [
    { task_key: 'max-campaign-luna', title: 'Plan Luna Chen x GameVerse cross-promo campaign', status: 'in_progress', priority: 'high', due: 'Mar 12', progress: 55 },
    { task_key: 'max-influencer-outreach', title: 'Shortlist 15 micro-influencers for spring push', status: 'done', priority: 'medium', due: 'Mar 6', progress: 100 },
    { task_key: 'max-budget-review', title: 'Review Q2 marketing budget allocation', status: 'in_progress', priority: 'high', due: 'Today', progress: 80 },
    { task_key: 'max-performance', title: 'Compile Feb campaign performance report', status: 'done', priority: 'medium', due: 'Mar 3', progress: 100 },
    { task_key: 'max-social-calendar', title: 'Draft March social media content calendar', status: 'pending', priority: 'medium', due: 'Mar 14' },
    { task_key: 'max-creator-brief', title: 'Write creative brief for Zara Nova collab', status: 'pending', priority: 'low', due: 'Mar 22' },
  ],
  chan: [
    { task_key: 'chan-supplier-onboard', title: 'Onboard 2 new print-on-demand suppliers', status: 'in_progress', priority: 'high', due: 'Mar 13', progress: 45 },
    { task_key: 'chan-hoodie-qa', title: 'QA check: Luna hoodie sample batch', status: 'done', priority: 'high', due: 'Mar 8', progress: 100 },
    { task_key: 'chan-shipping-rates', title: 'Negotiate shipping rates for SEA region', status: 'in_progress', priority: 'medium', due: 'Mar 18', progress: 25 },
    { task_key: 'chan-inventory', title: 'Audit current inventory levels across warehouses', status: 'pending', priority: 'medium', due: 'Mar 16' },
    { task_key: 'chan-catalog-sync', title: 'Sync product catalog with Shopify store', status: 'pending', priority: 'low', due: 'Mar 24' },
  ],
  aria: [
    { task_key: 'aria-welcome-flow', title: 'Refine new member welcome sequence', status: 'in_progress', priority: 'high', due: 'Mar 11', progress: 65 },
    { task_key: 'aria-weekly-event', title: 'Plan Friday community live event', status: 'pending', priority: 'medium', due: 'Mar 14' },
    { task_key: 'aria-mod-report', title: 'Review weekly moderation report', status: 'done', priority: 'medium', due: 'Mar 7', progress: 100 },
  ],
  zephyr: [
    { task_key: 'zephyr-audience', title: 'Analyze TikTok audience segments for spring push', status: 'in_progress', priority: 'high', due: 'Mar 12', progress: 40 },
    { task_key: 'zephyr-seo', title: 'Optimize community landing page for search', status: 'pending', priority: 'medium', due: 'Mar 18' },
    { task_key: 'zephyr-referral', title: 'Design member referral incentive program', status: 'in_progress', priority: 'medium', due: 'Mar 15', progress: 30 },
  ],
  debian: [
    { task_key: 'debian-ip-review', title: 'Review GameVerse IP licensing portfolio', status: 'in_progress', priority: 'high', due: 'Mar 13', progress: 50 },
    { task_key: 'debian-compliance', title: 'Brand usage compliance audit', status: 'pending', priority: 'medium', due: 'Mar 20' },
    { task_key: 'debian-contract', title: 'Draft co-marketing agreement template', status: 'in_progress', priority: 'medium', due: 'Mar 16', progress: 35 },
  ],
  sage: [
    { task_key: 'sage-player-analytics', title: 'Compile player engagement metrics report', status: 'done', priority: 'high', due: 'Mar 8', progress: 100 },
    { task_key: 'sage-roi-dashboard', title: 'Build campaign ROI tracking dashboard', status: 'in_progress', priority: 'high', due: 'Mar 14', progress: 55 },
    { task_key: 'sage-benchmark', title: 'Benchmark against competitor game studios', status: 'pending', priority: 'low', due: 'Mar 25' },
  ],
}

async function deleteAllAuthUsers() {
  console.log('Deleting all existing auth users...')
  let deleted = 0
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (error) throw error
    if (data.users.length === 0) break
    for (const user of data.users) {
      await admin.auth.admin.deleteUser(user.id)
      deleted++
    }
  }
  console.log(`  Deleted ${deleted} auth users`)
}

async function truncateAllTables() {
  console.log('Truncating all data tables...')
  const tables = [
    'workspace_agent_tasks', 'workspace_agents', 'agent_templates',
    'consumer_lesson_progress', 'consumer_course_purchases', 'consumer_memberships',
    'consumer_purchases',
    'workspace_product_experiences', 'workspace_product_plans', 'workspace_products',
    'forum_post_likes', 'forum_post_comments', 'forum_posts',
    'workspace_home_configs', 'workspace_experiences',
    'workspace_billing', 'workspace_consumer_configs', 'workspace_policies',
    'workspace_integrations', 'workspace_permissions', 'workspace_modules',
    'workspace_memberships', 'workspaces',
    'business_campaign_events', 'business_campaign_targets', 'business_campaigns',
    'campaign_creators', 'campaigns',
    'supplier_creator_partnerships', 'supplier_products',
    'consumer_course_sections', 'consumer_courses',
    'analytics_views', 'analytics_revenue',
    'ip_infringements', 'ip_licenses',
    'fans', 'membership_tiers',
    'social_chat_messages', 'social_chats',
    'group_chat_messages', 'group_chats',
    'conversations', 'agent_tasks', 'ai_agents',
    'products', 'posts', 'users',
  ]
  for (const table of tables) {
    const { error } = await admin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.log(`  Warning: could not clear ${table}: ${error.message}`)
  }
  console.log('  Done')
}

async function ensureAuthUser({ email, name }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  })
  if (error) throw error
  return data.user
}

async function createProfile(account, authUserId) {
  const username = account.handle.replace('@', '')
  const initials = account.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const { data, error } = await admin
    .from('users')
    .insert({
      auth_id: authUserId,
      username,
      handle: account.handle,
      email: account.email,
      role: 'fan',
      roles: ['fan'],
      name: account.name,
      bio: account.bio || '',
      avatar_img: account.avatarImg || null,
      cover_img: account.coverImg || null,
      avatar_color: account.color,
      initials,
      followers: account.followers || 0,
      following: account.following || 0,
      posts: account.posts || 0,
      verified: account.verified || false,
      onboarding_completed: true,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function getTemplateByKey(templateKey) {
  const { data, error } = await admin
    .from('agent_templates')
    .select('id')
    .eq('template_key', templateKey)
    .single()
  if (error) return null
  return data
}

async function createWorkspaceWithModules(userId, account) {
  if (account.modules.length === 0) return null

  const username = account.handle.replace('@', '')
  const { data: workspace, error: wsErr } = await admin
    .from('workspaces')
    .insert({
      owner_user_id: userId,
      name: `${account.name} Workspace`,
      slug: `${username}-workspace`,
      status: 'active',
    })
    .select('id')
    .single()
  if (wsErr) throw wsErr

  const { error: memErr } = await admin
    .from('workspace_memberships')
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      membership_role: 'owner',
      status: 'active',
    })
  if (memErr) throw memErr

  // Insert all module rows so toggles work; only enable the assigned ones
  const allModuleKeys = ['creator_ops', 'marketing', 'supply_chain']
  for (const moduleKey of allModuleKeys) {
    const { error: modErr } = await admin
      .from('workspace_modules')
      .insert({ workspace_id: workspace.id, module_key: moduleKey, enabled: account.modules.includes(moduleKey) })
    if (modErr) throw modErr
  }

  const { error: permErr } = await admin
    .from('workspace_permissions')
    .insert([
      { workspace_id: workspace.id, membership_role: 'owner', resource: 'campaign', action: 'publish', allowed: true },
      { workspace_id: workspace.id, membership_role: 'owner', resource: 'billing', action: 'manage', allowed: true },
      { workspace_id: workspace.id, membership_role: 'owner', resource: 'integration', action: 'manage', allowed: true },
    ])
  if (permErr) throw permErr

  const { error: intErr } = await admin
    .from('workspace_integrations')
    .insert([
      { workspace_id: workspace.id, provider: 'Shopify', status: 'planned', config_json: {} },
      { workspace_id: workspace.id, provider: 'Zendesk', status: 'planned', config_json: {} },
      { workspace_id: workspace.id, provider: 'Mixpanel', status: 'planned', config_json: {} },
    ])
  if (intErr) throw intErr

  const { error: polErr } = await admin
    .from('workspace_policies')
    .insert({
      workspace_id: workspace.id,
      approval_policy: { publish_requires_marketer_approval: true, budget_change_review_threshold: 500 },
      sandbox_policy: { takeover_mode: 'manual', high_risk_actions_require_review: true },
      notification_policy: { route_creator_approvals_to_workspace: true, route_publish_events_to_workspace: true },
    })
  if (polErr) throw polErr

  const { error: bilErr } = await admin
    .from('workspace_billing')
    .insert({ workspace_id: workspace.id, plan: 'starter', status: 'trial', billing_email: account.email })
  if (bilErr) throw bilErr

  // Seed consumer config for users with a community (so their community shows up)
  if (account.communityTitle) {
    const configJson = { featured_template: 'fan_community' }
    if (account.communityTitle) configJson.community_hero_title = account.communityTitle
    if (account.communityCover) configJson.cover_img = account.communityCover
    const { error: ccErr } = await admin
      .from('workspace_consumer_configs')
      .insert({
        workspace_id: workspace.id,
        template_key: 'fan_community',
        config_json: configJson,
      })
    if (ccErr) console.log(`  Warning: consumer config: ${ccErr.message}`)
  }

  // Hire agents and assign tasks
  for (const moduleKey of account.modules) {
    const agents = WORKSPACE_AGENTS[moduleKey] || []
    for (const agentDef of agents) {
      const template = await getTemplateByKey(agentDef.templateKey)
      const { data: agentRow, error: agentErr } = await admin
        .from('workspace_agents')
        .insert({
          workspace_id: workspace.id,
          template_id: template?.id || null,
          hired_by_user_id: userId,
          agent_key: agentDef.agentKey,
          name: agentDef.name,
          role: agentDef.role,
          avatar_img: agentDef.avatarImg,
          color: agentDef.color,
          status: 'online',
          description: agentDef.description,
          last_message: agentDef.lastMessage,
          last_time: agentDef.lastTime,
          ...(agentDef.larkAppId && { lark_app_id: agentDef.larkAppId }),
          ...(agentDef.larkAppSecret && { lark_app_secret: agentDef.larkAppSecret }),
        })
        .select('id')
        .single()
      if (agentErr) {
        console.log(`  Warning: could not create agent ${agentDef.name}: ${agentErr.message}`)
        continue
      }

      // Seed tasks for this agent
      const tasks = AGENT_TASKS[agentDef.agentKey] || []
      for (const task of tasks) {
        const { error: taskErr } = await admin
          .from('workspace_agent_tasks')
          .insert({
            workspace_agent_id: agentRow.id,
            task_key: task.task_key,
            title: task.title,
            status: task.status,
            priority: task.priority,
            due: task.due || null,
            progress: task.progress || 0,
          })
        if (taskErr) console.log(`  Warning: task ${task.task_key}: ${taskErr.message}`)
      }
    }
  }

  return workspace.id
}

// ── Link-only mode: just create auth users and link to existing public.users ──

const LINK_ONLY = process.argv.includes('--link-only')

async function linkAuthToExistingUsers() {
  console.log('Linking auth accounts to existing public.users...\n')

  await deleteAllAuthUsers()

  const summary = []
  for (const account of ACCOUNTS) {
    const authUser = await ensureAuthUser(account)

    // Update existing public.users row to link auth_id
    const { data, error } = await admin
      .from('users')
      .update({ auth_id: authUser.id, onboarding_completed: true })
      .eq('email', account.email)
      .select('id')
      .single()

    if (error || !data) {
      console.log(`  ⚠ ${account.name}: no matching user row (${error?.message || 'not found'})`)
      continue
    }

    const moduleLabel = account.modules.length > 0 ? account.modules.join(', ') : 'consumer'
    summary.push({ email: account.email, password: DEMO_PASSWORD, name: account.name, handle: account.handle, type: moduleLabel })
    console.log(`  ✓ ${account.name} (${moduleLabel})`)
  }

  console.log('\n=== Summary ===\n')
  console.table(summary)
  console.log(`\nAll ${summary.length} accounts linked with password: ${DEMO_PASSWORD}`)
  console.log('Tip: Run after "supabase db reset" to link auth with seed data.')
}

// ── Main ────────────────────────────────────────────────────────────

console.log('=== OLU Demo Account Setup ===\n')

if (LINK_ONLY) {
  await linkAuthToExistingUsers()
  process.exit(0)
}

await deleteAllAuthUsers()
await truncateAllTables()

// Seed agent templates first
console.log('\nSeeding agent templates...')
const templates = [
  { template_key: 'ip_manager', name: 'IP Manager', role: 'IP Manager', avatar_img: '/images/agents/lisa.jpg', color: 'from-zinc-600 to-zinc-500', category: 'Creator', pricing_model: 'free', price_label: 'Free', model: 'GPT-5.2', cost_per_1k: 0.005, rating: 4.9, reviews: 1240, description: 'Manages IP licensing, authorizations, and royalty collection.', status: 'active' },
  { template_key: 'legal_officer', name: 'Legal Officer', role: 'Legal Officer', avatar_img: '/images/agents/debian.jpg', color: 'from-red-500 to-rose-600', category: 'Creator', pricing_model: 'free', price_label: 'Free', model: 'Claude Opus 4.6', cost_per_1k: 0.003, rating: 4.8, reviews: 890, description: 'Monitors unauthorized use and sends DMCA takedowns.', status: 'active' },
  { template_key: 'community_manager', name: 'Community Manager', role: 'Community Manager', avatar_img: '/images/agents/aria.jpg', color: 'from-pink-500 to-rose-500', category: 'Creator', pricing_model: 'free', price_label: 'Free', model: 'Gemini 3 Flash', cost_per_1k: 0.0001, rating: 4.7, reviews: 2100, description: 'Runs community events and rewards top customers.', status: 'active' },
  { template_key: 'growth_officer', name: 'Growth Officer', role: 'Growth Officer', avatar_img: '/images/agents/zephyr.jpg', color: 'from-emerald-500 to-teal-600', category: 'Creator', pricing_model: 'free', price_label: 'Free', model: 'Claude Sonnet 4.5', cost_per_1k: 0.003, rating: 4.6, reviews: 1560, description: 'Drives follower and subscriber growth across platforms.', status: 'active' },
  { template_key: 'data_analyst', name: 'Data Analyst', role: 'Data Analyst', avatar_img: '/images/agents/eric.jpg', color: 'from-blue-500 to-indigo-600', category: 'Creator', pricing_model: 'free', price_label: 'Free', model: 'GPT-5.2', cost_per_1k: 0.005, rating: 4.9, reviews: 3200, description: 'Deep analytics across all platforms with actionable insights.', status: 'active' },
  { template_key: 'creativity_officer', name: 'Creativity Officer', role: 'Creativity Officer', avatar_img: '/images/agents/nova.jpg', color: 'from-orange-400 to-amber-500', category: 'Creator', pricing_model: 'free', price_label: 'Free', model: 'Gemini 3.1 Pro', cost_per_1k: 0.0002, rating: 4.8, reviews: 2800, description: 'Content ideation based on trends and audience behavior.', status: 'active' },
  { template_key: 'marketing_manager', name: 'Marketing Manager', role: 'Marketing Manager', avatar_img: '/images/agents/max.jpg', color: 'from-blue-500 to-cyan-500', category: 'Advertiser', pricing_model: 'free', price_label: 'Free', model: 'GPT-5.1', cost_per_1k: 0.004, rating: 4.7, reviews: 980, description: 'End-to-end influencer campaign planning and execution.', status: 'active' },
  { template_key: 'channel_manager', name: 'Channel Manager', role: 'Channel Manager', avatar_img: '/images/agents/chan.jpg', color: 'from-emerald-500 to-green-600', category: 'Supplier', pricing_model: 'free', price_label: 'Free', model: 'Claude Haiku 4.x', cost_per_1k: 0.0001, rating: 4.5, reviews: 560, description: 'Connects creators and suppliers for merch partnerships.', status: 'active' },
  { template_key: 'finance_officer', name: 'Finance Officer', role: 'Finance Officer', avatar_img: '/images/agents/finance.jpg', color: 'from-yellow-500 to-amber-600', category: 'Pro', pricing_model: 'subscription', price_label: '$9.99/mo', model: 'GPT-5.2-Codex', cost_per_1k: 0.006, rating: 4.9, reviews: 1100, description: 'Cross-border payments, invoicing, and financial reporting.', status: 'active' },
  { template_key: 'localization_agent', name: 'Localization Agent', role: 'Localization Agent', avatar_img: '/images/agents/localization.jpg', color: 'from-cyan-500 to-blue-600', category: 'Pro', pricing_model: 'subscription', price_label: '$4.99/mo', model: 'Gemini 3 Pro', cost_per_1k: 0.0003, rating: 4.6, reviews: 430, description: 'Translates and localizes content for global audiences.', status: 'active' },
]
const { error: tplErr } = await admin.from('agent_templates').insert(templates)
if (tplErr) console.log(`  Warning: agent templates: ${tplErr.message}`)
else console.log(`  Created ${templates.length} agent templates`)

console.log('\nCreating accounts...\n')

const summary = []

for (const account of ACCOUNTS) {
  const authUser = await ensureAuthUser(account)
  const profileId = await createProfile(account, authUser.id)
  await createWorkspaceWithModules(profileId, account)

  // Create user wallet
  const walletBalance = account.modules.length > 0
    ? { usdc_balance: Math.floor(Math.random() * 20000) + 5000, token_balance: Math.floor(Math.random() * 15000) + 3000 }
    : { usdc_balance: Math.floor(Math.random() * 500) + 50, token_balance: Math.floor(Math.random() * 3000) + 200 }
  await admin.from('user_wallets').upsert({
    user_id: profileId,
    ...walletBalance,
  }, { onConflict: 'user_id' })

  const moduleLabel = account.modules.length > 0 ? account.modules.join(', ') : 'consumer'
  summary.push({
    userId: profileId,
    email: account.email,
    password: DEMO_PASSWORD,
    name: account.name,
    handle: account.handle,
    type: moduleLabel,
  })
  console.log(`  ✓ ${account.name} (${moduleLabel})`)
}

// ── Seed Academy Courses ────────────────────────────────────────────
console.log('\nSeeding academy courses...')

// Map handle to userId for course creator_id
const handleToUserId = {}
for (let i = 0; i < ACCOUNTS.length; i++) {
  handleToUserId[ACCOUNTS[i].handle] = summary[i].userId
}

const COURSES = [
  {
    creatorHandle: '@lunachen',
    slug: 'digital-art-masterclass',
    title: 'Digital Art Masterclass',
    subtitle: 'From sketch to stunning — learn digital painting from zero to portfolio-ready.',
    instructor: 'Luna Chen',
    price: 49,
    level: 'Beginner',
    hero: '/images/covers/gamingsetup.jpg',
    headline: 'The complete guide to digital illustration',
    description: 'Learn professional digital painting techniques, color theory, and composition.',
    outcomes: ['Master digital brushwork and layering', 'Build a polished art portfolio', 'Sell prints and commissions'],
    lessons_count: 24,
    students_count: 3400,
    completion_rate: '78%',
  },
  {
    creatorHandle: '@kaivibe',
    slug: 'lofi-production-101',
    title: 'Lo-fi Production 101',
    subtitle: 'Craft chill beats from scratch using free tools and analog textures.',
    instructor: 'Kai Vibe',
    price: 39,
    level: 'Beginner',
    hero: '/images/covers/galaxyquest.jpg',
    headline: 'Make your first lo-fi track in a weekend',
    description: 'Step-by-step music production for lo-fi, chillhop, and ambient beats.',
    outcomes: ['Set up a free production environment', 'Layer samples and synths', 'Publish on streaming platforms'],
    lessons_count: 18,
    students_count: 5100,
    completion_rate: '82%',
  },
  {
    creatorHandle: '@zaranova',
    slug: 'sustainable-fashion-design',
    title: 'Sustainable Fashion Design',
    subtitle: 'Design, source, and launch an eco-conscious clothing line.',
    instructor: 'Zara Nova',
    price: 59,
    level: 'Intermediate',
    hero: '/images/covers/alexpark.jpg',
    headline: 'Build a fashion brand that respects the planet',
    description: 'From fabric sourcing to brand identity — launch sustainable fashion.',
    outcomes: ['Source ethical materials', 'Create a capsule collection', 'Build a brand story that sells'],
    lessons_count: 20,
    students_count: 1800,
    completion_rate: '71%',
  },
]

for (const course of COURSES) {
  const creatorId = handleToUserId[course.creatorHandle]
  if (!creatorId) {
    console.log(`  Warning: no userId for ${course.creatorHandle}, skipping course`)
    continue
  }
  const { error: courseErr } = await admin.from('consumer_courses').insert({
    creator_id: creatorId,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    instructor: course.instructor,
    price: course.price,
    level: course.level,
    hero: course.hero,
    headline: course.headline,
    description: course.description,
    outcomes: course.outcomes,
    lessons_count: course.lessons_count,
    students_count: course.students_count,
    completion_rate: course.completion_rate,
    status: 'published',
  })
  if (courseErr) console.log(`  Warning: course ${course.slug}: ${courseErr.message}`)
  else console.log(`  ✓ ${course.title} by ${course.instructor}`)
}

// ── Seed Products ───────────────────────────────────────────────────
console.log('\nSeeding products...')

const PRODUCTS = [
  { creatorHandle: '@lunachen', name: 'Neon City Hoodie', description: "Premium streetwear hoodie with Luna's Neon City artwork.", price: 59.99, image: '/images/products/hoodie.jpg', category: 'apparel', stock: 45, sold_count: 234, status: 'active' },
  { creatorHandle: '@lunachen', name: 'Pixel Pin Set', description: 'Collectible enamel pin set featuring pixel art characters.', price: 24.99, image: '/images/products/pins.jpg', category: 'accessories', stock: 120, sold_count: 189, status: 'active' },
  { creatorHandle: '@lunachen', name: 'Luna Acrylic Stand', description: "High-quality acrylic standee of Luna's signature character.", price: 34.99, image: '/images/products/stand.jpg', category: 'collectibles', stock: 67, sold_count: 156, status: 'active' },
  { creatorHandle: '@lunachen', name: 'Chibi Luna Plushie', description: 'Soft plushie of chibi Luna, limited edition.', price: 44.99, image: '/images/products/plushie.jpg', category: 'collectibles', stock: 12, sold_count: 78, status: 'low_stock' },
]

for (const product of PRODUCTS) {
  const creatorId = handleToUserId[product.creatorHandle]
  if (!creatorId) {
    console.log(`  Warning: no userId for ${product.creatorHandle}, skipping product`)
    continue
  }
  const { error: productErr } = await admin.from('products').insert({
    creator_id: creatorId,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category,
    stock: product.stock,
    sold_count: product.sold_count,
    status: product.status,
  })
  if (productErr) console.log(`  Warning: product ${product.name}: ${productErr.message}`)
  else console.log(`  ✓ ${product.name}`)
}

console.log('\n=== Summary ===\n')
console.table(summary.map(({ userId, ...rest }) => rest))
console.log(`\nAll ${ACCOUNTS.length} accounts created with password: ${DEMO_PASSWORD}`)
