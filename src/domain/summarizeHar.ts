import type { HarDocument, HarEntry, HarSummary, RequestCategory } from './har.types'
import { getRequestDetails } from './requestDetails'

const STATIC_MIME_TYPES = new Set([
  'application/javascript',
  'application/x-javascript',
  'font/otf',
  'font/ttf',
  'font/woff',
  'font/woff2',
  'image/x-icon',
  'text/css',
  'text/javascript',
])

const STATIC_EXTENSIONS = [
  '.avif',
  '.css',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.map',
  '.mjs',
  '.mp3',
  '.mp4',
  '.otf',
  '.png',
  '.svg',
  '.ttf',
  '.wav',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
]

export function parseEntryUrl(url: string): URL | undefined {
  try {
    return new URL(url)
  } catch {
    return undefined
  }
}

export function getMimeType(entry: HarEntry): string {
  const contentMimeType = entry.response.content?.mimeType
  if (contentMimeType) {
    return contentMimeType.split(';')[0].trim().toLowerCase()
  }

  const contentTypeHeader = entry.response.headers?.find((header) => header.name.toLowerCase() === 'content-type')
  return contentTypeHeader?.value.split(';')[0].trim().toLowerCase() ?? ''
}

export function isStaticAsset(entry: HarEntry): boolean {
  const mimeType = getMimeType(entry)
  if (STATIC_MIME_TYPES.has(mimeType)) {
    return true
  }

  if (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('font/') ||
    mimeType.startsWith('audio/') ||
    mimeType.startsWith('video/')
  ) {
    return true
  }

  const parsedUrl = parseEntryUrl(entry.request.url)
  const pathname = parsedUrl?.pathname.toLowerCase() ?? entry.request.url.toLowerCase()
  return STATIC_EXTENSIONS.some((extension) => pathname.endsWith(extension))
}

export function getEntryHost(entry: HarEntry): string {
  return parseEntryUrl(entry.request.url)?.host ?? ''
}

export function getEntryPath(entry: HarEntry): string {
  return parseEntryUrl(entry.request.url)?.pathname ?? entry.request.url
}

function getResponseSize(entry: HarEntry): number {
  return entry.response.content?.size ?? entry.response.bodySize ?? entry.request.bodySize ?? 0
}

function getSortedHosts(entries: HarEntry[]): Array<{ host: string; count: number; firstIndex: number }> {
  const counts = new Map<string, { host: string; count: number; firstIndex: number }>()

  entries.forEach((entry, index) => {
    const host = getEntryHost(entry)
    if (!host) {
      return
    }

    const current = counts.get(host)
    if (current) {
      current.count += 1
      return
    }

    counts.set(host, { host, count: 1, firstIndex: index })
  })

  return [...counts.values()].sort((left, right) => right.count - left.count || left.firstIndex - right.firstIndex)
}

export function classifyEntry(entry: HarEntry, baseHost: string): RequestCategory {
  const method = entry.request.method.toUpperCase()
  const host = getEntryHost(entry)
  const path = getEntryPath(entry)
  const mimeType = getMimeType(entry)

  if (method === 'OPTIONS') {
    return 'preflight'
  }

  if (baseHost && host && host !== baseHost) {
    return 'third-party'
  }

  if (isStaticAsset(entry)) {
    return 'asset'
  }

  if (path.startsWith('/api/') || path === '/api' || mimeType.includes('json')) {
    return 'api'
  }

  return 'other'
}

export function summarizeHar(har: HarDocument, preferredBaseHost?: string): HarSummary {
  const sortedHosts = getSortedHosts(har.log.entries)
  const baseHost = preferredBaseHost ?? sortedHosts[0]?.host ?? ''

  const rows = har.log.entries.map((entry, index) => {
    const host = getEntryHost(entry)
    const category = classifyEntry(entry, baseHost)

    return {
      index,
      method: entry.request.method.toUpperCase(),
      status: entry.response.status,
      host,
      path: getEntryPath(entry),
      url: entry.request.url,
      mimeType: getMimeType(entry),
      size: getResponseSize(entry),
      time: entry.time ?? 0,
      category,
      isThirdParty: Boolean(baseHost && host && host !== baseHost),
      requestDetails: getRequestDetails(entry),
    }
  })

  return {
    total: har.log.entries.length,
    baseHost,
    hosts: sortedHosts.map(({ host, count }) => ({ host, count })),
    rows,
  }
}
