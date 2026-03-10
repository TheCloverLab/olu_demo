import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Topics from '../../apps/consumer/pages/Topics'
import * as AppContext from '../../context/AppContext'

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Topics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerExperience: {
        community: {
          topics: {
            subtitle: 'Recurring discussions, creator rituals, and member-only threads.',
            whyItExists: 'Topic layer exists for focused circles.',
            entries: [
              {
                id: 'office-hours',
                name: 'Office Hours',
                members: '320',
                description: 'Weekly live critique and Q&A.',
              },
            ],
          },
        },
      },
    } as any)
  })

  it('opens topic detail from the topic list', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/topics']}>
        <Routes>
          <Route path="/topics" element={<Topics />} />
        </Routes>
      </MemoryRouter>
    )

    await user.click(screen.getByText('Office Hours'))

    expect(mockNavigate).toHaveBeenCalledWith('/topics/office-hours')
  })

  it('renders topic detail mode and discussion CTA', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/topics/office-hours']}>
        <Routes>
          <Route path="/topics/:topicId" element={<Topics />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('About this topic')).toBeInTheDocument()
    expect(screen.getByText('Office Hours')).toBeInTheDocument()

    await user.click(screen.getByText('Open discussion'))

    expect(mockNavigate).toHaveBeenCalledWith('/chat?topic=office-hours')
  })
})
