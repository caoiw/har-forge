import { useMemo, useState } from 'react'
import { HarDropzone } from './components/HarDropzone'
import { FilterPanel } from './components/FilterPanel'
import { RequestTable } from './components/RequestTable'
import { SummaryPanel } from './components/SummaryPanel'
import { createHarBlob } from './domain/exportHar'
import { filterHar } from './domain/filterHar'
import type { FilterConfig, HarDocument } from './domain/har.types'
import { parseHar } from './domain/parseHar'
import { sanitizeHar } from './domain/sanitizeHar'
import { summarizeHar } from './domain/summarizeHar'

const DEFAULT_FILTER: FilterConfig = {
  action: 'keep',
  field: 'path',
  operator: 'contains',
  value: '',
  removeOptions: true,
  removeStaticAssets: true,
  removeThirdParty: true,
  baseHost: '',
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function readFileAsText(file: File): Promise<string> {
  if ('text' in file && typeof file.text === 'function') {
    return file.text()
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Unable to read the selected file.'))
    reader.readAsText(file)
  })
}

export default function App() {
  const [har, setHar] = useState<HarDocument>()
  const [fileName, setFileName] = useState<string>()
  const [uploadError, setUploadError] = useState<string>()
  const [sanitizeSecrets, setSanitizeSecrets] = useState(true)
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(DEFAULT_FILTER)

  const summary = useMemo(() => (har ? summarizeHar(har, filterConfig.baseHost || undefined) : undefined), [har, filterConfig.baseHost])
  const activeBaseHost = filterConfig.baseHost || summary?.baseHost || ''
  const activeConfig = useMemo(
    () => ({
      ...filterConfig,
      baseHost: activeBaseHost,
    }),
    [activeBaseHost, filterConfig],
  )
  const filterResult = useMemo(() => (har ? filterHar(har, activeConfig) : undefined), [activeConfig, har])
  const keptRows = useMemo(() => {
    if (!summary || !filterResult || filterResult.error) {
      return []
    }

    const kept = new Set(filterResult.keptIndexes)
    return summary.rows.filter((row) => kept.has(row.index))
  }, [filterResult, summary])

  async function handleFileSelected(file: File) {
    setFileName(file.name)
    setUploadError(undefined)

    const result = parseHar(await readFileAsText(file))
    if (!result.ok) {
      setHar(undefined)
      setUploadError(result.error)
      return
    }

    const nextSummary = summarizeHar(result.har)
    setHar(result.har)
    setFilterConfig((current) => ({
      ...current,
      baseHost: nextSummary.baseHost,
    }))
  }

  function handleDownload() {
    if (!filterResult || filterResult.error) {
      return
    }

    const exportHar = sanitizeSecrets ? sanitizeHar(filterResult.har) : filterResult.har
    downloadBlob(createHarBlob(exportHar), 'clean.har')
  }

  const total = summary?.total ?? 0
  const kept = filterResult?.error ? 0 : filterResult?.keptCount ?? 0
  const removed = filterResult?.error ? 0 : filterResult?.removedCount ?? 0
  const downloadDisabled = !filterResult || Boolean(filterResult.error) || filterResult.keptCount === 0

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-eyebrow">Local-first HAR tool</p>
          <h1>HAR Forge</h1>
        </div>
        <p className="header-copy">Clean and sanitize browser captures before generating API and performance tests.</p>
      </header>

      <div className="workspace">
        <HarDropzone fileName={fileName} error={uploadError} onFileSelected={handleFileSelected} />
        <FilterPanel
          config={activeConfig}
          hosts={summary?.hosts ?? []}
          sanitizeSecrets={sanitizeSecrets}
          onConfigChange={setFilterConfig}
          onSanitizeSecretsChange={setSanitizeSecrets}
        />
        <SummaryPanel
          total={total}
          kept={kept}
          removed={removed}
          error={filterResult?.error}
          disabled={downloadDisabled}
          onDownload={handleDownload}
        />
        <RequestTable rows={keptRows} />
      </div>
    </main>
  )
}
