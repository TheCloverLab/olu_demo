import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionProvider, useSession } from '../SessionContext'
import { WorkspaceProvider, useWorkspace } from '../WorkspaceContext'
import { ConsumerProvider, useConsumer } from '../ConsumerContext'
import * as AuthContext from '../AuthContext'
import * as WorkspaceApi from '../../domain/workspace/api'
import * as ConsumerApps from '../../domain/consumer/apps'

vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/workspace/api', () => ({
  getEnabledBusinessModulesForUser: vi.fn(),
  getConsumerTemplateForUser: vi.fn(),
  getWorkspaceConsumerConfigForUser: vi.fn(),
  updateWorkspaceConsumerConfigForUser: vi.fn(),
  updateWorkspaceConsumerTemplateForUser: vi.fn(),
}))

vi.mock('../../domain/consumer/apps', () => ({
  getOwnedConsumerApps: vi.fn(),
  getPrimaryConsumerApp: vi.fn(),
}))

describe('Split Contexts', () => {
  describe('SessionContext', () => {
    it('provides guest user when not authenticated', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null, session: null, loading: false,
        signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(),
      })

      function Consumer() {
        const { currentUser } = useSession()
        return <span>{currentUser.name}</span>
      }

      render(<SessionProvider><Consumer /></SessionProvider>)
      expect(screen.getByText('Guest')).toBeInTheDocument()
    })

    it('provides authenticated user', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: '1', name: 'Alice' } as any,
        session: {} as any, loading: false,
        signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(),
      })

      function Consumer() {
        const { currentUser } = useSession()
        return <span>{currentUser.name}</span>
      }

      render(<SessionProvider><Consumer /></SessionProvider>)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('throws outside provider', () => {
      function Bad() {
        useSession()
        return null
      }
      expect(() => render(<Bad />)).toThrow('useSession must be used within SessionProvider')
    })
  })

  describe('WorkspaceContext', () => {
    it('defaults to empty modules for unauthenticated user', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null, session: null, loading: false,
        signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(),
      })

      function Consumer() {
        const { enabledBusinessModules, hasModule } = useWorkspace()
        return (
          <div>
            <span>count:{enabledBusinessModules.length}</span>
            <span>has:{String(hasModule('creator_ops'))}</span>
          </div>
        )
      }

      render(<WorkspaceProvider><Consumer /></WorkspaceProvider>)
      expect(screen.getByText('count:0')).toBeInTheDocument()
      expect(screen.getByText('has:false')).toBeInTheDocument()
    })

    it('throws outside provider', () => {
      function Bad() {
        useWorkspace()
        return null
      }
      expect(() => render(<Bad />)).toThrow('useWorkspace must be used within WorkspaceProvider')
    })
  })

  describe('ConsumerContext', () => {
    it('throws outside provider', () => {
      function Bad() {
        useConsumer()
        return null
      }
      expect(() => render(<Bad />)).toThrow('useConsumer must be used within ConsumerProvider')
    })
  })
})
