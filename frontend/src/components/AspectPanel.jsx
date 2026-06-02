import { theme } from '../theme'

const ASPECT_ORDER = ['revenue', 'margins', 'guidance', 'competition', 'macro']

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

function formatScore(score, digits = 2) {
  return Number.isFinite(score) ? score.toFixed(digits) : '--'
}

function getMostNegativeQuote(sentences, aspect) {
  if (!Array.isArray(sentences) || !aspect) {
    return ''
  }

  const mostNegative = sentences
    .filter((sentence) => sentence?.aspect === aspect && sentence?.sentiment === 'negative' && typeof sentence?.text === 'string')
    .sort((left, right) => {
      const leftConfidence = Number.isFinite(left?.confidence) ? left.confidence : -Infinity
      const rightConfidence = Number.isFinite(right?.confidence) ? right.confidence : -Infinity

      return rightConfidence - leftConfidence
    })[0]

  if (!mostNegative?.text) {
    return ''
  }

  const trimmed = mostNegative.text.trim()

  if (trimmed.length <= 90) {
    return trimmed
  }

  return `${trimmed.slice(0, 90).trimEnd()}...`
}

function capitalizeAspect(aspect) {
  if (!aspect) {
    return ''
  }

  return aspect.charAt(0).toUpperCase() + aspect.slice(1)
}

export default function AspectPanel({
  aspectScores = {},
  sentences = [],
  overallScore,
  peerRelativeScore,
  sectorAverageScore,
  qaSplit,
}) {
  const overallColor = getScoreColor(overallScore)
  const hasPeerRelativeScore = peerRelativeScore !== null && peerRelativeScore !== undefined && Number.isFinite(peerRelativeScore)
  const hasSectorAverage = sectorAverageScore !== null && sectorAverageScore !== undefined && Number.isFinite(sectorAverageScore)
  const hasQASplit = Boolean(qaSplit?.boundary_found)
  const peerDirection = peerRelativeScore > 0 ? 'above' : peerRelativeScore < 0 ? 'below' : 'in line with'
  const peerDirectionColor = peerDirection === 'above' ? theme.colors.positive : peerDirection === 'below' ? theme.colors.negative : theme.colors.textMuted

  return (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        backgroundColor: theme.colors.bgSurface,
        borderLeft: `1px solid ${theme.colors.border}`,
        overflowY: 'auto',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '10px',
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              OVERALL
            </div>
            <div
              style={{
                marginTop: '6px',
                fontFamily: theme.fonts.mono,
                fontSize: '28px',
                fontWeight: 700,
                color: overallColor,
                lineHeight: 1,
              }}
            >
              {formatScore(overallScore)}
            </div>
          </div>

          {hasPeerRelativeScore ? (
            <div>
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '10px',
                  color: theme.colors.textTertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                }}
              >
                VS SECTOR
              </div>
              <div
                style={{
                  marginTop: '6px',
                  fontFamily: theme.fonts.mono,
                  fontSize: '12px',
                  color: peerDirectionColor,
                  lineHeight: 1.2,
                }}
              >
                {`${peerDirection} sector avg by ${Math.abs(peerRelativeScore).toFixed(2)}`}
              </div>
              <div
                style={{
                  marginTop: '6px',
                  fontFamily: theme.fonts.mono,
                  fontSize: '10px',
                  color: theme.colors.textTertiary,
                  lineHeight: 1,
                }}
              >
                sector avg: {hasSectorAverage ? sectorAverageScore.toFixed(2) : '--'}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div
        style={{
          margin: '16px 0',
          height: '1px',
          backgroundColor: theme.colors.border,
        }}
      />

      <section>
        <div
          style={{
            fontSize: '10px',
            color: theme.colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
            lineHeight: 1,
            fontFamily: theme.fonts.mono,
          }}
        >
          ASPECTS
        </div>

        {ASPECT_ORDER.map((aspect) => {
          const aspectData = aspectScores?.[aspect] || {}
          const score = aspectData?.score
          const scoreColor = getScoreColor(score)
          const negativeQuote = getMostNegativeQuote(sentences, aspect)

          return (
            <div
              key={aspect}
              style={{
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    lineHeight: 1.2,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {capitalizeAspect(aspect)}
                </span>
                <span
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: '12px',
                    color: scoreColor,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatScore(score)}
                </span>
              </div>

              <div
                style={{
                  marginTop: '5px',
                  width: '100%',
                  height: '3px',
                  backgroundColor: theme.colors.border,
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Number.isFinite(score) ? Math.max(0, Math.min(1, score)) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: scoreColor,
                    borderRadius: '2px',
                  }}
                />
              </div>

              {negativeQuote ? (
                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '11px',
                    color: theme.colors.textMuted,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {negativeQuote}
                </div>
              ) : null}
            </div>
          )
        })}
      </section>

      <div
        style={{
          margin: '16px 0',
          height: '1px',
          backgroundColor: theme.colors.border,
        }}
      />

      <section>
        {hasQASplit ? (
          <>
            <div
              style={{
                fontSize: '10px',
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                lineHeight: 1,
                fontFamily: theme.fonts.mono,
              }}
            >
              Q&amp;A SPLIT
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: theme.colors.textSecondary, lineHeight: 1.2, fontFamily: theme.fonts.body }}>Prepared</span>
                <span
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    lineHeight: 1,
                  }}
                >
                  {formatScore(qaSplit?.prepared_score)}
                </span>
              </div>

              <div
                style={{
                  marginTop: '5px',
                  width: '100%',
                  height: '3px',
                  backgroundColor: theme.colors.border,
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Number.isFinite(qaSplit?.prepared_score) ? Math.max(0, Math.min(1, qaSplit.prepared_score)) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: theme.colors.amber,
                    borderRadius: '2px',
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: '4px',
                  fontSize: '10px',
                  color: theme.colors.textTertiary,
                  lineHeight: 1.2,
                  fontFamily: theme.fonts.mono,
                }}
              >
                {formatScore(qaSplit?.prepared_count, 0)} sentences
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: theme.colors.textSecondary, lineHeight: 1.2, fontFamily: theme.fonts.body }}>Q&amp;A</span>
                <span
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    lineHeight: 1,
                  }}
                >
                  {formatScore(qaSplit?.qa_score)}
                </span>
              </div>

              <div
                style={{
                  marginTop: '5px',
                  width: '100%',
                  height: '3px',
                  backgroundColor: theme.colors.border,
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Number.isFinite(qaSplit?.qa_score) ? Math.max(0, Math.min(1, qaSplit.qa_score)) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: theme.colors.textMuted,
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '11px',
                color: qaSplit?.gap > 0.15 ? theme.colors.negative : theme.colors.textMuted,
                lineHeight: 1.4,
              }}
            >
              Gap: {qaSplit?.gap > 0 ? '+' : ''}
              {Number.isFinite(qaSplit?.gap) ? qaSplit.gap.toFixed(2) : '--'}
              {qaSplit?.gap > 0.15 ? ' ⚠ perception gap' : ''}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: '11px',
              color: theme.colors.textMuted,
              lineHeight: 1.5,
              fontFamily: theme.fonts.body,
            }}
          >
            Q&amp;A boundary not detected
          </div>
        )}
      </section>
    </aside>
  )
}