import type { HarDocument, HarEntry } from '../domain/har.types'

type EntryOverrides = {
  url?: string
  method?: string
  status?: number
  mimeType?: string
  size?: number
  time?: number
  requestHeaders?: Array<{ name: string; value: string }>
  responseHeaders?: Array<{ name: string; value: string }>
  cookies?: Array<{ name: string; value: string }>
  postData?: Record<string, unknown>
}

export function createEntry(overrides: EntryOverrides = {}): HarEntry {
  const url = overrides.url ?? 'https://api.example.test/api/transferencias/123'
  const mimeType = overrides.mimeType ?? 'application/json'
  const size = overrides.size ?? 512

  return {
    startedDateTime: '2026-07-02T12:00:00.000Z',
    time: overrides.time ?? 120,
    request: {
      method: overrides.method ?? 'GET',
      url,
      httpVersion: 'HTTP/2',
      cookies: overrides.cookies ?? [],
      headers: overrides.requestHeaders ?? [],
      queryString: [],
      headersSize: -1,
      bodySize: overrides.postData ? JSON.stringify(overrides.postData).length : 0,
      ...(overrides.postData
        ? {
            postData: {
              mimeType: 'application/json',
              text: JSON.stringify(overrides.postData),
            },
          }
        : {}),
    },
    response: {
      status: overrides.status ?? 200,
      statusText: 'OK',
      httpVersion: 'HTTP/2',
      cookies: [],
      headers: overrides.responseHeaders ?? [{ name: 'content-type', value: mimeType }],
      content: {
        size,
        mimeType,
        text: '{"ok":true}',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: size,
    },
    cache: {},
    timings: {
      blocked: 0,
      dns: 0,
      connect: 0,
      send: 1,
      wait: overrides.time ?? 120,
      receive: 1,
      ssl: 0,
    },
  }
}

export function createHar(entries: HarEntry[] = [createEntry()]): HarDocument {
  return {
    log: {
      version: '1.2',
      creator: { name: 'HAR Forge Test', version: '0.1.0' },
      entries,
    },
  }
}
