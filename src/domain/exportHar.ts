import type { HarDocument } from './har.types'

export function createHarBlob(har: HarDocument): Blob {
  return new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' })
}
