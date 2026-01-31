import { useState, useRef, useEffect } from 'react'
import { SyncList } from './components/SyncList'
import { ProjectManager } from './components/ProjectManager'
import { AddItemForm } from './components/AddItemForm'
import { ProgressBar } from './components/ProgressBar'
import { OutputLog } from './components/OutputLog'
import { useRsync } from './hooks/useRsync'
import { useStorage } from './hooks/useStorage'
import { SyncItem } from './types'
import './App.css'

function App() {
  const [selectedItem, setSelectedItem] = useState<SyncItem | null>(null)
  const [editingItem, setEditingItem] = useState<SyncItem | null>(null)
  const [runningItemId, setRunningItemId] = useState<string | null>(null)
  const [runningProjectId, setRunningProjectId] = useState<string | null>(null)
  const [projectQueue, setProjectQueue] = useState<SyncItem[]>([])
  const projectQueueRef = useRef<SyncItem[]>([])

  const {
    projects,
    items,
    isLoaded,
    addProject,
    updateProject,
    deleteProject,
    toggleProjectCollapse,
    addItem,
    deleteItem,
    updateItem,
    updateItemStatus
  } = useStorage()

  const { isRunning, progress, output, error, startSync, stopSync, clearOutput } = useRsync()

  // Keep ref in sync with state
  useEffect(() => {
    projectQueueRef.current = projectQueue
  }, [projectQueue])

  const runNextInQueue = async () => {
    const queue = projectQueueRef.current
    if (queue.length === 0) {
      setRunningProjectId(null)
      return
    }

    const nextItem = queue[0]
    const remainingQueue = queue.slice(1)
    setProjectQueue(remainingQueue)
    projectQueueRef.current = remainingQueue

    setSelectedItem(nextItem)
    setRunningItemId(nextItem.id)
    updateItemStatus(nextItem.id, 'running')

    // Set up two-way sync if needed
    if (nextItem.options.twoWay) {
      setTwoWayPhase('first')
      setPendingReverseItem(nextItem)
    }

    await startSync({
      source: nextItem.source,
      destination: nextItem.destination,
      ...nextItem.options,
      update: nextItem.options.twoWay ? true : nextItem.options.update
    })
  }

  // Track two-way sync state
  const [twoWayPhase, setTwoWayPhase] = useState<'none' | 'first' | 'second'>('none')
  const [pendingReverseItem, setPendingReverseItem] = useState<SyncItem | null>(null)

  const handleRunItem = async (item: SyncItem) => {
    if (isRunning) return

    setSelectedItem(item)
    setRunningItemId(item.id)
    updateItemStatus(item.id, 'running')
    clearOutput()

    if (item.options.twoWay) {
      // Two-way sync: first run A→B
      setTwoWayPhase('first')
      setPendingReverseItem(item)
    }

    await startSync({
      source: item.source,
      destination: item.destination,
      ...item.options,
      update: true // Always use -u for two-way sync
    })
  }

  const handleRunProject = async (projectId: string) => {
    if (isRunning || runningProjectId) return

    const projectItems = items.filter(item => item.projectId === projectId)
    if (projectItems.length === 0) return

    setRunningProjectId(projectId)
    clearOutput()

    // Set up the queue (all items except the first)
    const [firstItem, ...rest] = projectItems
    setProjectQueue(rest)
    projectQueueRef.current = rest

    // Start the first item
    setSelectedItem(firstItem)
    setRunningItemId(firstItem.id)
    updateItemStatus(firstItem.id, 'running')

    // Set up two-way sync if needed
    if (firstItem.options.twoWay) {
      setTwoWayPhase('first')
      setPendingReverseItem(firstItem)
    }

    await startSync({
      source: firstItem.source,
      destination: firstItem.destination,
      ...firstItem.options,
      update: firstItem.options.twoWay ? true : firstItem.options.update
    })
  }

  const handleEditItem = (item: SyncItem) => {
    setEditingItem(item)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  const handleStopSync = () => {
    stopSync()
    if (runningItemId) {
      updateItemStatus(runningItemId, 'idle')
      setRunningItemId(null)
    }
    // Clear two-way sync state
    setTwoWayPhase('none')
    setPendingReverseItem(null)
    // Clear the queue and stop project run
    setProjectQueue([])
    projectQueueRef.current = []
    setRunningProjectId(null)
  }

  // Handle sync completion
  useEffect(() => {
    if (!isRunning && runningItemId) {
      const hasError = error !== null

      // Check if we need to run the reverse direction for two-way sync
      if (twoWayPhase === 'first' && pendingReverseItem && !hasError) {
        // Run the reverse direction: B→A
        setTwoWayPhase('second')
        setTimeout(async () => {
          await startSync({
            source: pendingReverseItem.destination,
            destination: pendingReverseItem.source,
            ...pendingReverseItem.options,
            update: true
          })
        }, 500)
        return
      }

      // Sync complete (or two-way second phase complete)
      updateItemStatus(
        runningItemId,
        hasError ? 'error' : 'completed',
        new Date().toISOString()
      )
      setRunningItemId(null)
      setTwoWayPhase('none')
      setPendingReverseItem(null)

      // If we're running a project, run the next item
      if (runningProjectId && projectQueueRef.current.length > 0) {
        // Small delay to show completion status
        setTimeout(() => {
          runNextInQueue()
        }, 500)
      } else if (runningProjectId) {
        // Project run complete
        setRunningProjectId(null)
      }
    }
  }, [isRunning])

  if (!isLoaded) {
    return <div className="app loading">Loading...</div>
  }

  const queueLength = projectQueue.length

  return (
    <div className="app">
      <header className="app-header">
        <h1>Rsync GUI</h1>
        <p className="subtitle">Sync files with visual progress</p>
      </header>

      <main className="app-main">
        <div className="app-layout">
          <aside className="sidebar">
            <ProjectManager
              projects={projects}
              runningProjectId={runningProjectId}
              isRunning={isRunning}
              onAddProject={addProject}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onRunProject={handleRunProject}
            />
          </aside>

          <div className="main-content">
            <SyncList
              items={items}
              projects={projects}
              selectedItemId={selectedItem?.id || null}
              runningItemId={runningItemId}
              onSelectItem={setSelectedItem}
              onRunItem={handleRunItem}
              onEditItem={handleEditItem}
              onDeleteItem={deleteItem}
              onToggleProject={toggleProjectCollapse}
            />

            <AddItemForm
              projects={projects}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              editingItem={editingItem}
              onCancelEdit={handleCancelEdit}
              disabled={isRunning}
            />

            {(isRunning || progress || output.length > 0) && (
              <div className="sync-status">
                {runningProjectId && queueLength > 0 && (
                  <div className="queue-status">
                    Running project: {queueLength} item{queueLength !== 1 ? 's' : ''} remaining in queue
                  </div>
                )}

                <ProgressBar progress={progress} isRunning={isRunning} />

                {isRunning && (
                  <button onClick={handleStopSync} className="stop-button">
                    {runningProjectId ? 'Stop All' : 'Stop Sync'}
                  </button>
                )}

                <OutputLog output={output} error={error} />

                {!isRunning && output.length > 0 && (
                  <button onClick={clearOutput} className="clear-button">
                    Clear Output
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
