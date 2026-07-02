import { AlertTriangle, Download } from 'lucide-react'

type SummaryPanelProps = {
  total: number
  kept: number
  removed: number
  error?: string
  disabled: boolean
  onDownload: () => void
}

export function SummaryPanel({ total, kept, removed, error, disabled, onDownload }: SummaryPanelProps) {
  return (
    <section className="forge-panel summary-panel" aria-label="Preview summary">
      <div className="summary-stat">
        <span>Total</span>
        <strong>{total}</strong>
      </div>
      <div className="summary-stat kept">
        <span>Kept</span>
        <strong>{kept}</strong>
      </div>
      <div className="summary-stat removed">
        <span>Removed</span>
        <strong>{removed}</strong>
      </div>
      <div className="summary-action">
        {error ? (
          <p className="inline-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </p>
        ) : null}
        <button className="icon-button export-button" type="button" disabled={disabled} onClick={onDownload}>
          <Download size={18} />
          <span>Download clean.har</span>
        </button>
      </div>
    </section>
  )
}
