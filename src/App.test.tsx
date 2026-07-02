import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { createEntry, createHar } from './test/harFactory'

function createFile(contents: unknown, name = 'capture.har') {
  return new File([JSON.stringify(contents)], name, { type: 'application/json' })
}

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read blob.'))
    reader.readAsText(blob)
  })
}

function mockUrlDownload(createObjectURL: (object: Blob | MediaSource) => string, revokeObjectURL: (url: string) => void) {
  const urlApi = URL as typeof URL & {
    createObjectURL?: (object: Blob | MediaSource) => string
    revokeObjectURL?: (url: string) => void
  }
  const originalCreateObjectURL = urlApi.createObjectURL
  const originalRevokeObjectURL = urlApi.revokeObjectURL

  Object.defineProperty(urlApi, 'createObjectURL', {
    configurable: true,
    value: createObjectURL,
  })
  Object.defineProperty(urlApi, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectURL,
  })

  return () => {
    if (originalCreateObjectURL) {
      Object.defineProperty(urlApi, 'createObjectURL', {
        configurable: true,
        value: originalCreateObjectURL,
      })
    } else {
      Reflect.deleteProperty(urlApi, 'createObjectURL')
    }

    if (originalRevokeObjectURL) {
      Object.defineProperty(urlApi, 'revokeObjectURL', {
        configurable: true,
        value: originalRevokeObjectURL,
      })
    } else {
      Reflect.deleteProperty(urlApi, 'revokeObjectURL')
    }
  }
}

function expectSummaryValue(label: string, value: string) {
  const summary = screen.getByLabelText(/preview summary/i)
  const labelElement = within(summary).getByText(label)
  const statElement = labelElement.closest('.summary-stat')

  expect(statElement).not.toBeNull()
  expect(within(statElement as HTMLElement).getByText(value)).toBeInTheDocument()
}

describe('App', () => {
  it('loads a HAR, previews filtering counts, and enables download', async () => {
    const user = userEvent.setup()
    const har = createHar([
      createEntry({ url: 'https://api.example.test/api/transferencias/1', method: 'GET' }),
      createEntry({ url: 'https://api.example.test/api/users/1', method: 'GET' }),
      createEntry({ url: 'https://api.example.test/api/transferencias/1', method: 'OPTIONS' }),
    ])
    render(<App />)

    expect(screen.getByLabelText(/match value/i)).toHaveAttribute('placeholder', '/api/orders')

    await user.upload(screen.getByLabelText(/upload har/i), createFile(har))
    await user.clear(screen.getByLabelText(/match value/i))
    await user.type(screen.getByLabelText(/match value/i), '/api/transferencias')

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download clean.har/i })).toBeEnabled()

    const table = screen.getByRole('table', { name: /request preview/i })
    expect(within(table).getByText('/api/transferencias/1')).toBeInTheDocument()
    expect(within(table).queryByText('/api/users/1')).not.toBeInTheDocument()
  })

  it('removes and restores a kept request manually from the export preview', async () => {
    const user = userEvent.setup()
    const har = createHar([
      createEntry({ url: 'https://api.example.test/api/transferencias/1', method: 'GET' }),
      createEntry({ url: 'https://api.example.test/api/users/1', method: 'GET' }),
    ])
    render(<App />)

    await user.upload(screen.getByLabelText(/upload har/i), createFile(har))
    const removeUsersRequest = await screen.findByLabelText('Exclude GET /api/users/1 from export')

    expectSummaryValue('Kept', '2')
    expectSummaryValue('Removed', '0')

    await user.click(removeUsersRequest)

    expect(removeUsersRequest).toBeChecked()
    expectSummaryValue('Kept', '1')
    expectSummaryValue('Removed', '1')

    const table = screen.getByRole('table', { name: /request preview/i })
    const removedRow = within(table).getByText('/api/users/1').closest('tr')
    expect(removedRow).toHaveClass('manually-removed')

    await user.click(removeUsersRequest)

    expect(removeUsersRequest).not.toBeChecked()
    expectSummaryValue('Kept', '2')
    expectSummaryValue('Removed', '0')
  })

  it('shows the manual exclusion control as the last request table column', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.upload(screen.getByLabelText(/upload har/i), createFile(createHar()))
    await screen.findByLabelText('Exclude GET /api/transferencias/123 from export')

    const table = screen.getByRole('table', { name: /request preview/i })
    const headers = within(table).getAllByRole('columnheader').map((header) => header.textContent)

    expect(headers).toEqual(['Method', 'Status', 'Host', 'Path', 'Type', 'Size', 'Time', 'Class', 'Exclude'])
  })

  it('excludes manually removed requests from the downloaded HAR', async () => {
    const user = userEvent.setup()
    let exportedBlob: Blob | undefined
    const click = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    const createObjectURL = vi.fn((object: Blob | MediaSource) => {
      exportedBlob = object as Blob
      return 'blob:clean-har'
    })
    const revokeObjectURL = vi.fn()
    let restoreUrlDownload = () => {}
    const har = createHar([
      createEntry({ url: 'https://api.example.test/api/transferencias/1', method: 'GET' }),
      createEntry({ url: 'https://api.example.test/api/users/1', method: 'GET' }),
    ])

    try {
      render(<App />)
      await user.upload(screen.getByLabelText(/upload har/i), createFile(har))
      await user.click(await screen.findByLabelText('Exclude GET /api/users/1 from export'))

      restoreUrlDownload = mockUrlDownload(createObjectURL, revokeObjectURL)
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const element = originalCreateElement(tagName)
        if (tagName.toLowerCase() === 'a') {
          vi.spyOn(element as HTMLAnchorElement, 'click').mockImplementation(click)
        }
        return element
      })

      await user.click(screen.getByRole('button', { name: /download clean.har/i }))

      expect(exportedBlob).toBeDefined()
      const exportedHar = JSON.parse(await readBlobAsText(exportedBlob as Blob))
      expect(exportedHar.log.entries).toHaveLength(1)
      expect(exportedHar.log.entries[0].request.url).toContain('/api/transferencias/1')
      expect(click).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:clean-har')
    } finally {
      restoreUrlDownload()
      vi.restoreAllMocks()
    }
  })

  it('clears manual removals when a new HAR is loaded', async () => {
    const user = userEvent.setup()
    const firstHar = createHar([
      createEntry({ url: 'https://api.example.test/api/transferencias/1', method: 'GET' }),
      createEntry({ url: 'https://api.example.test/api/users/1', method: 'GET' }),
    ])
    const secondHar = createHar([
      createEntry({ url: 'https://api.example.test/api/orders/1', method: 'GET' }),
      createEntry({ url: 'https://api.example.test/api/products/1', method: 'GET' }),
    ])
    render(<App />)

    const uploadInput = screen.getByLabelText(/upload har/i)
    await user.upload(uploadInput, createFile(firstHar, 'first.har'))
    await user.click(await screen.findByLabelText('Exclude GET /api/users/1 from export'))

    expectSummaryValue('Kept', '1')
    expectSummaryValue('Removed', '1')

    await user.upload(uploadInput, createFile(secondHar, 'second.har'))

    expectSummaryValue('Kept', '2')
    expectSummaryValue('Removed', '0')
    expect(screen.getByLabelText('Exclude GET /api/orders/1 from export')).not.toBeChecked()
    expect(screen.queryByLabelText('Exclude GET /api/users/1 from export')).not.toBeInTheDocument()
  })

  it('shows a clear error for invalid regex', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.upload(screen.getByLabelText(/upload har/i), createFile(createHar()))
    await user.selectOptions(screen.getByLabelText(/match operator/i), 'regex')
    await user.clear(screen.getByLabelText(/match value/i))
    fireEvent.change(screen.getByLabelText(/match value/i), { target: { value: '[' } })

    expect(screen.getByText('Invalid regular expression.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download clean.har/i })).toBeDisabled()
  })

  it('downloads a sanitized clean HAR', async () => {
    const user = userEvent.setup()
    const createdUrls: string[] = []
    const click = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    const createObjectURL = vi.fn((_object: Blob | MediaSource) => {
      createdUrls.push('blob:clean-har')
      return 'blob:clean-har'
    })
    const revokeObjectURL = vi.fn()
    const restoreUrlDownload = mockUrlDownload(createObjectURL, revokeObjectURL)

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)
      if (tagName.toLowerCase() === 'a') {
        vi.spyOn(element as HTMLAnchorElement, 'click').mockImplementation(click)
      }
      return element
    })

    try {
      render(<App />)
      await user.upload(
        screen.getByLabelText(/upload har/i),
        createFile(createHar([createEntry({ requestHeaders: [{ name: 'Authorization', value: 'Bearer secret' }] })])),
      )
      await user.click(screen.getByRole('button', { name: /download clean.har/i }))

      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(click).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith(createdUrls[0])
    } finally {
      restoreUrlDownload()
      vi.restoreAllMocks()
    }
  })
})
