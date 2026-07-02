import { Filter, ShieldCheck } from 'lucide-react'
import type { FilterConfig } from '../domain/har.types'

type FilterPanelProps = {
  config: FilterConfig
  sanitizeSecrets: boolean
  hosts: Array<{ host: string; count: number }>
  onConfigChange: (config: FilterConfig) => void
  onSanitizeSecretsChange: (value: boolean) => void
}

export function FilterPanel({
  config,
  sanitizeSecrets,
  hosts,
  onConfigChange,
  onSanitizeSecretsChange,
}: FilterPanelProps) {
  function updateConfig(next: Partial<FilterConfig>) {
    onConfigChange({ ...config, ...next })
  }

  return (
    <section className="forge-panel control-panel" aria-label="Filters">
      <div className="panel-heading">
        <div className="heading-icon" aria-hidden="true">
          <Filter size={18} />
        </div>
        <div>
          <p className="panel-kicker">Filter rules</p>
          <h2>Keep the test flow</h2>
        </div>
      </div>

      <div className="segmented" aria-label="Filter action">
        <button
          className={config.action === 'keep' ? 'active' : ''}
          type="button"
          onClick={() => updateConfig({ action: 'keep' })}
        >
          Keep matches
        </button>
        <button
          className={config.action === 'drop' ? 'active' : ''}
          type="button"
          onClick={() => updateConfig({ action: 'drop' })}
        >
          Drop matches
        </button>
      </div>

      <div className="filter-grid">
        <label>
          <span>Match field</span>
          <select value={config.field} onChange={(event) => updateConfig({ field: event.target.value as FilterConfig['field'] })}>
            <option value="path">Path</option>
            <option value="host">Host</option>
            <option value="url">URL</option>
          </select>
        </label>
        <label>
          <span>Match operator</span>
          <select
            aria-label="Match operator"
            value={config.operator}
            onChange={(event) => updateConfig({ operator: event.target.value as FilterConfig['operator'] })}
          >
            <option value="contains">Contains</option>
            <option value="regex">Regex</option>
          </select>
        </label>
        <label className="wide-field">
          <span>Match value</span>
          <input
            aria-label="Match value"
            type="text"
            value={config.value}
            placeholder="/api/transferencias"
            onChange={(event) => updateConfig({ value: event.target.value })}
          />
        </label>
        <label className="wide-field">
          <span>Base host</span>
          <select value={config.baseHost} onChange={(event) => updateConfig({ baseHost: event.target.value })}>
            {hosts.length === 0 ? <option value="">No HAR loaded</option> : null}
            {hosts.map((host) => (
              <option key={host.host} value={host.host}>
                {host.host} ({host.count})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="toggle-grid">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.removeOptions}
            onChange={(event) => updateConfig({ removeOptions: event.target.checked })}
          />
          <span>Remove OPTIONS</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.removeStaticAssets}
            onChange={(event) => updateConfig({ removeStaticAssets: event.target.checked })}
          />
          <span>Remove static assets</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.removeThirdParty}
            onChange={(event) => updateConfig({ removeThirdParty: event.target.checked })}
          />
          <span>Remove third-party</span>
        </label>
        <label className="toggle-row shield-row">
          <input
            type="checkbox"
            checked={sanitizeSecrets}
            onChange={(event) => onSanitizeSecretsChange(event.target.checked)}
          />
          <ShieldCheck size={16} />
          <span>Sanitize secrets</span>
        </label>
      </div>
    </section>
  )
}
