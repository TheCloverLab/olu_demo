import { describe, it, expect } from 'vitest'
import { SKILL_DEFINITIONS, ALL_SKILL_NAMES, listSkills } from '../lib/skill-registry.js'

describe('Skill Registry', () => {
  it('defines all expected skill packs', () => {
    expect(ALL_SKILL_NAMES).toContain('workspace-core')
    expect(ALL_SKILL_NAMES).toContain('web')
    expect(ALL_SKILL_NAMES).toContain('content')
    expect(ALL_SKILL_NAMES).toContain('lark-suite')
    expect(ALL_SKILL_NAMES).toContain('memory')
    expect(ALL_SKILL_NAMES).toContain('marketing')
    expect(ALL_SKILL_NAMES).toContain('automation')
    expect(ALL_SKILL_NAMES.length).toBe(10)
  })

  it('each skill has name, description, and tools', () => {
    for (const [id, skill] of Object.entries(SKILL_DEFINITIONS)) {
      expect(skill.name).toBeTruthy()
      expect(skill.description).toBeTruthy()
      expect(skill.tools.length).toBeGreaterThan(0)
    }
  })

  it('workspace-core has the right tools', () => {
    const core = SKILL_DEFINITIONS['workspace-core']
    const toolNames = core.tools.map(t => t.name)
    expect(toolNames).toContain('list_my_tasks')
    expect(toolNames).toContain('update_task_status')
    expect(toolNames).toContain('create_task')
    expect(toolNames).toContain('get_team_overview')
    expect(toolNames).toContain('post_conversation')
  })

  it('lark-suite has tasks, calendar, and bitable tools', () => {
    const lark = SKILL_DEFINITIONS['lark-suite']
    const toolNames = lark.tools.map(t => t.name)
    expect(toolNames).toContain('lark_tasks')
    expect(toolNames).toContain('lark_calendar')
    expect(toolNames).toContain('lark_bitable')
  })

  it('no duplicate tools across skills', () => {
    const allToolNames: string[] = []
    for (const skill of Object.values(SKILL_DEFINITIONS)) {
      for (const tool of skill.tools) {
        allToolNames.push(tool.name)
      }
    }
    const unique = new Set(allToolNames)
    expect(unique.size).toBe(allToolNames.length)
  })

  it('listSkills returns correct format', () => {
    const skills = listSkills()
    expect(skills.length).toBe(10)
    for (const skill of skills) {
      expect(skill).toHaveProperty('id')
      expect(skill).toHaveProperty('name')
      expect(skill).toHaveProperty('description')
      expect(skill).toHaveProperty('toolCount')
      expect(skill.toolCount).toBeGreaterThan(0)
    }
  })

  it('total tool count matches allTools', () => {
    let totalTools = 0
    for (const skill of Object.values(SKILL_DEFINITIONS)) {
      totalTools += skill.tools.length
    }
    expect(totalTools).toBe(23)
  })
})
