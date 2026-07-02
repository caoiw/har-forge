import type { HarDocument, HarEntry, HarHeader, HarPostData, HarQueryParam } from './har.types'

const REDACTED = '[REDACTED]'

const SENSITIVE_EXACT_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-csrf-token',
  'access_token',
  'refresh_token',
  'id_token',
  'password',
  'senha',
  'api_key',
  'client_secret',
])

const SENSITIVE_COMPACT_FRAGMENTS = [
  'authorization',
  'cookie',
  'setcookie',
  'csrftoken',
  'token',
  'password',
  'senha',
  'apikey',
  'clientsecret',
]

function isSensitiveName(name: string): boolean {
  const separatorNormalized = name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const compactNormalized = separatorNormalized.replace(/_/g, '')

  return (
    SENSITIVE_EXACT_KEYS.has(separatorNormalized) ||
    SENSITIVE_COMPACT_FRAGMENTS.some((fragment) => compactNormalized.includes(fragment))
  )
}

function cloneHar(har: HarDocument): HarDocument {
  return JSON.parse(JSON.stringify(har)) as HarDocument
}

function sanitizeHeaders(headers: HarHeader[] | undefined): HarHeader[] | undefined {
  return headers?.map((header) => ({
    ...header,
    value: isSensitiveName(header.name) ? REDACTED : header.value,
  }))
}

function sanitizeNamedValues<T extends { name: string; value?: string }>(items: T[] | undefined, redactAll = false): T[] | undefined {
  return items?.map((item) => ({
    ...item,
    value: redactAll || isSensitiveName(item.name) ? REDACTED : item.value,
  }))
}

function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.username) {
      parsedUrl.username = REDACTED
    }
    if (parsedUrl.password) {
      parsedUrl.password = REDACTED
    }
    parsedUrl.searchParams.forEach((_value, key) => {
      if (isSensitiveName(key)) {
        parsedUrl.searchParams.set(key, REDACTED)
      }
    })
    return parsedUrl.toString()
  } catch {
    return url
  }
}

function sanitizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      isSensitiveName(key) ? REDACTED : sanitizeJsonValue(nestedValue),
    ]),
  )
}

function sanitizeText(text: string | undefined, mimeType?: string): string | undefined {
  if (!text) {
    return text
  }

  const normalizedMimeType = mimeType?.toLowerCase() ?? ''

  if (normalizedMimeType.includes('x-www-form-urlencoded')) {
    return sanitizeUrlEncodedText(text)
  }

  if (!normalizedMimeType.includes('json')) {
    return text
  }

  try {
    return JSON.stringify(sanitizeJsonValue(JSON.parse(text)))
  } catch {
    return text
  }
}

function sanitizeUrlEncodedText(text: string): string {
  const params = new URLSearchParams(text)
  let changed = false

  params.forEach((_value, key) => {
    if (isSensitiveName(key)) {
      params.set(key, REDACTED)
      changed = true
    }
  })

  return changed ? params.toString() : text
}

function sanitizePostData(postData: HarPostData | undefined): HarPostData | undefined {
  if (!postData) {
    return postData
  }

  return {
    ...postData,
    text: sanitizeText(postData.text, postData.mimeType),
    params: sanitizeNamedValues(postData.params),
  }
}

function sanitizeQueryString(queryString: HarQueryParam[] | undefined): HarQueryParam[] | undefined {
  return sanitizeNamedValues(queryString)
}

function sanitizeEntry(entry: HarEntry): HarEntry {
  return {
    ...entry,
    request: {
      ...entry.request,
      url: sanitizeUrl(entry.request.url),
      headers: sanitizeHeaders(entry.request.headers),
      cookies: sanitizeNamedValues(entry.request.cookies, true),
      queryString: sanitizeQueryString(entry.request.queryString),
      postData: sanitizePostData(entry.request.postData),
    },
    response: {
      ...entry.response,
      headers: sanitizeHeaders(entry.response.headers),
      cookies: sanitizeNamedValues(entry.response.cookies, true),
      content: entry.response.content
        ? {
            ...entry.response.content,
            text: sanitizeText(entry.response.content.text, entry.response.content.mimeType),
          }
        : entry.response.content,
    },
  }
}

export function sanitizeHar(har: HarDocument): HarDocument {
  const cleanHar = cloneHar(har)

  return {
    ...cleanHar,
    log: {
      ...cleanHar.log,
      entries: cleanHar.log.entries.map(sanitizeEntry),
    },
  }
}
