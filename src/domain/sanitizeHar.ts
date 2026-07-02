import type { HarDocument, HarEntry, HarHeader, HarPostData, HarQueryParam } from './har.types'
import { REDACTED, isSensitiveName, redactJsonValue, redactNamedValue } from './sensitiveData'

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
    value: redactAll ? REDACTED : redactNamedValue(item.name, item.value),
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
    return JSON.stringify(redactJsonValue(JSON.parse(text)))
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
