import React from 'react'
import { RsyncProgress } from '../types'

interface ProgressBarProps {
  progress: RsyncProgress | null
  isRunning: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isRunning }) => {
  const percentage = progress?.percentage ?? 0

  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div
          className={`progress-bar ${isRunning ? 'running' : ''}`}
          style={{ width: `${percentage}%` }}
        />
        <span className="progress-text">{percentage}%</span>
      </div>
      {progress && (
        <div className="progress-stats">
          <span className="stat">
            <strong>Transferred:</strong> {progress.bytes} bytes
          </span>
          <span className="stat">
            <strong>Speed:</strong> {progress.speed}
          </span>
          <span className="stat">
            <strong>ETA:</strong> {progress.eta}
          </span>
        </div>
      )}
      {!progress && isRunning && (
        <div className="progress-stats">
          <span className="stat">Starting sync...</span>
        </div>
      )}
    </div>
  )
}
