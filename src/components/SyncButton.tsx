import React from 'react'

interface SyncButtonProps {
  isRunning: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  isRunning,
  onStart,
  onStop,
  disabled = false
}) => {
  return (
    <div className="sync-button-container">
      {isRunning ? (
        <button onClick={onStop} className="sync-button stop-button">
          Stop Sync
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={disabled}
          className="sync-button start-button"
        >
          Start Sync
        </button>
      )}
    </div>
  )
}
