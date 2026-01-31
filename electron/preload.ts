import { contextBridge, ipcRenderer } from 'electron'

export interface RsyncOptions {
  source: string
  destination: string
  archive: boolean
  verbose: boolean
  compress: boolean
  delete: boolean
  dryRun: boolean
}

export interface RsyncProgress {
  bytes: string
  percentage: number
  speed: string
  eta: string
}

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Select folder dialog
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Start rsync
  startRsync: (options: RsyncOptions) => ipcRenderer.invoke('start-rsync', options),

  // Stop rsync
  stopRsync: () => ipcRenderer.invoke('stop-rsync'),

  // Event listeners
  onRsyncOutput: (callback: (output: string) => void) => {
    ipcRenderer.on('rsync-output', (_event, output) => callback(output))
  },

  onRsyncError: (callback: (error: string) => void) => {
    ipcRenderer.on('rsync-error', (_event, error) => callback(error))
  },

  onRsyncProgress: (callback: (progress: RsyncProgress) => void) => {
    ipcRenderer.on('rsync-progress', (_event, progress) => callback(progress))
  },

  onRsyncComplete: (callback: (result: { code: number }) => void) => {
    ipcRenderer.on('rsync-complete', (_event, result) => callback(result))
  },

  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('rsync-output')
    ipcRenderer.removeAllListeners('rsync-error')
    ipcRenderer.removeAllListeners('rsync-progress')
    ipcRenderer.removeAllListeners('rsync-complete')
  }
})
