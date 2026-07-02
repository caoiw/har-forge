export const REDACTED = '[REDACTED]'

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

const FILTER_OPERATORS = new Set(['=', '<>', '>', '>=', '<', '<=', 'contains', 'notcontains', 'startswith', 'endswith'])

export function isSensitiveName(name: string): boolean {
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

export function redactNamedValue(name: string, value: string | undefined): string | undefined {
  return isSensitiveName(name) ? REDACTED : value
}

function isFilterCondition(value: unknown[]): value is [string, string, ...unknown[]] {
  return typeof value[0] === 'string' && typeof value[1] === 'string' && FILTER_OPERATORS.has(value[1].toLowerCase())
}

export function redactJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (isFilterCondition(value) && isSensitiveName(value[0])) {
      return value.map((item, index) => (index >= 2 ? REDACTED : item))
    }

    return value.map((item) => redactJsonValue(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      isSensitiveName(key) ? REDACTED : redactJsonValue(nestedValue),
    ]),
  )
}
