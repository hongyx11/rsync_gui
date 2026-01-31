import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { spawn, ChildProcess, execSync } from 'child_process'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let rsyncProcess: ChildProcess | null = null

// Detect if we have GNU rsync (supports --info=progress2) or openrsync (macOS default)
function hasGnuRsync(): boolean {
  try {
    const version = execSync('rsync --version 2>&1').toString()
    return version.includes('rsync  version') && !version.includes('openrsync')
  } catch {
    return false
  }
}

const isGnuRsync = hasGnuRsync()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC Handlers

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  if (result.canceled) {
    return null
  }
  return result.filePaths[0]
})

// Track file count for progress estimation
let totalFiles = 0
let processedFiles = 0

// Start rsync process
ipcMain.handle('start-rsync', async (_event, options: {
  source: string
  destination: string
  archive: boolean
  verbose: boolean
  compress: boolean
  delete: boolean
  dryRun: boolean
  update?: boolean
  excludes?: string[]
}) => {
  if (rsyncProcess) {
    return { success: false, error: 'Rsync is already running' }
  }

  // Reset counters
  totalFiles = 0
  processedFiles = 0

  const args: string[] = []

  // Add flags
  if (options.archive) args.push('-a')
  if (options.verbose) args.push('-v')
  if (options.compress) args.push('-z')
  if (options.update) args.push('-u')
  if (options.delete) args.push('--delete')
  if (options.dryRun) args.push('--dry-run')

  // Add exclude patterns
  if (options.excludes && options.excludes.length > 0) {
    for (const exclude of options.excludes) {
      args.push('--exclude', exclude)
    }
  }

  // Add progress flag - works on both GNU rsync and openrsync
  args.push('--progress')

  // GNU rsync specific flags for better progress
  if (isGnuRsync) {
    args.push('--info=progress2')
    args.push('--no-inc-recursive')
  }

  // Add source and destination
  const source = options.source.endsWith('/') ? options.source : options.source + '/'
  args.push(source)
  args.push(options.destination)

  console.log('Starting rsync with args:', args.join(' '))

  return new Promise((resolve) => {
    rsyncProcess = spawn('rsync', args)

    rsyncProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      mainWindow?.webContents.send('rsync-output', output)

      // Parse progress based on rsync type
      const progress = isGnuRsync
        ? parseGnuRsyncProgress(output)
        : parseOpenRsyncProgress(output)

      if (progress) {
        mainWindow?.webContents.send('rsync-progress', progress)
      }
    })

    rsyncProcess.stderr?.on('data', (data: Buffer) => {
      const errorMsg = data.toString()
      console.error('rsync stderr:', errorMsg)
      mainWindow?.webContents.send('rsync-output', `[stderr] ${errorMsg}`)
    })

    rsyncProcess.on('close', (code) => {
      console.log('rsync process closed with code:', code)
      rsyncProcess = null
      mainWindow?.webContents.send('rsync-complete', { code })
    })

    rsyncProcess.on('error', (error) => {
      console.error('rsync process error:', error)
      rsyncProcess = null
      mainWindow?.webContents.send('rsync-error', error.message)
      resolve({ success: false, error: error.message })
    })

    resolve({ success: true, started: true })
  })
})

// Stop rsync process
ipcMain.handle('stop-rsync', async () => {
  if (rsyncProcess) {
    rsyncProcess.kill('SIGTERM')
    rsyncProcess = null
    return { success: true }
  }
  return { success: false, error: 'No rsync process running' }
})

// Parse GNU rsync --info=progress2 output
// Format: "  1,234,567  50%   10.00MB/s    0:00:30"
function parseGnuRsyncProgress(output: string): {
  bytes: string
  percentage: number
  speed: string
  eta: string
} | null {
  const regex = /^\s*([\d,]+)\s+(\d+)%\s+([\d.]+\w+\/s)\s+([\d:]+)/m
  const match = output.match(regex)

  if (match) {
    return {
      bytes: match[1],
      percentage: parseInt(match[2], 10),
      speed: match[3],
      eta: match[4]
    }
  }

  return null
}

// Parse openrsync/basic rsync --progress output
// Format varies, but typically shows file-by-file progress
function parseOpenRsyncProgress(output: string): {
  bytes: string
  percentage: number
  speed: string
  eta: string
} | null {
  // Count files being transferred for progress estimation
  const lines = output.split('\n')

  for (const line of lines) {
    // Match file transfer lines (files being copied)
    if (line.match(/^[^\s]/) && !line.startsWith('sending') && !line.startsWith('sent') && !line.startsWith('total')) {
      processedFiles++
    }

    // Try to get total from "to-check" line
    // Format: "to-check=123/456"
    const toCheckMatch = line.match(/to-check=(\d+)\/(\d+)/)
    if (toCheckMatch) {
      const remaining = parseInt(toCheckMatch[1], 10)
      const total = parseInt(toCheckMatch[2], 10)
      totalFiles = total
      processedFiles = total - remaining

      const percentage = Math.round((processedFiles / total) * 100)
      return {
        bytes: `${processedFiles}/${total} files`,
        percentage,
        speed: 'N/A',
        eta: 'N/A'
      }
    }

    // Match percentage from individual file progress
    // Format: "  1234567 100%   10.00MB/s    0:00:00"
    const progressMatch = line.match(/\s+([\d,]+)\s+(\d+)%\s+([\d.]+\w+\/s)\s+([\d:]+)/)
    if (progressMatch) {
      return {
        bytes: progressMatch[1],
        percentage: parseInt(progressMatch[2], 10),
        speed: progressMatch[3],
        eta: progressMatch[4]
      }
    }
  }

  // Return estimated progress based on file count
  if (totalFiles > 0) {
    const percentage = Math.round((processedFiles / totalFiles) * 100)
    return {
      bytes: `${processedFiles}/${totalFiles} files`,
      percentage: Math.min(percentage, 99),
      speed: 'N/A',
      eta: 'N/A'
    }
  }

  return null
}
