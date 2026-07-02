import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
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

function isMultiline(value: string): boolean {
  return value.includes('\n')
}

function ParameterValue({ value }: { value: string }) {
  if (isMultiline(value)) {
    return (
      <pre className="param-value param-value-block">
        <code>{value}</code>
      </pre>
    )
  }

  return <code className="param-value">{value}</code>
}

function RequestDetails({ row }: { row: RequestSummaryRow }) {
  const { body, queryParams } = row.requestDetails
  const hasBodyContent = Boolean(body && (body.params.length > 0 || body.text))

  return (
    <div className="request-details">
      <div className="detail-section">
        <h3>Query params</h3>
        {queryParams.length === 0 ? (
          <p className="detail-empty">No query params.</p>
        ) : (
          <dl className="param-list">
            {queryParams.map((param, index) => (
              <div key={`${param.name}-${index}`} className="param-row">
                <dt>{param.name}</dt>
                <dd>
                  <ParameterValue value={param.value} />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="detail-section">
        <h3>Body</h3>
        {!hasBodyContent ? (
          <p className="detail-empty">No request body.</p>
        ) : (
          <div className="body-detail">
            {body?.mimeType ? <p className="body-mime">{body.mimeType}</p> : null}
            {body?.params.length ? (
              <dl className="param-list">
                {body.params.map((param, index) => (
                  <div key={`${param.name}-${index}`} className="param-row">
                    <dt>{param.name}</dt>
                    <dd>
                      <ParameterValue value={param.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {body?.text ? (
              <pre className="body-text">
                <code>{body.text}</code>
              </pre>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export function RequestTable({ rows, manualRemovedIndexes, onManualRemoveToggle }: RequestTableProps) {
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(() => new Set())
  const manualRemovedCount = rows.filter((row) => manualRemovedIndexes.has(row.index)).length
  const keptCount = rows.length - manualRemovedCount

  useEffect(() => {
    setExpandedIndexes((current) => (current.size > 0 ? new Set() : current))
  }, [rows])

  function toggleDetails(index: number) {
    setExpandedIndexes((current) => {
      const next = new Set(current)

      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }

      return next
    })
  }

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
              <th className="details-column">Details</th>
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
                <td colSpan={10} className="empty-cell">
                  No requests match the current filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const manuallyRemoved = manualRemovedIndexes.has(row.index)
                const expanded = expandedIndexes.has(row.index)

                return (
                  <Fragment key={row.index}>
                    <tr className={manuallyRemoved ? 'manually-removed' : undefined}>
                      <td className="details-cell">
                        <button
                          aria-expanded={expanded}
                          aria-label={`${expanded ? 'Hide' : 'Show'} details for ${row.method} ${row.path}`}
                          className="details-toggle"
                          type="button"
                          onClick={() => toggleDetails(row.index)}
                        >
                          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
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
                    {expanded ? (
                      <tr className="request-details-row">
                        <td colSpan={10}>
                          <RequestDetails row={row} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
