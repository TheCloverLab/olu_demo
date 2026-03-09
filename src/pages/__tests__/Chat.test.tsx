import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Chat from '../Chat'
import * as AppContext from '../../context/AppContext'
import * as AuthContext from '../../context/AuthContext'
import * as SocialApi from '../../domain/social/api'

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/social/api', () => ({
  postDirectSocialMessage: vi.fn(),
  ensureDirectSocialChat: vi.fn(),
  getDirectSocialMessages: vi.fn(),
  getDirectSocialChats: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
  },
}))

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1', name: 'Alice' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerExperience: {
        community: {
          topics: {
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
    vi.mocked(SocialApi.getDirectSocialChats).mockResolvedValue([])
  })

  it('shows topic lobby context when opened with a topic query', async () => {
    render(
      <MemoryRouter initialEntries={['/chat?topic=office-hours']}>
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Topic lobby')).toBeInTheDocument()
      expect(screen.getByText('Office Hours')).toBeInTheDocument()
      expect(screen.getByText('Weekly live critique and Q&A.')).toBeInTheDocument()
    })
  })
})
