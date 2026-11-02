import { describe, expect, it } from 'vitest'
import { signFamulorBody, verifyFamulorSignature } from './signature'

describe('verifyFamulorSignature', () => {
  const secret = 'supersecretvalue1'
  const body = '{"event":"call.completed"}'

  it('accepts an HMAC-SHA256 hex digest prefixed with sha256=', () => {
    const header = signFamulorBody(body, secret)
    expect(header.startsWith('sha256=')).toBe(true)
    expect(verifyFamulorSignature(body, header, secret)).toBe(true)
  })

  it('rejects a missing, truncated, or mismatched signature', () => {
    expect(verifyFamulorSignature(body, undefined, secret)).toBe(false)
    expect(verifyFamulorSignature(body, 'sha256=abcd', secret)).toBe(false)
    expect(verifyFamulorSignature(body, signFamulorBody(body, 'another-secret-value'), secret)).toBe(false)
    expect(verifyFamulorSignature(`${body} `, signFamulorBody(body, secret), secret)).toBe(false)
  })
})
