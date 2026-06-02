import { theme } from '../theme'

function getScoreColor(score) {
  if (!Number.isFinite(score)) {
    return theme.colors.textSecondary
  }

  if (score >= 0.6) {
    return theme.colors.positive
  }

  if (score >= 0.45) {
    return theme.colors.warning
  }

  return theme.colors.negative
}

function formatDelta(delta) {
  const value = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)
  return value
}

export default function AnalystBrief({ brief, companyName, quarterId, overallScore, priorScore }) {
  const normalizedBrief = typeof brief === 'string' ? brief.trim() : ''
  const hasBrief = normalizedBrief && normalizedBrief !== 'Brief unavailable'
  const scoreColor = getScoreColor(overallScore)
  const hasPriorScore = priorScore !== null && Number.isFinite(priorScore)
  const delta = hasPriorScore ? overallScore - priorScore : null
  const paragraphs = hasBrief
    ? normalizedBrief.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : []

  return (
    <section
      style={{
        backgroundColor: theme.colors.bgPrimary,
        border: `1px solid ${theme.colors.border}`,
        borderLeft: `2px solid ${theme.colors.amber}`,
        borderRadius: '0 8px 8px 0',
        padding: '16px 20px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '10px',
              color: theme.colors.amber,
              letterSpacing: '0.1em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            ANALYST BRIEF
          </span>
          <span
            style={{
              marginLeft: '10px',
              fontFamily: theme.fonts.body,
              fontSize: '12px',
              color: theme.colors.textMuted,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {companyName || 'Unknown company'}
            {' '}
            ·
            {' '}
            {quarterId || 'Unknown quarter'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '24px',
              fontWeight: 700,
              color: scoreColor,
              lineHeight: 1,
            }}
          >
            {Number.isFinite(overallScore) ? overallScore.toFixed(2) : '--'}
          </span>

          {hasPriorScore ? (
            <span
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '12px',
                color: delta >= 0 ? theme.colors.positive : theme.colors.negative,
                lineHeight: 1,
              }}
            >
              {formatDelta(delta)}
            </span>
          ) : null}
        </div>
      </div>

      {hasBrief ? (
        <div>
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${quarterId || 'quarter'}-${index}`}
              style={{
                fontFamily: theme.fonts.body,
                fontSize: '13px',
                color: theme.colors.textSecondary,
                lineHeight: 1.8,
                marginBottom: index === paragraphs.length - 1 ? '0' : '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {paragraph}
            </p>
          ))}
          <div
            style={{
              marginTop: '10px',
              fontFamily: theme.fonts.mono,
              fontSize: '11px',
              color: theme.colors.amber,
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
          >
            Read full brief ↓
          </div>
        </div>
      ) : (
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: '13px',
            color: theme.colors.textMuted,
            fontStyle: 'italic',
            lineHeight: 1.8,
          }}
        >
          Analyst brief not available for this quarter.
        </div>
      )}
    </section>
  )
}
