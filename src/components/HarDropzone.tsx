import { FileJson, Upload } from 'lucide-react'

type HarDropzoneProps = {
  fileName?: string
  error?: string
  onFileSelected: (file: File) => void
}

export function HarDropzone({ fileName, error, onFileSelected }: HarDropzoneProps) {
  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) {
      onFileSelected(file)
    }
  }

  return (
    <section
      className="forge-panel upload-panel"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        handleFiles(event.dataTransfer.files)
      }}
    >
      <div className="upload-mark" aria-hidden="true">
        <FileJson size={28} />
      </div>
      <div className="upload-copy">
        <p className="panel-kicker">Source capture</p>
        <h2>Drop a HAR file</h2>
        <p>Your file stays in this browser. HAR Forge reads, filters, and exports it locally.</p>
        {fileName ? <p className="selected-file">{fileName}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </div>
      <label className="icon-button primary-button" htmlFor="har-file-input">
        <Upload size={18} />
        <span>Upload HAR</span>
      </label>
      <input
        id="har-file-input"
        aria-label="Upload HAR"
        className="sr-only"
        type="file"
        accept=".har,application/json"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </section>
  )
}
