export type HarHeader = {
  name: string
  value: string
  [key: string]: unknown
}

export type HarCookie = {
  name: string
  value: string
  [key: string]: unknown
}

export type HarQueryParam = {
  name: string
  value: string
  [key: string]: unknown
}

export type HarPostData = {
  mimeType?: string
  text?: string
  params?: Array<{ name: string; value?: string; [key: string]: unknown }>
  [key: string]: unknown
}

export type HarRequest = {
  method: string
  url: string
  httpVersion?: string
  cookies?: HarCookie[]
  headers?: HarHeader[]
  queryString?: HarQueryParam[]
  postData?: HarPostData
  headersSize?: number
  bodySize?: number
  [key: string]: unknown
}

export type HarResponse = {
  status: number
  statusText?: string
  httpVersion?: string
  cookies?: HarCookie[]
  headers?: HarHeader[]
  content?: {
    size?: number
    mimeType?: string
    text?: string
    [key: string]: unknown
  }
  redirectURL?: string
  headersSize?: number
  bodySize?: number
  [key: string]: unknown
}

export type HarEntry = {
  startedDateTime?: string
  time?: number
  request: HarRequest
  response: HarResponse
  cache?: Record<string, unknown>
  timings?: Record<string, number>
  [key: string]: unknown
}

export type HarDocument = {
  log: {
    version?: string
    creator?: Record<string, unknown>
    entries: HarEntry[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type RequestCategory = 'api' | 'asset' | 'preflight' | 'third-party' | 'other'

export type RequestSummaryRow = {
  index: number
  method: string
  status: number
  host: string
  path: string
  url: string
  mimeType: string
  size: number
  time: number
  category: RequestCategory
  isThirdParty: boolean
}

export type HarSummary = {
  total: number
  baseHost: string
  hosts: Array<{ host: string; count: number }>
  rows: RequestSummaryRow[]
}

export type FilterConfig = {
  action: 'keep' | 'drop'
  field: 'url' | 'host' | 'path'
  operator: 'contains' | 'regex'
  value: string
  removeOptions: boolean
  removeStaticAssets: boolean
  removeThirdParty: boolean
  baseHost: string
}

export type FilterResult = {
  har: HarDocument
  keptCount: number
  removedCount: number
  keptIndexes: number[]
  removedIndexes: number[]
  removalReasons: {
    options: number
    staticAssets: number
    thirdParty: number
    rule: number
  }
  error?: string
}
