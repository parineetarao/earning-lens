import { useState } from 'react'

import { theme } from '../theme'

export default function SentenceCard({ sentence, showAspect = true, isHighlighted = false }) {
  const [isHovered, setIsHovered] = useState(false)

  const sentiment = sentence?.sentiment === 'positive' || sentence?.sentiment === 'negative' ? sentence.sentiment : 'neutral'

  const sentimentStyles = {
    positive: {
      borderColor: isHighlighted ? '#C8922A' : theme.colors.positive,
      backgroundColor: isHighlighted ? 'rgba(200,146,42,0.08)' : 'rgba(5,150,105,0.03)',
      hoverBackgroundColor: isHighlighted ? 'rgba(200,146,42,0.12)' : 'rgba(5,150,105,0.07)',
      confidenceColor: theme.colors.positive,
    },
    negative: {
      borderColor: isHighlighted ? '#C8922A' : theme.colors.negative,
      backgroundColor: isHighlighted ? 'rgba(200,146,42,0.08)' : 'rgba(220,38,38,0.04)',
      hoverBackgroundColor: isHighlighted ? 'rgba(200,146,42,0.12)' : 'rgba(220,38,38,0.07)',
      confidenceColor: theme.colors.negative,
    },
    neutral: {
      borderColor: isHighlighted ? '#C8922A' : theme.colors.neutralBorder,
      backgroundColor: isHighlighted ? 'rgba(200,146,42,0.08)' : 'transparent',
      hoverBackgroundColor: isHighlighted ? 'rgba(200,146,42,0.12)' : theme.colors.neutralBg,
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
        transition: 'all 150ms ease',
        position: 'relative',
        backgroundColor: isHovered ? activeStyles.hoverBackgroundColor : activeStyles.backgroundColor,
        outline: isHighlighted ? '2px solid #C8922A' : 'none',
        outlineOffset: '-2px',
        zIndex: isHighlighted ? 1 : 0,
        animation: isHighlighted ? 'highlightPulse 600ms ease-out' : 'none',
      }}
    >
      <style>{`
        @keyframes highlightPulse {
          0%   { box-shadow: 0 0 0 0 rgba(200,146,42,0.4); }
          50%  { box-shadow: 0 0 0 6px rgba(200,146,42,0.1); }
          100% { box-shadow: 0 0 0 0 rgba(200,146,42,0); }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: isHighlighted ? '4px' : '3px',
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
          paddingRight: isHighlighted ? '70px' : '0',
        }}
      >
        {sentence?.text || ''}
      </div>

      {isHighlighted && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '8px',
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '3px',
            padding: '1px 6px',
            fontSize: '9px',
            fontFamily: theme.fonts.mono,
            color: '#78350F',
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        >
          RELEVANT
        </div>
      )}

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