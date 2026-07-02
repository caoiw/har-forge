import { describe, expect, it } from 'vitest'
import { createEntry } from '../test/harFactory'
import { getRequestDetails } from './requestDetails'

describe('getRequestDetails', () => {
  it('extracts decoded query params from the URL when the HAR queryString array is empty', () => {
    const sort = encodeURIComponent(
      JSON.stringify([
        { selector: 'eventoDataHora', desc: true },
        { selector: 'criadoDataHora', desc: true },
      ]),
    )
    const entry = createEntry({
      url: `https://api.example.test/api/relatorio?skip=0&take=40&requireTotalCount=true&sort=${sort}&access_token=secret`,
    })

    const details = getRequestDetails(entry)

    expect(details.queryParams).toEqual([
      { name: 'skip', value: '0' },
      { name: 'take', value: '40' },
      { name: 'requireTotalCount', value: 'true' },
      {
        name: 'sort',
        value: JSON.stringify(
          [
            { selector: 'eventoDataHora', desc: true },
            { selector: 'criadoDataHora', desc: true },
          ],
          null,
          2,
        ),
      },
      { name: 'access_token', value: '[REDACTED]' },
    ])
  })

  it('keeps repeated query params as separate rows from the HAR queryString array', () => {
    const entry = {
      ...createEntry({ url: 'https://api.example.test/api/search?tag=ignored' }),
      request: {
        ...createEntry().request,
        url: 'https://api.example.test/api/search?tag=ignored',
        queryString: [
          { name: 'tag', value: 'first' },
          { name: 'tag', value: 'second' },
        ],
      },
    }

    const details = getRequestDetails(entry)

    expect(details.queryParams).toEqual([
      { name: 'tag', value: 'first' },
      { name: 'tag', value: 'second' },
    ])
  })

  it('extracts request body params and formats JSON postData text with redacted secret fields', () => {
    const entry = {
      ...createEntry(),
      request: {
        ...createEntry().request,
        method: 'POST',
        url: 'https://api.example.test/api/search',
        postData: {
          mimeType: 'application/json',
          params: [
            { name: 'page', value: '1' },
            { name: 'password', value: 'secret' },
          ],
          text: JSON.stringify({
            filter: ['status', '=', 'ativo'],
            nested: { client_secret: 'hidden' },
          }),
        },
      },
    }

    const details = getRequestDetails(entry)

    expect(details.body).toEqual({
      mimeType: 'application/json',
      params: [
        { name: 'page', value: '1' },
        { name: 'password', value: '[REDACTED]' },
      ],
      text: JSON.stringify(
        {
          filter: ['status', '=', 'ativo'],
          nested: { client_secret: '[REDACTED]' },
        },
        null,
        2,
      ),
    })
  })

  it('redacts sensitive values inside DevExtreme-style filter arrays', () => {
    const filter = encodeURIComponent(
      JSON.stringify([['password', '=', 'secret'], 'and', ['status', '=', 'ativo'], 'and', ['clientSecret', 'contains', 'abc']]),
    )
    const entry = createEntry({
      url: `https://api.example.test/api/users?filter=${filter}`,
    })

    const details = getRequestDetails(entry)

    expect(details.queryParams).toEqual([
      {
        name: 'filter',
        value: JSON.stringify(
          [
            ['password', '=', '[REDACTED]'],
            'and',
            ['status', '=', 'ativo'],
            'and',
            ['clientSecret', 'contains', '[REDACTED]'],
          ],
          null,
          2,
        ),
      },
    ])
  })
})
