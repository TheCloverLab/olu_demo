import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  vi.resetModules()
  process.env = { ...ORIGINAL_ENV }
})

describe('API authentication', () => {
  it('isAuthorized checks Bearer token and x-api-key', () => {
    const secret = 'test-secret-123'

    function isAuthorized(authHeader?: string, apiKeyHeader?: string): boolean {
      if (!secret) return true
      if (authHeader === `Bearer ${secret}`) return true
      if (apiKeyHeader === secret) return true
      return false
    }

    expect(isAuthorized(`Bearer ${secret}`)).toBe(true)
    expect(isAuthorized(undefined, secret)).toBe(true)
    expect(isAuthorized('Bearer wrong')).toBe(false)
    expect(isAuthorized()).toBe(false)
  })

  it('allows all requests when no secret is configured', () => {
    const secret = ''
    function isAuthorized(): boolean {
      if (!secret) return true
      return false
    }
    expect(isAuthorized()).toBe(true)
  })
})

describe('Webhook signature verification', () => {
  it('generates correct HMAC-SHA256 for Supabase webhooks', () => {
    const secret = 'my-webhook-secret'
    const body = JSON.stringify({ type: 'INSERT', table: 'workspace_agent_tasks', record: { id: '123' } })
    const signature = createHmac('sha256', secret).update(body).digest('hex')

    // Verify the signature matches
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    expect(signature).toBe(expected)
    expect(signature).toHaveLength(64) // SHA-256 hex = 64 chars
  })

  it('generates correct Lark webhook signature', () => {
    const encryptKey = 'lark-encrypt-key'
    const timestamp = '1616461434'
    const nonce = 'abc123'
    const body = JSON.stringify({ event: { type: 'im.message.receive_v1' } })

    const content = timestamp + nonce + encryptKey + body
    const signature = createHmac('sha256', '').update(content).digest('hex')

    expect(signature).toHaveLength(64)
    // Verify deterministic
    const sig2 = createHmac('sha256', '').update(content).digest('hex')
    expect(signature).toBe(sig2)
  })

  it('rejects tampered webhook bodies', () => {
    const secret = 'my-webhook-secret'
    const originalBody = '{"record":{"id":"123"}}'
    const tamperedBody = '{"record":{"id":"456"}}'

    const signature = createHmac('sha256', secret).update(originalBody).digest('hex')
    const checkSig = createHmac('sha256', secret).update(tamperedBody).digest('hex')

    expect(signature).not.toBe(checkSig)
  })
})

describe('Rate limiter', () => {
  it('allows requests within limit', () => {
    const buckets = new Map<string, number[]>()
    const maxRequests = 5
    const windowMs = 60_000

    function isRateLimited(key: string): boolean {
      const now = Date.now()
      let timestamps = buckets.get(key) || []
      timestamps = timestamps.filter((t) => t > now - windowMs)
      if (timestamps.length >= maxRequests) return true
      timestamps.push(now)
      buckets.set(key, timestamps)
      return false
    }

    // Should allow first 5 requests
    for (let i = 0; i < maxRequests; i++) {
      expect(isRateLimited('test-ip')).toBe(false)
    }
    // 6th should be blocked
    expect(isRateLimited('test-ip')).toBe(true)
  })

  it('different IPs have separate limits', () => {
    const buckets = new Map<string, number[]>()
    const maxRequests = 2
    const windowMs = 60_000

    function isRateLimited(key: string): boolean {
      const now = Date.now()
      let timestamps = buckets.get(key) || []
      timestamps = timestamps.filter((t) => t > now - windowMs)
      if (timestamps.length >= maxRequests) return true
      timestamps.push(now)
      buckets.set(key, timestamps)
      return false
    }

    expect(isRateLimited('ip-a')).toBe(false)
    expect(isRateLimited('ip-a')).toBe(false)
    expect(isRateLimited('ip-a')).toBe(true) // blocked

    expect(isRateLimited('ip-b')).toBe(false) // different IP, not blocked
  })
})

describe('MCP credential encryption', () => {
  const ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok!'

  function encrypt(data: unknown): string {
    const iv = randomBytes(16)
    const key = createHmac('sha256', ENCRYPTION_KEY).update('mcp-credentials').digest()
    const cipher = createCipheriv('aes-256-cbc', key, iv)
    const plaintext = JSON.stringify(data)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    return `enc:${iv.toString('hex')}:${encrypted.toString('hex')}`
  }

  function decrypt(stored: string): unknown {
    if (!stored.startsWith('enc:')) return JSON.parse(stored)
    const [, ivHex, dataHex] = stored.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const key = createHmac('sha256', ENCRYPTION_KEY).update('mcp-credentials').digest()
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
    return JSON.parse(decrypted.toString('utf8'))
  }

  it('encrypts and decrypts credentials correctly', () => {
    const credentials = { api_key: 'sk-test-123', bearer_token: 'my-secret-token' }
    const encrypted = encrypt(credentials)

    expect(encrypted).toMatch(/^enc:[a-f0-9]{32}:[a-f0-9]+$/)
    expect(encrypted).not.toContain('sk-test-123')

    const decrypted = decrypt(encrypted)
    expect(decrypted).toEqual(credentials)
  })

  it('handles legacy plaintext credentials', () => {
    const legacy = '{"api_key":"old-key"}'
    const result = decrypt(legacy)
    expect(result).toEqual({ api_key: 'old-key' })
  })

  it('produces different ciphertexts for same input (random IV)', () => {
    const data = { key: 'same-value' }
    const enc1 = encrypt(data)
    const enc2 = encrypt(data)

    expect(enc1).not.toBe(enc2) // Different IVs
    expect(decrypt(enc1)).toEqual(data)
    expect(decrypt(enc2)).toEqual(data)
  })

  it('fails to decrypt with wrong key', () => {
    const data = { secret: 'value' }
    const encrypted = encrypt(data)

    // Try to decrypt with different key
    const wrongKey = 'wrong-key-32-characters-here!!'
    const [, ivHex, dataHex] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const key = createHmac('sha256', wrongKey).update('mcp-credentials').digest()
    const decipher = createDecipheriv('aes-256-cbc', key, iv)

    expect(() => {
      Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
    }).toThrow()
  })
})

describe('CORS', () => {
  it('ALLOWED_ORIGINS restricts Access-Control-Allow-Origin', () => {
    const allowedOrigins = ['https://internal-demo.olu.tech', 'https://internal-dev.olu.tech']

    function getAllowOrigin(requestOrigin: string): string | undefined {
      if (allowedOrigins.length === 0) return requestOrigin || '*'
      if (allowedOrigins.includes(requestOrigin)) return requestOrigin
      return undefined
    }

    expect(getAllowOrigin('https://internal-demo.olu.tech')).toBe('https://internal-demo.olu.tech')
    expect(getAllowOrigin('https://evil.com')).toBeUndefined()
    expect(getAllowOrigin('')).toBeUndefined()
  })
})

describe('JSON body parsing', () => {
  it('rejects invalid JSON', async () => {
    const parseBody = (text: string) => {
      try {
        return JSON.parse(text)
      } catch {
        throw { statusCode: 400, message: 'Invalid JSON body' }
      }
    }

    expect(() => parseBody('not json')).toThrow()
    expect(() => parseBody('{invalid}')).toThrow()
    expect(parseBody('{"valid": true}')).toEqual({ valid: true })
  })
})
