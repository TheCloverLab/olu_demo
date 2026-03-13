import { describe, it, expect } from 'vitest'
import { parseModelSelection } from '../models.js'

describe('parseModelSelection', () => {
  it('parses provider::model composite string', () => {
    const result = parseModelSelection(undefined, 'openai::gpt-4o')
    expect(result).toEqual({
      providerName: 'openai',
      modelOverride: 'gpt-4o',
    })
  })

  it('prefers explicit provider over embedded provider', () => {
    const result = parseModelSelection('kimi', 'openai::gpt-4o')
    expect(result).toEqual({
      providerName: 'kimi',
      modelOverride: 'gpt-4o',
    })
  })

  it('handles provider::model with extra colons (e.g. URLs)', () => {
    const result = parseModelSelection(undefined, 'custom::my::model')
    expect(result).toEqual({
      providerName: 'custom',
      modelOverride: 'my::model',
    })
  })

  it('returns both when provider and model given separately', () => {
    const result = parseModelSelection('openai', 'gpt-4o')
    expect(result).toEqual({
      providerName: 'openai',
      modelOverride: 'gpt-4o',
    })
  })

  it('returns providerName only when no model', () => {
    const result = parseModelSelection('kimi', undefined)
    expect(result).toEqual({ providerName: 'kimi' })
  })

  it('treats bare model as providerName when no provider given', () => {
    const result = parseModelSelection(undefined, 'gpt-4o')
    expect(result).toEqual({ providerName: 'gpt-4o' })
  })

  it('returns empty object when both undefined', () => {
    const result = parseModelSelection(undefined, undefined)
    expect(result).toEqual({})
  })
})
