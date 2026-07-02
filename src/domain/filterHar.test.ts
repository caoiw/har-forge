import { describe, expect, it } from 'vitest'
import { createEntry, createHar } from '../test/harFactory'
import { filterHar } from './filterHar'

describe('filterHar', () => {
  it('keeps only matching path entries in keep mode', () => {
    const har = createHar([
      createEntry({ url: 'https://api.example.test/api/transferencias/1' }),
      createEntry({ url: 'https://api.example.test/api/usuarios/1' }),
    ])

    const result = filterHar(har, {
      action: 'keep',
      field: 'path',
      operator: 'contains',
      value: '/api/transferencias',
      removeOptions: false,
      removeStaticAssets: false,
      removeThirdParty: false,
      baseHost: 'api.example.test',
    })

    expect(result.error).toBeUndefined()
    expect(result.keptCount).toBe(1)
    expect(result.removedCount).toBe(1)
    expect(result.har.log.entries[0].request.url).toContain('/api/transferencias')
    expect(result.removedIndexes).toEqual([1])
  })

  it('drops matching URL entries in drop mode', () => {
    const har = createHar([
      createEntry({ url: 'https://api.example.test/api/transferencias/1' }),
      createEntry({ url: 'https://api.example.test/api/debug/trace' }),
    ])

    const result = filterHar(har, {
      action: 'drop',
      field: 'url',
      operator: 'contains',
      value: '/debug',
      removeOptions: false,
      removeStaticAssets: false,
      removeThirdParty: false,
      baseHost: 'api.example.test',
    })

    expect(result.keptCount).toBe(1)
    expect(result.har.log.entries[0].request.url).toContain('/transferencias')
  })

  it('supports regex matching', () => {
    const har = createHar([
      createEntry({ url: 'https://api.example.test/api/transferencias/1' }),
      createEntry({ url: 'https://api.example.test/api/insumos/1' }),
      createEntry({ url: 'https://api.example.test/health' }),
    ])

    const result = filterHar(har, {
      action: 'keep',
      field: 'path',
      operator: 'regex',
      value: '/api/(transferencias|insumos)',
      removeOptions: false,
      removeStaticAssets: false,
      removeThirdParty: false,
      baseHost: 'api.example.test',
    })

    expect(result.keptCount).toBe(2)
    expect(result.removedCount).toBe(1)
  })

  it('reports invalid regex without changing the HAR', () => {
    const har = createHar([createEntry()])

    const result = filterHar(har, {
      action: 'keep',
      field: 'path',
      operator: 'regex',
      value: '[',
      removeOptions: false,
      removeStaticAssets: false,
      removeThirdParty: false,
      baseHost: 'api.example.test',
    })

    expect(result.error).toBe('Invalid regular expression.')
    expect(result.har).toBe(har)
  })

  it('removes OPTIONS, static assets, and third-party entries when toggles are enabled', () => {
    const har = createHar([
      createEntry({ url: 'https://app.example.test/api/users', method: 'GET' }),
      createEntry({ url: 'https://app.example.test/api/users', method: 'OPTIONS' }),
      createEntry({ url: 'https://app.example.test/assets/site.css', mimeType: 'text/css' }),
      createEntry({ url: 'https://cdn.example.test/pixel.gif', mimeType: 'image/gif' }),
    ])

    const result = filterHar(har, {
      action: 'keep',
      field: 'path',
      operator: 'contains',
      value: '',
      removeOptions: true,
      removeStaticAssets: true,
      removeThirdParty: true,
      baseHost: 'app.example.test',
    })

    expect(result.keptCount).toBe(1)
    expect(result.har.log.entries[0].request.method).toBe('GET')
    expect(result.removalReasons).toEqual({
      options: 1,
      staticAssets: 1,
      thirdParty: 1,
      rule: 0,
    })
  })
})
