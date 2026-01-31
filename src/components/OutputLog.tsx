import React, { useEffect, useRef } from 'react'

interface OutputLogProps {
  output: string[]
  error: string | null
}

export const OutputLog: React.FC<OutputLogProps> = ({ output, error }) => {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="output-log-container">
      <h3>Output</h3>
      <div className="output-log" ref={logRef}>
        {output.map((line, index) => (
          <div key={index} className="output-line">
            {line}
          </div>
        ))}
        {error && <div className="output-line error">{error}</div>}
        {output.length === 0 && !error && (
          <div className="output-line placeholder">
            Output will appear here when sync starts...
          </div>
        )}
      </div>
    </div>
  )
}
