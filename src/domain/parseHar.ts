import type { HarDocument } from './har.types'

export type ParseHarResult = { ok: true; har: HarDocument } | { ok: false; error: string }

function isHarDocument(value: unknown): value is HarDocument {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { log?: { entries?: unknown } }
  return Boolean(candidate.log && Array.isArray(candidate.log.entries))
}

function hasValidEntries(har: HarDocument): boolean {
  return har.log.entries.every((entry) => {
    if (!entry || typeof entry !== 'object') {
      return false
    }

    const request = entry.request
    const response = entry.response

    return (
      Boolean(request) &&
      typeof request.url === 'string' &&
      request.url.length > 0 &&
      typeof request.method === 'string' &&
      request.method.length > 0 &&
      Boolean(response) &&
      typeof response.status === 'number'
    )
  })
}

export function parseHar(text: string): ParseHarResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }

  if (!isHarDocument(parsed)) {
    return { ok: false, error: 'This file is not a HAR document with log.entries.' }
  }

  if (!hasValidEntries(parsed)) {
    return {
      ok: false,
      error: 'This HAR has entries without the required request.url, request.method, or response.status fields.',
    }
  }

  return { ok: true, har: parsed }
}
