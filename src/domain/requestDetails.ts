import type { HarEntry, HarPostData, RequestDetailParam, RequestDetails } from './har.types'
import { REDACTED, redactJsonValue, redactNamedValue } from './sensitiveData'

function formatMaybeJson(value: string): string {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value
  }

  try {
    return JSON.stringify(redactJsonValue(JSON.parse(trimmed)), null, 2)
  } catch {
    return value
  }
}

function formatNamedValue(name: string, value: string | undefined): string {
  const redacted = redactNamedValue(name, value ?? '')
  if (redacted === REDACTED) {
    return REDACTED
  }

  return formatMaybeJson(redacted ?? '')
}

function getQueryParamsFromUrl(url: string): RequestDetailParam[] {
  try {
    const parsed = new URL(url)
    return [...parsed.searchParams.entries()].map(([name, value]) => ({
      name,
      value: formatNamedValue(name, value),
    }))
  } catch {
    return []
  }
}

function getQueryParams(entry: HarEntry): RequestDetailParam[] {
  const queryString = entry.request.queryString

  if (!queryString?.length) {
    return getQueryParamsFromUrl(entry.request.url)
  }

  return queryString.map((param) => ({
    name: param.name,
    value: formatNamedValue(param.name, param.value),
  }))
}

function formatUrlEncodedText(text: string): string {
  const params = new URLSearchParams(text)
  const entries = [...params.entries()]

  if (entries.length === 0) {
    return text
  }

  return entries.map(([name, value]) => `${name}=${formatNamedValue(name, value)}`).join('&')
}

function formatPostDataText(postData: HarPostData): string | undefined {
  if (!postData.text) {
    return undefined
  }

  const mimeType = postData.mimeType?.toLowerCase() ?? ''
  if (mimeType.includes('x-www-form-urlencoded')) {
    return formatUrlEncodedText(postData.text)
  }

  return formatMaybeJson(postData.text)
}

function getBodyDetails(postData: HarPostData | undefined): RequestDetails['body'] {
  if (!postData) {
    return undefined
  }

  const params =
    postData.params?.map((param) => ({
      name: param.name,
      value: formatNamedValue(param.name, param.value),
    })) ?? []
  const text = formatPostDataText(postData)

  if (params.length === 0 && !text && !postData.mimeType) {
    return undefined
  }

  return {
    mimeType: postData.mimeType ?? '',
    params,
    text,
  }
}

export function getRequestDetails(entry: HarEntry): RequestDetails {
  return {
    queryParams: getQueryParams(entry),
    body: getBodyDetails(entry.request.postData),
  }
}
