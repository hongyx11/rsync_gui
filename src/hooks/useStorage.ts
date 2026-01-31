import { useState, useEffect, useCallback } from 'react'
import { Project, SyncItem } from '../types'

const STORAGE_KEYS = {
  PROJECTS: 'rsync-gui-projects',
  ITEMS: 'rsync-gui-items'
}

const DEFAULT_PROJECTS: Project[] = [
  { id: 'default', name: 'General', color: '#60a5fa' }
]

export function useStorage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [items, setItems] = useState<SyncItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS)
    const storedItems = localStorage.getItem(STORAGE_KEYS.ITEMS)

    if (storedProjects) {
      setProjects(JSON.parse(storedProjects))
    } else {
      setProjects(DEFAULT_PROJECTS)
    }

    if (storedItems) {
      setItems(JSON.parse(storedItems))
    }

    setIsLoaded(true)
  }, [])

  // Save projects to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
    }
  }, [projects, isLoaded])

  // Save items to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addProject = useCallback((project: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`
    }
    setProjects(prev => [...prev, newProject])
  }, [])

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    // Also delete all items in this project
    setItems(prev => prev.filter(item => item.projectId !== projectId))
  }, [])

  const updateProject = useCallback((projectId: string, updates: Partial<Omit<Project, 'id'>>) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, ...updates } : p
    ))
  }, [])

  const toggleProjectCollapse = useCallback((projectId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, collapsed: !p.collapsed } : p
    ))
  }, [])

  const addItem = useCallback((item: Omit<SyncItem, 'id'>) => {
    const newItem: SyncItem = {
      ...item,
      id: `item-${Date.now()}`
    }
    setItems(prev => [...prev, newItem])
  }, [])

  const deleteItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const updateItemStatus = useCallback((itemId: string, status: SyncItem['status'], lastSync?: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status, lastSync: lastSync || item.lastSync } : item
    ))
  }, [])

  const updateItem = useCallback((itemId: string, updates: Partial<Omit<SyncItem, 'id'>>) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ))
  }, [])

  return {
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
  }
}
