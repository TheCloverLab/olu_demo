import { describe, it, expect } from 'vitest'
import { toEmployee, toEmployeeWithTasks } from '../api'
import type { WorkspaceAgent, WorkspaceAgentWithTasks } from '../../../lib/supabase'

const mockAgent: WorkspaceAgent = {
  id: 'wa-1',
  workspace_id: 'ws-1',
  template_id: 'tpl-1',
  hired_by_user_id: 'user-1',
  agent_key: 'ip_manager',
  name: 'Lisa',
  role: 'IP Manager',
  avatar_img: '/images/lisa.jpg',
  color: 'from-zinc-600 to-zinc-500',
  status: 'online',
  description: 'Manages IP licensing',
  last_message: 'Lisa is live.',
  last_time: 'Just now',
  hired_at: '2024-01-01',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

describe('Employee adapter', () => {
  it('maps WorkspaceAgent to Employee with kind=ai', () => {
    const employee = toEmployee(mockAgent)

    expect(employee.kind).toBe('ai')
    expect(employee.name).toBe('Lisa')
    expect(employee.position).toBe('IP Manager')
    expect(employee.agent_key).toBe('ip_manager')
    expect(employee.template_id).toBe('tpl-1')
    expect(employee.user_id).toBeNull()
    expect(employee.email).toBeNull()
    expect(employee.employment_status).toBe('active')
  })

  it('maps WorkspaceAgentWithTasks to EmployeeWithTasks', () => {
    const agentWithTasks: WorkspaceAgentWithTasks = {
      ...mockAgent,
      tasks: [
        {
          id: 'task-1',
          workspace_agent_id: 'wa-1',
          task_key: 'onboarding',
          title: 'Review IP Manager playbook',
          status: 'pending',
          priority: 'medium',
          due: 'Today',
          progress: 0,
        },
      ],
    }

    const employee = toEmployeeWithTasks(agentWithTasks)

    expect(employee.tasks).toHaveLength(1)
    expect(employee.tasks![0].title).toBe('Review IP Manager playbook')
    expect(employee.tasks![0].status).toBe('pending')
  })

  it('handles agent with no tasks', () => {
    const agentNoTasks: WorkspaceAgentWithTasks = { ...mockAgent, tasks: undefined }
    const employee = toEmployeeWithTasks(agentNoTasks)
    expect(employee.tasks).toEqual([])
  })
})
