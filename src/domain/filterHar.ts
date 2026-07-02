import type { FilterConfig, FilterResult, HarDocument } from './har.types'
import { getEntryHost, getEntryPath, isStaticAsset } from './summarizeHar'

function getFieldValue(entryUrl: string, field: FilterConfig['field']): string {
  if (field === 'url') {
    return entryUrl
  }

  try {
    const parsedUrl = new URL(entryUrl)
    return field === 'host' ? parsedUrl.host : parsedUrl.pathname
  } catch {
    return entryUrl
  }
}

function createMatcher(config: FilterConfig): ((entryUrl: string) => boolean) | undefined {
  const value = config.value.trim()

  if (!value) {
    return undefined
  }

  if (config.operator === 'contains') {
    const needle = value.toLowerCase()
    return (entryUrl) => getFieldValue(entryUrl, config.field).toLowerCase().includes(needle)
  }

  const regex = new RegExp(value, 'i')
  return (entryUrl) => regex.test(getFieldValue(entryUrl, config.field))
}

export function filterHar(har: HarDocument, config: FilterConfig): FilterResult {
  let matcher: ((entryUrl: string) => boolean) | undefined

  try {
    matcher = createMatcher(config)
  } catch {
    return {
      har,
      keptCount: har.log.entries.length,
      removedCount: 0,
      keptIndexes: har.log.entries.map((_entry, index) => index),
      removedIndexes: [],
      removalReasons: {
        options: 0,
        staticAssets: 0,
        thirdParty: 0,
        rule: 0,
      },
      error: 'Invalid regular expression.',
    }
  }

  const keptIndexes: number[] = []
  const removedIndexes: number[] = []
  const removalReasons = {
    options: 0,
    staticAssets: 0,
    thirdParty: 0,
    rule: 0,
  }

  const entries = har.log.entries.filter((entry, index) => {
    const isOptions = entry.request.method.toUpperCase() === 'OPTIONS'
    const isThirdParty = Boolean(config.baseHost && getEntryHost(entry) && getEntryHost(entry) !== config.baseHost)
    const isAsset = isStaticAsset(entry)
    const matchesRule = matcher?.(entry.request.url) ?? false

    let removalReason: keyof typeof removalReasons | undefined

    if (config.removeOptions && isOptions) {
      removalReason = 'options'
    } else if (config.removeThirdParty && isThirdParty) {
      removalReason = 'thirdParty'
    } else if (config.removeStaticAssets && isAsset) {
      removalReason = 'staticAssets'
    } else if (matcher && config.action === 'keep' && !matchesRule) {
      removalReason = 'rule'
    } else if (matcher && config.action === 'drop' && matchesRule) {
      removalReason = 'rule'
    }

    if (removalReason) {
      removalReasons[removalReason] += 1
      removedIndexes.push(index)
      return false
    }

    keptIndexes.push(index)
    return true
  })

  return {
    har: {
      ...har,
      log: {
        ...har.log,
        entries,
      },
    },
    keptCount: entries.length,
    removedCount: har.log.entries.length - entries.length,
    keptIndexes,
    removedIndexes,
    removalReasons,
  }
}
