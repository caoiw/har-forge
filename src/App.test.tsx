import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { createEntry, createHar } from './test/harFactory'

function createFile(contents: unknown, name = 'capture.har') {
  return new File([JSON.stringify(contents)], name, { type: 'application/json' })
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
    const createObjectURL = vi.fn(() => {
      createdUrls.push('blob:clean-har')
      return 'blob:clean-har'
    })
    const revokeObjectURL = vi.fn()

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)
      if (tagName.toLowerCase() === 'a') {
        vi.spyOn(element as HTMLAnchorElement, 'click').mockImplementation(click)
      }
      return element
    })

    render(<App />)
    await user.upload(
      screen.getByLabelText(/upload har/i),
      createFile(createHar([createEntry({ requestHeaders: [{ name: 'Authorization', value: 'Bearer secret' }] })])),
    )
    await user.click(screen.getByRole('button', { name: /download clean.har/i }))

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith(createdUrls[0])

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
})
