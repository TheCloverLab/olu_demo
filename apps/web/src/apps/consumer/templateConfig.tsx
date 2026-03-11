import type { LucideIcon } from 'lucide-react'
import { BookOpen, Calendar, Camera, Compass, GraduationCap, MessageCircle, Rss, Sparkles, User, Users, Video } from 'lucide-react'

export type ConsumerNavItem = {
  to: string
  icon: LucideIcon
  label: string
  exact?: boolean
}

export type ConsumerAppType = 'community' | 'academy' | 'consulting'

export type ConsumerTemplateDefinition = {
  label: string
  shortLabel: string
  description: string
  accent: string
  homeTitle: string
  appType: ConsumerAppType
  nav: ConsumerNavItem[]
  quickLinks: ConsumerNavItem[]
  profile: {
    ctaLabel: string
    ctaHref: string
    browseDescription: (viewerName: string) => string
  }
}

const CONSUMER_TEMPLATES = {
  fan_community: {
    label: 'Community',
    shortLabel: 'Community',
    description: 'Membership, topics, and fan interaction',
    accent: 'from-rose-500 via-fuchsia-500 to-orange-400',
    homeTitle: 'Community',
    appType: 'community' as const,
    nav: [
      { to: '/discover', icon: Compass, label: 'nav.discover' },
      { to: '/chat', icon: MessageCircle, label: 'nav.chat' },
      { to: '/profile', icon: User, label: 'nav.me' },
    ],
    quickLinks: [
      { to: '/membership', icon: Sparkles, label: 'consumer.membership' },
      { to: '/topics', icon: Users, label: 'consumer.topics' },
      { to: '/gallery', icon: Camera, label: 'consumer.gallery' },
      { to: '/feed', icon: Rss, label: 'consumer.feed' },
    ],
    profile: {
      ctaLabel: 'Open membership',
      ctaHref: '/membership',
      browseDescription: (name: string) => `${name} is currently browsing the community experience.`,
    },
  },
  sell_courses: {
    label: 'Academy',
    shortLabel: 'Academy',
    description: 'Course catalog, chapters, and learning progress',
    accent: 'from-sky-500 via-cyan-400 to-emerald-400',
    homeTitle: 'Academy',
    appType: 'academy' as const,
    nav: [
      { to: '/discover', icon: Compass, label: 'nav.discover' },
      { to: '/chat', icon: MessageCircle, label: 'nav.chat' },
      { to: '/profile', icon: User, label: 'nav.me' },
    ],
    quickLinks: [
      { to: '/courses', icon: GraduationCap, label: 'consumer.catalog' },
      { to: '/learning', icon: BookOpen, label: 'consumer.learning' },
    ],
    profile: {
      ctaLabel: 'Open catalog',
      ctaHref: '/courses',
      browseDescription: (name: string) => `${name} is currently browsing the academy experience.`,
    },
  },
  consulting: {
    label: 'Consulting',
    shortLabel: 'Consult',
    description: '1-on-1 sessions, bookings, and expert advice',
    accent: 'from-violet-500 via-purple-500 to-indigo-400',
    homeTitle: 'Consulting',
    appType: 'consulting' as const,
    nav: [
      { to: '/discover', icon: Compass, label: 'consumer.experts' },
      { to: '/chat', icon: MessageCircle, label: 'nav.chat' },
      { to: '/profile', icon: User, label: 'nav.me' },
    ],
    quickLinks: [
      { to: '/bookings', icon: Calendar, label: 'consumer.bookings' },
      { to: '/sessions', icon: Video, label: 'consumer.sessions' },
    ],
    profile: {
      ctaLabel: 'Book a session',
      ctaHref: '/bookings',
      browseDescription: (name: string) => `${name} is currently browsing the consulting experience.`,
    },
  },
} as const satisfies Record<string, ConsumerTemplateDefinition>

export type ConsumerTemplateKey = keyof typeof CONSUMER_TEMPLATES

export const DEFAULT_TEMPLATE: ConsumerTemplateKey = 'fan_community'

export function getTemplateDefinition(key: ConsumerTemplateKey): ConsumerTemplateDefinition {
  return CONSUMER_TEMPLATES[key]
}

export function isValidTemplateKey(value: string): value is ConsumerTemplateKey {
  return value in CONSUMER_TEMPLATES
}

export function getTemplateKeys(): ConsumerTemplateKey[] {
  return Object.keys(CONSUMER_TEMPLATES) as ConsumerTemplateKey[]
}

export function getAppTypeForTemplate(key: ConsumerTemplateKey): ConsumerAppType {
  return CONSUMER_TEMPLATES[key].appType
}

export function getTemplateKeyForAppType(appType: ConsumerAppType): ConsumerTemplateKey {
  const entry = Object.entries(CONSUMER_TEMPLATES).find(([, def]) => def.appType === appType)
  return (entry?.[0] as ConsumerTemplateKey) || DEFAULT_TEMPLATE
}

// Backward-compatible exports — these are derived from the registry
export const CONSUMER_TEMPLATE_META: Record<ConsumerTemplateKey, Pick<ConsumerTemplateDefinition, 'label' | 'shortLabel' | 'description' | 'accent' | 'homeTitle'>> =
  Object.fromEntries(
    Object.entries(CONSUMER_TEMPLATES).map(([key, def]) => [key, {
      label: def.label,
      shortLabel: def.shortLabel,
      description: def.description,
      accent: def.accent,
      homeTitle: def.homeTitle,
    }])
  ) as any

export const CONSUMER_NAV: Record<ConsumerTemplateKey, ConsumerNavItem[]> =
  Object.fromEntries(
    Object.entries(CONSUMER_TEMPLATES).map(([key, def]) => [key, def.nav])
  ) as any

export const TEMPLATE_QUICK_LINKS: Record<ConsumerTemplateKey, ConsumerNavItem[]> =
  Object.fromEntries(
    Object.entries(CONSUMER_TEMPLATES).map(([key, def]) => [key, def.quickLinks])
  ) as any
