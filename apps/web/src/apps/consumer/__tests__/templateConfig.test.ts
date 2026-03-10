import { describe, it, expect } from 'vitest'
import {
  getTemplateDefinition,
  isValidTemplateKey,
  getTemplateKeys,
  getAppTypeForTemplate,
  getTemplateKeyForAppType,
  DEFAULT_TEMPLATE,
  CONSUMER_TEMPLATE_META,
  CONSUMER_NAV,
  TEMPLATE_QUICK_LINKS,
} from '../templateConfig'

describe('templateConfig registry', () => {
  it('exports at least two template keys', () => {
    const keys = getTemplateKeys()
    expect(keys.length).toBeGreaterThanOrEqual(2)
    expect(keys).toContain('fan_community')
    expect(keys).toContain('sell_courses')
  })

  it('validates known template keys', () => {
    expect(isValidTemplateKey('fan_community')).toBe(true)
    expect(isValidTemplateKey('sell_courses')).toBe(true)
    expect(isValidTemplateKey('nonexistent')).toBe(false)
  })

  it('returns a definition for each key', () => {
    for (const key of getTemplateKeys()) {
      const def = getTemplateDefinition(key)
      expect(def.label).toBeTruthy()
      expect(def.appType).toBeTruthy()
      expect(def.nav.length).toBeGreaterThan(0)
      expect(def.quickLinks.length).toBeGreaterThan(0)
      expect(def.profile.ctaLabel).toBeTruthy()
      expect(def.profile.ctaHref).toBeTruthy()
    }
  })

  it('maps app types to templates and back', () => {
    expect(getAppTypeForTemplate('fan_community')).toBe('community')
    expect(getAppTypeForTemplate('sell_courses')).toBe('academy')
    expect(getTemplateKeyForAppType('community')).toBe('fan_community')
    expect(getTemplateKeyForAppType('academy')).toBe('sell_courses')
  })

  it('has a valid default template', () => {
    expect(isValidTemplateKey(DEFAULT_TEMPLATE)).toBe(true)
  })

  it('backward-compat exports match registry', () => {
    for (const key of getTemplateKeys()) {
      const def = getTemplateDefinition(key)
      expect(CONSUMER_TEMPLATE_META[key].label).toBe(def.label)
      expect(CONSUMER_NAV[key]).toEqual(def.nav)
      expect(TEMPLATE_QUICK_LINKS[key]).toEqual(def.quickLinks)
    }
  })

  it('profile browse description includes viewer name', () => {
    const def = getTemplateDefinition('fan_community')
    expect(def.profile.browseDescription('Alice')).toContain('Alice')
  })
})
