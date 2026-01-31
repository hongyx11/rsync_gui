import React from 'react'
import { SyncItem, Project } from '../types'

interface SyncListProps {
  items: SyncItem[]
  projects: Project[]
  selectedItemId: string | null
  runningItemId: string | null
  onSelectItem: (item: SyncItem) => void
  onRunItem: (item: SyncItem) => void
  onEditItem: (item: SyncItem) => void
  onDeleteItem: (itemId: string) => void
  onToggleProject: (projectId: string) => void
}

export const SyncList: React.FC<SyncListProps> = ({
  items,
  projects,
  selectedItemId,
  runningItemId,
  onSelectItem,
  onRunItem,
  onEditItem,
  onDeleteItem,
  onToggleProject
}) => {
  const getItemsByProject = (projectId: string) => {
    return items.filter(item => item.projectId === projectId)
  }

  const getStatusIcon = (item: SyncItem) => {
    if (runningItemId === item.id) return '↻'
    switch (item.status) {
      case 'completed': return '✓'
      case 'error': return '✗'
      default: return '○'
    }
  }

  const getStatusClass = (item: SyncItem) => {
    if (runningItemId === item.id) return 'status-running'
    switch (item.status) {
      case 'completed': return 'status-completed'
      case 'error': return 'status-error'
      default: return 'status-idle'
    }
  }

  // Format last sync time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Format path as [SERVER]:[FOLDER] or just [FOLDER] for local paths
  const formatPath = (path: string) => {
    // Check if it's a remote path (contains user@server: or server:)
    const remoteMatch = path.match(/^(?:([^@]+)@)?([^:]+):(.+)$/)

    if (remoteMatch) {
      // Remote path: user@server:/path/to/folder or server:/path/to/folder
      const server = remoteMatch[2]
      const remotePath = remoteMatch[3]
      // Get last folder name from path
      const folders = remotePath.split('/').filter(Boolean)
      const lastFolder = folders[folders.length - 1] || remotePath
      return `${server}:${lastFolder}`
    } else {
      // Local path: /path/to/folder
      const folders = path.split('/').filter(Boolean)
      const lastFolder = folders[folders.length - 1] || path
      return lastFolder
    }
  }

  return (
    <div className="sync-list">
      <div className="list-header">
        <span className="col-id">ID</span>
        <span className="col-source">Source</span>
        <span className="col-arrow"></span>
        <span className="col-dest">Destination</span>
        <span className="col-time">Last Sync</span>
        <span className="col-actions">Actions</span>
      </div>

      {projects.map(project => {
        const projectItems = getItemsByProject(project.id)
        if (projectItems.length === 0) return null

        return (
          <div key={project.id} className="project-group">
            <div
              className="project-header"
              onClick={() => onToggleProject(project.id)}
              style={{ borderLeftColor: project.color }}
            >
              <span className="collapse-icon">{project.collapsed ? '▶' : '▼'}</span>
              <span className="project-name">{project.name}</span>
              <span className="project-count">{projectItems.length} items</span>
            </div>

            {!project.collapsed && (
              <div className="project-items">
                {projectItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`sync-item ${selectedItemId === item.id ? 'selected' : ''}`}
                    onClick={() => onSelectItem(item)}
                  >
                    <span className="col-id">
                      <span className={`status-icon ${getStatusClass(item)}`}>
                        {getStatusIcon(item)}
                      </span>
                      {index + 1}
                    </span>
                    <span className="col-source" title={item.source}>
                      {formatPath(item.source)}
                    </span>
                    <span className="col-arrow">
                      {item.options.twoWay ? '⇄' : '→'}
                    </span>
                    <span className="col-dest" title={item.destination}>
                      {formatPath(item.destination)}
                    </span>
                    <span className="col-time" title={item.lastSync || 'Never synced'}>
                      {formatTime(item.lastSync)}
                    </span>
                    <span className="col-actions">
                      <button
                        className="action-btn run-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRunItem(item)
                        }}
                        disabled={runningItemId !== null}
                        title="Run sync"
                      >
                        ▶
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditItem(item)
                        }}
                        disabled={runningItemId === item.id}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteItem(item.id)
                        }}
                        disabled={runningItemId === item.id}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="empty-list">
          No sync items yet. Add one using the form below.
        </div>
      )}
    </div>
  )
}
