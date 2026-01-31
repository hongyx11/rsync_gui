import React from 'react'

interface OptionsPanelProps {
  options: {
    archive: boolean
    verbose: boolean
    compress: boolean
    delete: boolean
    dryRun: boolean
  }
  onChange: (key: string, value: boolean) => void
  disabled?: boolean
}

const optionDescriptions: Record<string, string> = {
  archive: 'Archive mode (-a): preserves permissions, timestamps, symbolic links',
  verbose: 'Verbose (-v): show detailed transfer information',
  compress: 'Compress (-z): compress data during transfer',
  delete: 'Delete (--delete): remove files from destination not in source',
  dryRun: 'Dry run (--dry-run): simulate without making changes'
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  options,
  onChange,
  disabled = false
}) => {
  return (
    <div className="options-panel">
      <h3>Options</h3>
      <div className="options-grid">
        {Object.entries(options).map(([key, value]) => (
          <label key={key} className="option-item" title={optionDescriptions[key]}>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(key, e.target.checked)}
              disabled={disabled}
            />
            <span className="option-label">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
