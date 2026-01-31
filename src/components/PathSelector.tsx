import React from 'react'

interface PathSelectorProps {
  label: string
  value: string
  onChange: (path: string) => void
  disabled?: boolean
}

export const PathSelector: React.FC<PathSelectorProps> = ({
  label,
  value,
  onChange,
  disabled = false
}) => {
  const handleBrowse = async () => {
    const path = await window.electronAPI.selectFolder()
    if (path) {
      onChange(path)
    }
  }

  return (
    <div className="path-selector">
      <label className="path-label">{label}</label>
      <div className="path-input-group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select or enter path..."
          disabled={disabled}
          className="path-input"
        />
        <button
          onClick={handleBrowse}
          disabled={disabled}
          className="browse-button"
        >
          Browse
        </button>
      </div>
    </div>
  )
}
