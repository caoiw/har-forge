import { describe, expect, it } from 'vitest'
import { createEntry, createHar } from '../test/harFactory'
import { sanitizeHar } from './sanitizeHar'

describe('sanitizeHar', () => {
  it('redacts sensitive headers, cookies, query params, and JSON body values without mutating the original HAR', () => {
    const har = createHar([
      {
        ...createEntry({
          url: 'https://api.example.test/api/login?access_token=abc&safe=value',
          requestHeaders: [
            { name: 'Authorization', value: 'Bearer secret' },
            { name: 'Accept', value: 'application/json' },
          ],
          responseHeaders: [{ name: 'Set-Cookie', value: 'session=secret' }],
          cookies: [{ name: 'session_token', value: 'secret' }],
          postData: {
            username: 'qa',
            password: 'secret',
            nested: { client_secret: 'secret' },
          },
        }),
        request: {
          ...createEntry().request,
          method: 'POST',
          url: 'https://api.example.test/api/login?access_token=abc&safe=value',
          cookies: [{ name: 'session_token', value: 'secret' }],
          headers: [
            { name: 'Authorization', value: 'Bearer secret' },
            { name: 'Accept', value: 'application/json' },
          ],
          queryString: [
            { name: 'access_token', value: 'abc' },
            { name: 'safe', value: 'value' },
          ],
          postData: {
            mimeType: 'application/json',
            text: JSON.stringify({
              username: 'qa',
              password: 'secret',
              nested: { client_secret: 'secret' },
            }),
          },
          headersSize: -1,
          bodySize: 72,
        },
      },
    ])

    const clean = sanitizeHar(har)
    const request = clean.log.entries[0].request

    expect(request.url).toBe('https://api.example.test/api/login?access_token=%5BREDACTED%5D&safe=value')
    expect(request.headers).toContainEqual({ name: 'Authorization', value: '[REDACTED]' })
    expect(request.headers).toContainEqual({ name: 'Accept', value: 'application/json' })
    expect(request.cookies).toContainEqual({ name: 'session_token', value: '[REDACTED]' })
    expect(request.queryString).toContainEqual({ name: 'access_token', value: '[REDACTED]' })
    expect(request.queryString).toContainEqual({ name: 'safe', value: 'value' })
    expect(JSON.parse(request.postData?.text ?? '{}')).toEqual({
      username: 'qa',
      password: '[REDACTED]',
      nested: { client_secret: '[REDACTED]' },
    })
    expect(clean.log.entries[0].response.headers).toContainEqual({ name: 'Set-Cookie', value: '[REDACTED]' })
    expect(har.log.entries[0].request.headers[0].value).toBe('Bearer secret')
  })

  it('redacts common secret name variants in headers, query params, and JSON bodies', () => {
    const har = createHar([
      {
        ...createEntry({
          url: 'https://api.example.test/api/keys?api-key=abc&clientSecret=def&safe=value',
          requestHeaders: [
            { name: 'X-Api-Key', value: 'abc' },
            { name: 'clientSecret', value: 'def' },
          ],
        }),
        request: {
          ...createEntry().request,
          url: 'https://api.example.test/api/keys?api-key=abc&clientSecret=def&safe=value',
          headers: [
            { name: 'X-Api-Key', value: 'abc' },
            { name: 'clientSecret', value: 'def' },
          ],
          queryString: [
            { name: 'api-key', value: 'abc' },
            { name: 'clientSecret', value: 'def' },
            { name: 'safe', value: 'value' },
          ],
          postData: {
            mimeType: 'application/json',
            text: JSON.stringify({
              apiKey: 'abc',
              clientSecret: 'def',
              nested: { csrfToken: 'ghi' },
              safe: 'value',
            }),
          },
        },
      },
    ])

    const request = sanitizeHar(har).log.entries[0].request

    expect(request.headers).toContainEqual({ name: 'X-Api-Key', value: '[REDACTED]' })
    expect(request.headers).toContainEqual({ name: 'clientSecret', value: '[REDACTED]' })
    expect(request.queryString).toContainEqual({ name: 'api-key', value: '[REDACTED]' })
    expect(request.queryString).toContainEqual({ name: 'clientSecret', value: '[REDACTED]' })
    expect(request.queryString).toContainEqual({ name: 'safe', value: 'value' })
    expect(request.url).toBe(
      'https://api.example.test/api/keys?api-key=%5BREDACTED%5D&clientSecret=%5BREDACTED%5D&safe=value',
    )
    expect(JSON.parse(request.postData?.text ?? '{}')).toEqual({
      apiKey: '[REDACTED]',
      clientSecret: '[REDACTED]',
      nested: { csrfToken: '[REDACTED]' },
      safe: 'value',
    })
  })

  it('redacts sensitive values from URL-encoded postData text', () => {
    const har = createHar([
      {
        ...createEntry(),
        request: {
          ...createEntry().request,
          method: 'POST',
          url: 'https://api.example.test/login',
          postData: {
            mimeType: 'application/x-www-form-urlencoded',
            text: 'username=qa&password=secret&client_secret=hidden&remember=true',
          },
        },
      },
    ])

    const request = sanitizeHar(har).log.entries[0].request

    expect(request.postData?.text).toBe('username=qa&password=%5BREDACTED%5D&client_secret=%5BREDACTED%5D&remember=true')
  })

  it('redacts credentials embedded in request URLs', () => {
    const har = createHar([
      createEntry({
        url: 'https://qa-user:secret@example.test/api/transferencias?safe=value',
      }),
    ])

    const request = sanitizeHar(har).log.entries[0].request

    expect(request.url).toBe('https://%5BREDACTED%5D:%5BREDACTED%5D@example.test/api/transferencias?safe=value')
  })
})
