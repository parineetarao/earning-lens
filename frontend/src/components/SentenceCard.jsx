import { useState } from 'react'

import { theme } from '../theme'

export default function SentenceCard({ sentence, showAspect = true }) {
  const [isHovered, setIsHovered] = useState(false)

  const sentiment = sentence?.sentiment === 'positive' || sentence?.sentiment === 'negative' ? sentence.sentiment : 'neutral'

  const sentimentStyles = {
    positive: {
      borderColor: theme.colors.positive,
      backgroundColor: 'rgba(5,150,105,0.03)',
      hoverBackgroundColor: 'rgba(5,150,105,0.07)',
      confidenceColor: theme.colors.positive,
    },
    negative: {
      borderColor: theme.colors.negative,
      backgroundColor: 'rgba(220,38,38,0.04)',
      hoverBackgroundColor: 'rgba(220,38,38,0.07)',
      confidenceColor: theme.colors.negative,
    },
    neutral: {
      borderColor: theme.colors.neutralBorder,
      backgroundColor: 'transparent',
      hoverBackgroundColor: theme.colors.neutralBg,
      confidenceColor: theme.colors.textMuted,
    },
  }

  const activeStyles = sentimentStyles[sentiment]
  const aspectLabel = (sentence?.aspect || 'GENERAL').toUpperCase()
  const confidenceValue = Number.isFinite(sentence?.confidence) ? sentence.confidence.toFixed(2) : '--'

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '9px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        cursor: 'default',
        transition: 'background-color 150ms ease',
        position: 'relative',
        backgroundColor: isHovered ? activeStyles.hoverBackgroundColor : activeStyles.backgroundColor,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: activeStyles.borderColor,
        }}
      />

      <div
        style={{
          flex: 1,
          paddingLeft: '12px',
          color: theme.colors.textPrimary,
          fontSize: '13px',
          lineHeight: 1.7,
          fontFamily: theme.fonts.body,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {sentence?.text || ''}
      </div>

      {isHovered ? (
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: theme.colors.bgSurface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            padding: '4px 10px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {showAspect ? (
            <span
              style={{
                fontSize: '10px',
                color: theme.colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: theme.fonts.mono,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {aspectLabel}
            </span>
          ) : null}

          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '10px',
              color: activeStyles.confidenceColor,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {confidenceValue}
          </span>
        </div>
      ) : null}
    </div>
  )
}