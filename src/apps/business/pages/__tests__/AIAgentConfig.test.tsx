import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AIAgentConfig from '../AIAgentConfig'
import * as AuthContext from '../../../../context/AuthContext'
import * as AgentApi from '../../../../domain/agent/api'

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../../domain/agent/api', () => ({
  getAgentTemplates: vi.fn(),
  getWorkspaceAgentsForUser: vi.fn(),
  hireWorkspaceAgent: vi.fn(),
}))

describe('AIAgentConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1', username: 'alice', handle: '@alice', name: 'Alice', email: 'alice@example.com' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AgentApi.getWorkspaceAgentsForUser).mockResolvedValue([
      { id: 'wa-1', workspace_id: 'ws-1', template_id: 'tpl-1', agent_key: 'ip_manager', name: 'Lisa', role: 'IP Manager', status: 'online' },
    ] as any)
    vi.mocked(AgentApi.getAgentTemplates).mockResolvedValue([
      { id: 'tpl-1', template_key: 'ip_manager', name: 'IP Manager', role: 'IP Manager', category: 'Creator', price_label: 'Free', model: 'GPT-5.2', cost_per_1k: 0.005, rating: 4.9, reviews: 1240, description: 'Manages IP licensing', avatar_img: '/images/agents/lisa.jpg', status: 'active' },
      { id: 'tpl-2', template_key: 'marketing', name: 'Marketing Manager', role: 'Marketing Manager', category: 'Advertiser', price_label: 'Free', model: 'GPT-5.1', cost_per_1k: 0.004, rating: 4.7, reviews: 980, description: 'Plans influencer campaigns', avatar_img: '/images/agents/max.jpg', status: 'active' },
    ] as any)
    vi.mocked(AgentApi.hireWorkspaceAgent).mockResolvedValue({
      id: 'wa-2',
      workspace_id: 'ws-1',
      template_id: 'tpl-2',
      agent_key: 'marketing',
      name: 'Max',
      role: 'Marketing Manager',
      status: 'online',
    } as any)
  })

  it('renders workspace-backed roster and marketplace templates', async () => {
    render(<MemoryRouter><AIAgentConfig /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Workspace-backed team members, marketplace templates, and operating coverage')).toBeInTheDocument()
      expect(screen.getByText('Lisa')).toBeInTheDocument()
      expect(screen.getByText('Marketing Manager')).toBeInTheDocument()
    })
  })

  it('hires a marketplace template through the backend api', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><AIAgentConfig /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Marketing Manager')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Hire Agent' }))
    await user.click(screen.getByRole('button', { name: 'Confirm Hire' }))

    await waitFor(() => {
      expect(AgentApi.hireWorkspaceAgent).toHaveBeenCalled()
      expect(screen.getByText(/has joined your workspace/)).toBeInTheDocument()
    })
  })
})
