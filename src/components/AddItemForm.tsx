import React, { useState, useEffect } from 'react'
import { Project, SyncItem } from '../types'
import { PathSelector } from './PathSelector'

interface AddItemFormProps {
  projects: Project[]
  onAddItem: (item: Omit<SyncItem, 'id'>) => void
  onUpdateItem: (itemId: string, updates: Partial<Omit<SyncItem, 'id'>>) => void
  editingItem: SyncItem | null
  onCancelEdit: () => void
  disabled?: boolean
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
  projects,
  onAddItem,
  onUpdateItem,
  editingItem,
  onCancelEdit,
  disabled = false
}) => {
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [options, setOptions] = useState({
    archive: true,
    verbose: true,
    compress: false,
    delete: false,
    dryRun: false,
    update: true,
    twoWay: false,
    excludes: [] as string[]
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [newExclude, setNewExclude] = useState('')

  // Load editing item data
  useEffect(() => {
    if (editingItem) {
      setSource(editingItem.source)
      setDestination(editingItem.destination)
      setProjectId(editingItem.projectId)
      setOptions({
        ...editingItem.options,
        update: editingItem.options.update ?? true,
        twoWay: editingItem.options.twoWay ?? false,
        excludes: editingItem.options.excludes || []
      })
      setIsExpanded(true)
    }
  }, [editingItem])

  const resetForm = () => {
    setSource('')
    setDestination('')
    setProjectId(projects[0]?.id || '')
    setOptions({
      archive: true,
      verbose: true,
      compress: false,
      delete: false,
      dryRun: false,
      update: true,
      twoWay: false,
      excludes: []
    })
    setNewExclude('')
    setIsExpanded(false)
  }

  const handleSubmit = () => {
    if (!source || !destination || !projectId) return

    if (editingItem) {
      onUpdateItem(editingItem.id, {
        source,
        destination,
        projectId,
        options
      })
      onCancelEdit()
    } else {
      onAddItem({
        source,
        destination,
        projectId,
        options,
        status: 'idle'
      })
    }

    resetForm()
  }

  const handleCancel = () => {
    if (editingItem) {
      onCancelEdit()
    }
    resetForm()
  }

  const handleOptionChange = (key: string, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const handleAddExclude = () => {
    if (newExclude.trim() && !options.excludes.includes(newExclude.trim())) {
      setOptions(prev => ({
        ...prev,
        excludes: [...prev.excludes, newExclude.trim()]
      }))
      setNewExclude('')
    }
  }

  const handleRemoveExclude = (exclude: string) => {
    setOptions(prev => ({
      ...prev,
      excludes: prev.excludes.filter(e => e !== exclude)
    }))
  }

  const handleExcludeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddExclude()
    }
  }

  if (!isExpanded && !editingItem) {
    return (
      <button
        className="expand-form-btn"
        onClick={() => setIsExpanded(true)}
        disabled={disabled || projects.length === 0}
      >
        + Add Sync Item
      </button>
    )
  }

  const isEditing = !!editingItem
  const booleanOptions = ['archive', 'verbose', 'compress', 'delete', 'dryRun'] as const

  return (
    <div className={`add-item-form ${isEditing ? 'editing' : ''}`}>
      <div className="form-header">
        <h3>{isEditing ? 'Edit Sync Item' : 'Add New Sync Item'}</h3>
        <button className="close-form-btn" onClick={handleCancel}>
          ✕
        </button>
      </div>

      <div className="form-row">
        <label>Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={disabled}
          className="project-select"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <PathSelector
        label="Source"
        value={source}
        onChange={setSource}
        disabled={disabled}
      />

      <PathSelector
        label="Destination"
        value={destination}
        onChange={setDestination}
        disabled={disabled}
      />

      <div className="form-row">
        <label>Options</label>
        <div className="inline-options">
          {booleanOptions.map((key) => (
            <label key={key} className="inline-option">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) => handleOptionChange(key, e.target.checked)}
                disabled={disabled}
              />
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>Sync Mode</label>
        <div className="sync-mode-option">
          <label className="inline-option two-way-option">
            <input
              type="checkbox"
              checked={options.twoWay}
              onChange={(e) => handleOptionChange('twoWay', e.target.checked)}
              disabled={disabled}
            />
            Two-Way Sync
            <span className="option-hint">(syncs A→B then B→A with -u flag)</span>
          </label>
        </div>
      </div>

      <div className="form-row">
        <label>Exclude Patterns</label>
        <div className="exclude-input-group">
          <input
            type="text"
            value={newExclude}
            onChange={(e) => setNewExclude(e.target.value)}
            onKeyDown={handleExcludeKeyDown}
            placeholder="e.g., node_modules, .git, *.log"
            disabled={disabled}
            className="exclude-input"
          />
          <button
            type="button"
            onClick={handleAddExclude}
            disabled={disabled || !newExclude.trim()}
            className="add-exclude-btn"
          >
            Add
          </button>
        </div>
        {options.excludes.length > 0 && (
          <div className="exclude-tags">
            {options.excludes.map((exclude) => (
              <span key={exclude} className="exclude-tag">
                {exclude}
                <button
                  type="button"
                  onClick={() => handleRemoveExclude(exclude)}
                  disabled={disabled}
                  className="remove-exclude-btn"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-buttons">
        {isEditing && (
          <button
            className="cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </button>
        )}
        <button
          className="submit-item-btn"
          onClick={handleSubmit}
          disabled={disabled || !source || !destination}
        >
          {isEditing ? 'Save Changes' : 'Add to List'}
        </button>
      </div>
    </div>
  )
}
