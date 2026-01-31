import { useState, useEffect, useCallback } from 'react'
import { RsyncOptions, RsyncProgress, RsyncState } from '../types'

const initialState: RsyncState = {
  isRunning: false,
  progress: null,
  output: [],
  error: null
}

export function useRsync() {
  const [state, setState] = useState<RsyncState>(initialState)

  useEffect(() => {
    // Set up event listeners
    window.electronAPI.onRsyncOutput((output) => {
      setState((prev) => ({
        ...prev,
        output: [...prev.output, output]
      }))
    })

    window.electronAPI.onRsyncError((error) => {
      setState((prev) => ({
        ...prev,
        error
      }))
    })

    window.electronAPI.onRsyncProgress((progress: RsyncProgress) => {
      setState((prev) => ({
        ...prev,
        progress
      }))
    })

    window.electronAPI.onRsyncComplete((result) => {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        progress: result.code === 0 ? { ...prev.progress!, percentage: 100 } : prev.progress
      }))
    })

    // Cleanup
    return () => {
      window.electronAPI.removeAllListeners()
    }
  }, [])

  const startSync = useCallback(async (options: RsyncOptions) => {
    // Reset state
    setState({
      isRunning: true,
      progress: null,
      output: [],
      error: null
    })

    const result = await window.electronAPI.startRsync(options)
    if (!result.success) {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: result.error || 'Failed to start rsync'
      }))
    }
  }, [])

  const stopSync = useCallback(async () => {
    const result = await window.electronAPI.stopRsync()
    if (result.success) {
      setState((prev) => ({
        ...prev,
        isRunning: false
      }))
    }
  }, [])

  const clearOutput = useCallback(() => {
    setState((prev) => ({
      ...prev,
      output: [],
      error: null,
      progress: null
    }))
  }, [])

  return {
    ...state,
    startSync,
    stopSync,
    clearOutput
  }
}
