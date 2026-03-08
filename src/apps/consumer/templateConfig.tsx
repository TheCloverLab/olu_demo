import type { LucideIcon } from 'lucide-react'
import { BookOpen, Compass, GraduationCap, Home, MessageCircle, Sparkles, User, Users } from 'lucide-react'

export type ConsumerTemplateKey = 'fan_community' | 'sell_courses'

export type ConsumerNavItem = {
  to: string
  icon: LucideIcon
  label: string
  exact?: boolean
}

export const CONSUMER_TEMPLATE_META: Record<ConsumerTemplateKey, {
  label: string
  shortLabel: string
  description: string
  accent: string
  homeTitle: string
}> = {
  fan_community: {
    label: 'Community',
    shortLabel: 'Community',
    description: 'Membership, topics, and fan interaction',
    accent: 'from-rose-500 via-fuchsia-500 to-orange-400',
    homeTitle: 'Community',
  },
  sell_courses: {
    label: 'Academy',
    shortLabel: 'Academy',
    description: 'Course catalog, chapters, and learning progress',
    accent: 'from-sky-500 via-cyan-400 to-emerald-400',
    homeTitle: 'Academy',
  },
}

export const CONSUMER_NAV: Record<ConsumerTemplateKey, ConsumerNavItem[]> = {
  fan_community: [
    { to: '/', icon: Home, label: 'Home', exact: true },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/topics', icon: Users, label: 'Topics' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Me' },
  ],
  sell_courses: [
    { to: '/', icon: Home, label: 'Home', exact: true },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/learning', icon: BookOpen, label: 'Learning' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Me' },
  ],
}

export const TEMPLATE_QUICK_LINKS: Record<ConsumerTemplateKey, ConsumerNavItem[]> = {
  fan_community: [
    { to: '/membership', icon: Sparkles, label: 'Membership' },
    { to: '/topics', icon: Users, label: 'Topics' },
  ],
  sell_courses: [
    { to: '/courses', icon: GraduationCap, label: 'Catalog' },
    { to: '/learning', icon: BookOpen, label: 'Learning' },
  ],
}
