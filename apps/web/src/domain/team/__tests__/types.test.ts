import { describe, it, expect } from 'vitest'
import { isAIEmployee, isHumanEmployee } from '../types'
import type { Employee } from '../types'

const baseEmployee: Employee = {
  id: 'emp-1',
  workspace_id: 'ws-1',
  kind: 'ai',
  name: 'Lisa',
  position: 'IP Manager',
  description: null,
  avatar_img: null,
  color: null,
  status: 'online',
  employment_status: 'active',
  template_id: 'tpl-1',
  agent_key: 'ip_manager',
  model_tier: 'gpt-4',
  user_id: null,
  email: null,
  hired_by_user_id: 'user-1',
  hired_at: '2024-01-01',
  skills: ['ip-licensing', 'contract-review'],
  salary_label: '$0.03/1K tokens',
  last_message: null,
  last_time: null,
  created_at: null,
  updated_at: null,
}

describe('Employee type helpers', () => {
  it('identifies AI employees', () => {
    expect(isAIEmployee(baseEmployee)).toBe(true)
    expect(isHumanEmployee(baseEmployee)).toBe(false)
  })

  it('identifies human employees', () => {
    const human: Employee = {
      ...baseEmployee,
      kind: 'human',
      template_id: null,
      agent_key: null,
      model_tier: null,
      user_id: 'user-2',
      email: 'bob@example.com',
    }
    expect(isHumanEmployee(human)).toBe(true)
    expect(isAIEmployee(human)).toBe(false)
  })
})
