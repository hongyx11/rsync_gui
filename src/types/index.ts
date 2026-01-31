export interface RsyncOptions {
  source: string
  destination: string
  archive: boolean
  verbose: boolean
  compress: boolean
  delete: boolean
  dryRun: boolean
  update: boolean
  twoWay: boolean
  excludes: string[]
}

export interface SyncItem {
  id: string
  source: string
  destination: string
  projectId: string
  options: Omit<RsyncOptions, 'source' | 'destination'>
  lastSync?: string
  status?: 'idle' | 'running' | 'completed' | 'error'
}

export interface Project {
  id: string
  name: string
  color: string
  collapsed?: boolean
}

export interface RsyncProgress {
  bytes: string
  percentage: number
  speed: string
  eta: string
}

export interface RsyncState {
  isRunning: boolean
  progress: RsyncProgress | null
  output: string[]
  error: string | null
}

// Electron API exposed via preload
export interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  startRsync: (options: RsyncOptions) => Promise<{ success: boolean; error?: string; started?: boolean }>
  stopRsync: () => Promise<{ success: boolean; error?: string }>
  onRsyncOutput: (callback: (output: string) => void) => void
  onRsyncError: (callback: (error: string) => void) => void
  onRsyncProgress: (callback: (progress: RsyncProgress) => void) => void
  onRsyncComplete: (callback: (result: { code: number }) => void) => void
  removeAllListeners: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
