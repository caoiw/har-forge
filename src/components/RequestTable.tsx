import type { RequestSummaryRow } from '../domain/har.types'

type RequestTableProps = {
  rows: RequestSummaryRow[]
  manualRemovedIndexes: Set<number>
  onManualRemoveToggle: (index: number) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  return `${(bytes / 1024).toFixed(1)} KB`
}

export function RequestTable({ rows, manualRemovedIndexes, onManualRemoveToggle }: RequestTableProps) {
  const manualRemovedCount = rows.filter((row) => manualRemovedIndexes.has(row.index)).length
  const keptCount = rows.length - manualRemovedCount

  return (
    <section className="forge-panel table-panel">
      <div className="table-heading">
        <div>
          <p className="panel-kicker">Clean preview</p>
          <h2>Requests after filters</h2>
        </div>
        <span>
          {keptCount} kept, {manualRemovedCount} manually removed
        </span>
      </div>

      <div className="table-wrap">
        <table aria-label="Request preview">
          <thead>
            <tr>
              <th>Method</th>
              <th>Status</th>
              <th>Host</th>
              <th>Path</th>
              <th>Type</th>
              <th>Size</th>
              <th>Time</th>
              <th>Class</th>
              <th className="manual-remove-column">Exclude</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">
                  No requests match the current filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const manuallyRemoved = manualRemovedIndexes.has(row.index)

                return (
                  <tr key={row.index} className={manuallyRemoved ? 'manually-removed' : undefined}>
                    <td>
                      <span className={`method-pill method-${row.method.toLowerCase()}`}>{row.method}</span>
                    </td>
                    <td>{row.status}</td>
                    <td className="mono-cell">{row.host}</td>
                    <td className="path-cell">{row.path}</td>
                    <td>{row.mimeType || '-'}</td>
                    <td>{formatBytes(row.size)}</td>
                    <td>{Math.round(row.time)} ms</td>
                    <td>
                      <span className={`category-pill ${row.category}`}>{row.category}</span>
                    </td>
                    <td className="manual-remove-cell">
                      <input
                        aria-label={`Exclude ${row.method} ${row.path} from export`}
                        type="checkbox"
                        checked={manuallyRemoved}
                        onChange={() => onManualRemoveToggle(row.index)}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
