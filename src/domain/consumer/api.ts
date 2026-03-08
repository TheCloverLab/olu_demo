import type { ConsumerTemplateKey } from '../../apps/consumer/templateConfig'

export type CommunityTier = {
  name: string
  price: string
  note: string
  perks: string[]
}

export type CommunityTopic = {
  id: string
  name: string
  members: string
  description: string
}

export type LearningStep = {
  label: string
  note: string
}

export type ConsumerExperience = {
  templateKey: ConsumerTemplateKey
  profile: {
    title: string
    description: string
    ctaLabel: string
    ctaHref: string
  }
  community: {
    hero: {
      eyebrow: string
      title: string
      description: string
      stats: Array<{ label: string; value: string }>
    }
    membership: {
      title: string
      subtitle: string
      ctaLabel: string
      tiers: CommunityTier[]
    }
    topics: {
      title: string
      subtitle: string
      whyItExists: string
      entries: CommunityTopic[]
    }
    spaces: {
      title: string
      subtitle: string
    }
    feed: {
      title: string
      subtitle: string
    }
  }
  courses: {
    storefront: {
      eyebrow: string
      title: string
      description: string
      primaryCta: string
      secondaryCta: string
    }
    catalog: {
      title: string
      subtitle: string
    }
    detail: {
      learnTitle: string
      actionsTitle: string
      buyLabel: string
      catalogLabel: string
    }
    learning: {
      title: string
      subtitle: string
      steps: LearningStep[]
      shortcuts: Array<{ label: string; href: string }>
    }
  }
}

const COMMUNITY_TIERS: CommunityTier[] = [
  {
    name: 'Free',
    price: '$0',
    note: 'Public posts, comments, community lobby',
    perks: ['Public posts', 'Community lobby', 'Weekly digest'],
  },
  {
    name: 'Core',
    price: '$9.99',
    note: 'Members-only drops, event access, private threads',
    perks: ['Members-only posts', 'Circle access', 'Early drops'],
  },
  {
    name: 'VIP',
    price: '$29.99',
    note: 'Direct feedback, live Q&A priority, backstage updates',
    perks: ['Direct feedback', 'Live Q&A priority', 'Merch pre-sale'],
  },
]

const COMMUNITY_TOPICS: CommunityTopic[] = [
  {
    id: 'critique-room',
    name: 'Weekly Critique Room',
    members: '1.8K',
    description: 'Members post work-in-progress and get structured feedback every Friday.',
  },
  {
    id: 'drop-watch',
    name: 'Drop Watch',
    members: '920',
    description: 'Track new releases, early-access content, and private merch drops.',
  },
  {
    id: 'creator-qna',
    name: 'Creator Q&A',
    members: '2.4K',
    description: 'Ask the host about process, tools, and behind-the-scenes decisions.',
  },
]

const LEARNING_STEPS: LearningStep[] = [
  {
    label: 'Start with positioning',
    note: 'Clarify the promise and target learner first.',
  },
  {
    label: 'Map modules and lessons',
    note: 'Turn expertise into a clear chapter flow.',
  },
  {
    label: 'Launch and track completion',
    note: 'Use progress and retention milestones as product signals.',
  },
]

export function getConsumerExperience(
  templateKey: ConsumerTemplateKey,
  viewerName?: string
): ConsumerExperience {
  const name = viewerName || 'Guest'

  return {
    templateKey,
    profile: {
      title: templateKey === 'sell_courses' ? 'Course Template' : 'Community Template',
      description:
        templateKey === 'sell_courses'
          ? `${name} is currently browsing the course storefront experience.`
          : `${name} is currently browsing the fan community experience.`,
      ctaLabel: templateKey === 'sell_courses' ? 'Open catalog' : 'Open membership',
      ctaHref: templateKey === 'sell_courses' ? '/courses' : '/membership',
    },
    community: {
      hero: {
        eyebrow: 'Fan Community',
        title: 'A place for members, rituals, and conversations that stay alive every week.',
        description:
          'Join creator spaces built around access, identity, discussion, and recurring drops instead of one-off purchases.',
        stats: [
          { label: 'Active members', value: '8.4K' },
          { label: 'Live circles', value: '24' },
          { label: 'Member renewals', value: '81%' },
        ],
      },
      membership: {
        title: 'Join a creator circle',
        subtitle: 'A clear ladder from casual follower to committed member.',
        ctaLabel: 'Open membership tiers',
        tiers: COMMUNITY_TIERS,
      },
      topics: {
        title: 'Browse active circles',
        subtitle: 'Recurring discussions, creator rituals, and member-only threads.',
        whyItExists:
          'The community template needs a first-class topic layer. This page gives members a place to enter circles instead of treating everything as a flat feed.',
        entries: COMMUNITY_TOPICS,
      },
      spaces: {
        title: 'Creator spaces',
        subtitle: 'The rooms members actually come back to every week.',
      },
      feed: {
        title: 'Recent member drops',
        subtitle: 'Locked posts, weekly updates, and creator notes.',
      },
    },
    courses: {
      storefront: {
        eyebrow: 'Course Storefront',
        title: 'Sell structured knowledge, not merch.',
        description:
          'This template replaces the merch shop with a course catalog, checkout flow, and learning hub.',
        primaryCta: 'Open catalog',
        secondaryCta: 'View learning hub',
      },
      catalog: {
        title: 'Course Catalog',
        subtitle: 'Structured offers with clear outcomes and chapter flow.',
      },
      detail: {
        learnTitle: 'What you will learn',
        actionsTitle: 'Next actions',
        buyLabel: 'Buy course',
        catalogLabel: 'View catalog',
      },
      learning: {
        title: 'Learning',
        subtitle: 'Progress, recent lessons, and continue-learning entry.',
        steps: LEARNING_STEPS,
        shortcuts: [
          { label: 'Catalog', href: '/courses' },
          { label: 'My learning', href: '/learning' },
        ],
      },
    },
  }
}
