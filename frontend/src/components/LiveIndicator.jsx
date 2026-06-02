import { useEffect, useState } from 'react'

import useProcessingStatus from '../hooks/useProcessingStatus'
import { theme } from '../theme'

export default function LiveIndicator({ companyId, quarterId }) {
  const { status, sentencesProcessed, totalSentences } = useProcessingStatus(companyId, quarterId)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    if (status !== 'complete') {
      setIsHidden(false)
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setIsHidden(true)
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [status])

  if (status === null || (status === 'complete' && isHidden)) {
    return null
  }

  if (status === 'running') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: theme.colors.positive,
            animation: 'live-indicator-pulse 1s infinite',
          }}
        />
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '11px',
            color: theme.colors.positive,
            lineHeight: 1,
          }}
        >
          Processing — {sentencesProcessed} / {totalSentences} sentences
        </span>

        <style>{`\n          @keyframes live-indicator-pulse {\n            0%, 100% {\n              opacity: 1;\n            }\n            50% {\n              opacity: 0.3;\n            }\n          }\n        `}</style>
      </div>
    )
  }

  if (status === 'complete') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            color: theme.colors.positive,
            fontSize: '12px',
            lineHeight: 1,
          }}
        >
          ✓
        </span>
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '11px',
            color: theme.colors.positive,
            lineHeight: 1,
          }}
        >
          Complete
        </span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: '11px',
          color: theme.colors.negative,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        ✗ Processing error
      </div>
    )
  }

  return null
}