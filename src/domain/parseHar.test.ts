import { describe, expect, it } from 'vitest'
import { createEntry, createHar } from '../test/harFactory'
import { parseHar } from './parseHar'

describe('parseHar', () => {
  it('parses a valid HAR document and preserves entries', () => {
    const har = createHar([createEntry({ method: 'POST' })])

    const result = parseHar(JSON.stringify(har))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.har.log.entries).toHaveLength(1)
      expect(result.har.log.entries[0].request.method).toBe('POST')
    }
  })

  it('returns a clear error for invalid JSON', () => {
    const result = parseHar('{not json')

    expect(result).toEqual({
      ok: false,
      error: 'The file is not valid JSON.',
    })
  })

  it('returns a clear error when log.entries is missing', () => {
    const result = parseHar(JSON.stringify({ log: { version: '1.2' } }))

    expect(result).toEqual({
      ok: false,
      error: 'This file is not a HAR document with log.entries.',
    })
  })

  it('returns a clear error when an entry is missing required request or response fields', () => {
    const result = parseHar(JSON.stringify({ log: { version: '1.2', entries: [{}] } }))

    expect(result).toEqual({
      ok: false,
      error: 'This HAR has entries without the required request.url, request.method, or response.status fields.',
    })
  })

  it('returns a clear error when an entry is not an object', () => {
    const result = parseHar(JSON.stringify({ log: { version: '1.2', entries: [null] } }))

    expect(result).toEqual({
      ok: false,
      error: 'This HAR has entries without the required request.url, request.method, or response.status fields.',
    })
  })
})
