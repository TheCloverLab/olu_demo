import type { LucideIcon } from 'lucide-react'
import { BookOpen, Compass, GraduationCap, Home, MessageCircle, Sparkles, User, Users } from 'lucide-react'

export type ConsumerNavItem = {
  to: string
  icon: LucideIcon
  label: string
  exact?: boolean
}

export type ConsumerAppType = 'community' | 'academy'

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
      { to: '/', icon: Home, label: 'Home', exact: true },
      { to: '/discover', icon: Compass, label: 'Discover' },
      { to: '/chat', icon: MessageCircle, label: 'Chat' },
      { to: '/profile', icon: User, label: 'Me' },
    ],
    quickLinks: [
      { to: '/membership', icon: Sparkles, label: 'Membership' },
      { to: '/topics', icon: Users, label: 'Topics' },
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
      { to: '/', icon: Home, label: 'Home', exact: true },
      { to: '/discover', icon: Compass, label: 'Discover' },
      { to: '/chat', icon: MessageCircle, label: 'Chat' },
      { to: '/profile', icon: User, label: 'Me' },
    ],
    quickLinks: [
      { to: '/courses', icon: GraduationCap, label: 'Catalog' },
      { to: '/learning', icon: BookOpen, label: 'Learning' },
    ],
    profile: {
      ctaLabel: 'Open catalog',
      ctaHref: '/courses',
      browseDescription: (name: string) => `${name} is currently browsing the academy experience.`,
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
