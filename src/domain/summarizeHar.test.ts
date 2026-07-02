import { describe, expect, it } from 'vitest'
import { createEntry, createHar } from '../test/harFactory'
import { summarizeHar } from './summarizeHar'

describe('summarizeHar', () => {
  it('summarizes method, status, host, path, mime type, size, time, and category', () => {
    const har = createHar([
      createEntry({
        method: 'POST',
        status: 201,
        url: 'https://api.example.test/api/transferencias?token=abc',
        mimeType: 'application/json',
        size: 1024,
        time: 245,
      }),
    ])

    const summary = summarizeHar(har)

    expect(summary.total).toBe(1)
    expect(summary.baseHost).toBe('api.example.test')
    expect(summary.rows[0]).toMatchObject({
      index: 0,
      method: 'POST',
      status: 201,
      host: 'api.example.test',
      path: '/api/transferencias',
      mimeType: 'application/json',
      size: 1024,
      time: 245,
      category: 'api',
      isThirdParty: false,
    })
  })

  it('classifies OPTIONS, static assets, and third-party entries', () => {
    const har = createHar([
      createEntry({ url: 'https://app.example.test/api/users', method: 'GET' }),
      createEntry({ url: 'https://app.example.test/api/users', method: 'OPTIONS' }),
      createEntry({ url: 'https://app.example.test/assets/app.js', mimeType: 'application/javascript' }),
      createEntry({ url: 'https://analytics.example.test/collect', mimeType: 'text/plain' }),
    ])

    const summary = summarizeHar(har)

    expect(summary.baseHost).toBe('app.example.test')
    expect(summary.rows.map((row) => row.category)).toEqual(['api', 'preflight', 'asset', 'third-party'])
    expect(summary.rows[3].isThirdParty).toBe(true)
  })
})
