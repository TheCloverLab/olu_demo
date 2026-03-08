import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ConsumerExperience from '../ConsumerExperience'
import * as AuthContext from '../../../../context/AuthContext'
import * as AppContext from '../../../../context/AppContext'
import * as ConsumerApi from '../../../../domain/consumer/api'
import * as Api from '../../../../services/api'

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../../../domain/consumer/api', () => ({
  getCommunityMembershipSnapshot: vi.fn(),
  getCourseLibrarySnapshot: vi.fn(),
}))

vi.mock('../../../../services/api', () => ({
  updateConsumerCourse: vi.fn(),
}))

describe('ConsumerExperience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('renders membership operations when template is fan community', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerTemplate: 'fan_community',
      consumerConfig: {
        featured_creator_id: 'creator-1',
        featured_course_slug: 'community-growth',
      },
      consumerExperience: {
        community: {
          hero: {
            title: 'Members first community',
            description: 'Custom community copy',
          },
        },
        courses: {
          storefront: {
            title: 'Structured learning storefront',
            description: 'Custom course copy',
          },
        },
      },
    } as any)
    vi.mocked(ConsumerApi.getCommunityMembershipSnapshot).mockResolvedValue({
      creator: { id: 'creator-1', name: 'Luna Chen' },
      tiers: [
        { key: 'core', name: 'Core', price: '$9', note: 'Members-only posts', perks: [] },
        { key: 'vip', name: 'VIP', price: '$29', note: 'Priority access', perks: [] },
      ],
      totalMembers: 320,
      activeFans: 180,
      topFans: [],
    } as any)

    render(<MemoryRouter><ConsumerExperience /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Membership surface')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen')).toBeInTheDocument()
      expect(screen.getByText('320')).toBeInTheDocument()
    })
  })

  it('renders course operations when template is sell courses', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerTemplate: 'sell_courses',
      consumerConfig: {
        featured_creator_id: 'creator-1',
        featured_course_slug: 'community-growth',
      },
      consumerExperience: {
        community: {
          hero: {
            title: 'Members first community',
            description: 'Custom community copy',
          },
        },
        courses: {
          storefront: {
            title: 'Structured learning storefront',
            description: 'Custom course copy',
          },
        },
      },
    } as any)
    vi.mocked(ConsumerApi.getCourseLibrarySnapshot).mockResolvedValue({
      courses: [
        {
          id: 'course-1',
          slug: 'community-growth',
          title: 'Build a Paid Fan Community',
          subtitle: 'Turn audience attention into a business.',
          instructor: 'Luna Chen',
          price: 129,
          level: 'Intermediate',
          hero: 'from-rose-600 to-orange-500',
          headline: 'Headline',
          description: 'Description',
          outcomes: [],
          stats: {
            lessons: 18,
            students: 1240,
            completionRate: '68%',
          },
          sections: [],
        },
      ],
      featuredCourse: {
        id: 'course-1',
        slug: 'community-growth',
        title: 'Build a Paid Fan Community',
        subtitle: 'Turn audience attention into a business.',
        instructor: 'Luna Chen',
        price: 129,
        level: 'Intermediate',
        hero: 'from-rose-600 to-orange-500',
        headline: 'Headline',
        description: 'Description',
        outcomes: [],
        stats: {
          lessons: 18,
          students: 1240,
          completionRate: '68%',
        },
        sections: [],
      },
    } as any)

    render(<MemoryRouter><ConsumerExperience /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Course storefront')).toBeInTheDocument()
      expect(screen.getAllByText('Build a Paid Fan Community').length).toBeGreaterThan(0)
      expect(screen.getByText('1240')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Build a Paid Fan Community')).toBeInTheDocument()
    })
  })

  it('saves featured course copy changes', async () => {
    const user = userEvent.setup()

    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerTemplate: 'sell_courses',
      consumerConfig: {
        featured_creator_id: 'creator-1',
        featured_course_slug: 'community-growth',
      },
      consumerExperience: {
        community: {
          hero: {
            title: 'Members first community',
            description: 'Custom community copy',
          },
        },
        courses: {
          storefront: {
            title: 'Structured learning storefront',
            description: 'Custom course copy',
          },
        },
      },
    } as any)
    vi.mocked(ConsumerApi.getCourseLibrarySnapshot).mockResolvedValue({
      courses: [
        {
          id: 'course-1',
          slug: 'community-growth',
          title: 'Build a Paid Fan Community',
          subtitle: 'Turn audience attention into a business.',
          instructor: 'Luna Chen',
          price: 129,
          level: 'Intermediate',
          hero: 'from-rose-600 to-orange-500',
          headline: 'Headline',
          description: 'Description',
          outcomes: [],
          stats: {
            lessons: 18,
            students: 1240,
            completionRate: '68%',
          },
          sections: [],
        },
      ],
      featuredCourse: {
        id: 'course-1',
        slug: 'community-growth',
        title: 'Build a Paid Fan Community',
        subtitle: 'Turn audience attention into a business.',
        instructor: 'Luna Chen',
        price: 129,
        level: 'Intermediate',
        hero: 'from-rose-600 to-orange-500',
        headline: 'Headline',
        description: 'Description',
        outcomes: [],
        stats: {
          lessons: 18,
          students: 1240,
          completionRate: '68%',
        },
        sections: [],
      },
    } as any)
    vi.mocked(Api.updateConsumerCourse).mockResolvedValue({
      id: 'course-1',
      title: 'Scale a Paid Fan Community',
      subtitle: 'Updated subtitle',
      headline: 'Updated headline',
      description: 'Updated description',
    } as any)

    render(<MemoryRouter><ConsumerExperience /></MemoryRouter>)

    const titleInput = await screen.findByDisplayValue('Build a Paid Fan Community')
    await user.clear(titleInput)
    await user.type(titleInput, 'Scale a Paid Fan Community')
    await user.click(screen.getByText('Save featured course copy'))

    await waitFor(() => {
      expect(Api.updateConsumerCourse).toHaveBeenCalledWith('course-1', expect.objectContaining({
        title: 'Scale a Paid Fan Community',
      }))
      expect(screen.getAllByText('Scale a Paid Fan Community').length).toBeGreaterThan(0)
    })
  })
})
