import React, { useState } from 'react'
import { Project } from '../types'

interface ProjectManagerProps {
  projects: Project[]
  runningProjectId: string | null
  isRunning: boolean
  onAddProject: (project: Omit<Project, 'id'>) => void
  onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void
  onDeleteProject: (projectId: string) => void
  onRunProject: (projectId: string) => void
}

const PRESET_COLORS = [
  '#e94560', '#4ade80', '#60a5fa', '#f59e0b',
  '#a78bfa', '#ec4899', '#14b8a6', '#f97316'
]

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  runningProjectId,
  isRunning,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onRunProject
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])

  const handleAdd = () => {
    if (newName.trim()) {
      onAddProject({
        name: newName.trim(),
        color: selectedColor
      })
      setNewName('')
      setSelectedColor(PRESET_COLORS[0])
      setIsAdding(false)
    }
  }

  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id)
    setNewName(project.name)
    setSelectedColor(project.color)
    setIsAdding(false)
  }

  const handleSaveEdit = () => {
    if (editingProjectId && newName.trim()) {
      onUpdateProject(editingProjectId, {
        name: newName.trim(),
        color: selectedColor
      })
      handleCancelEdit()
    }
  }

  const handleCancelEdit = () => {
    setEditingProjectId(null)
    setNewName('')
    setSelectedColor(PRESET_COLORS[0])
  }

  return (
    <div className="project-manager">
      <div className="project-manager-header">
        <h3>Projects</h3>
        <button
          className="add-project-btn"
          onClick={() => {
            setIsAdding(!isAdding)
            setEditingProjectId(null)
            setNewName('')
            setSelectedColor(PRESET_COLORS[0])
          }}
        >
          {isAdding ? '✕' : '+'}
        </button>
      </div>

      {isAdding && (
        <div className="add-project-form">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className="project-name-input"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <div className="color-picker">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          <button className="confirm-add-btn" onClick={handleAdd}>
            Add Project
          </button>
        </div>
      )}

      <div className="project-list">
        {projects.map(project => (
          <div key={project.id}>
            {editingProjectId === project.id ? (
              <div className="edit-project-form">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project name"
                  className="project-name-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  autoFocus
                />
                <div className="color-picker">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
                <div className="edit-project-buttons">
                  <button className="cancel-edit-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className="save-edit-btn" onClick={handleSaveEdit}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="project-item">
                <span
                  className="project-color-dot"
                  style={{ backgroundColor: project.color }}
                />
                <span className="project-item-name">{project.name}</span>
                <button
                  className="run-project-icon-btn"
                  onClick={() => onRunProject(project.id)}
                  disabled={isRunning || runningProjectId !== null}
                  title="Run all items in this project"
                >
                  {runningProjectId === project.id ? '↻' : '▶'}
                </button>
                <button
                  className="edit-project-btn"
                  onClick={() => handleStartEdit(project)}
                  title="Edit project"
                >
                  ✎
                </button>
                <button
                  className="delete-project-btn"
                  onClick={() => onDeleteProject(project.id)}
                  title="Delete project"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
