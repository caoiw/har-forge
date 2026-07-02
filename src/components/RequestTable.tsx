import type { RequestSummaryRow } from '../domain/har.types'

type RequestTableProps = {
  rows: RequestSummaryRow[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  return `${(bytes / 1024).toFixed(1)} KB`
}

export function RequestTable({ rows }: RequestTableProps) {
  return (
    <section className="forge-panel table-panel">
      <div className="table-heading">
        <div>
          <p className="panel-kicker">Clean preview</p>
          <h2>Requests kept for export</h2>
        </div>
        <span>{rows.length} rows</span>
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
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  No requests match the current filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.index}>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
