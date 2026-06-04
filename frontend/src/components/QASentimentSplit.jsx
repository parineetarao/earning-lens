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

function clampScore(score) {
  if (!Number.isFinite(score)) {
    return 0
  }

  return Math.max(0, Math.min(1, score))
}

function formatGap(gap) {
  if (!Number.isFinite(gap)) {
    return '--'
  }

  return `${gap >= 0 ? '+' : ''}${gap.toFixed(2)}`
}

function getGapColor(gap) {
  if (!Number.isFinite(gap)) {
    return theme.colors.textSecondary
  }

  if (gap > 0.15) {
    return theme.colors.negative
  }

  if (gap > 0.08) {
    return theme.colors.warning
  }

  return theme.colors.positive
}

function ScoreBlock({ label, score, count, fillColor }) {
  const scoreColor = getScoreColor(score)
  const normalizedScore = clampScore(score)

  return (
    <div
      style={{
        backgroundColor: theme.colors.bgPrimary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '6px',
        padding: '16px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: theme.colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px',
          lineHeight: 1,
          fontFamily: theme.fonts.mono,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '28px',
          fontWeight: 700,
          color: scoreColor,
          lineHeight: 1,
        }}
      >
        {Number.isFinite(score) ? score.toFixed(2) : '--'}
      </div>

      <div
        style={{
          marginTop: '4px',
          fontSize: '11px',
          color: theme.colors.textMuted,
          lineHeight: 1.2,
        }}
      >
        {Number.isFinite(count) ? `${count} sentences` : '-- sentences'}
      </div>

      <div
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '2px',
          backgroundColor: theme.colors.border,
          marginTop: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${normalizedScore * 100}%`,
            height: '100%',
            borderRadius: '2px',
            backgroundColor: fillColor,
          }}
        />
      </div>
    </div>
  )
}

export default function QASentimentSplit({ qaSplit }) {
  const boundaryFound = Boolean(qaSplit?.boundary_found)
  const gap = qaSplit?.gap
  const gapColor = getGapColor(gap)

  return (
    <section style={{ padding: '20px 0' }}>
      <div
        style={{
          fontSize: '10px',
          color: theme.colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '16px',
          lineHeight: 1,
          fontFamily: theme.fonts.mono,
        }}
      >
        Q&amp;A SENTIMENT SPLIT
      </div>

      {!boundaryFound ? (
        <div
          style={{
            fontSize: '12px',
            color: theme.colors.textMuted,
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}
        >
          Q&amp;A boundary not detected in this transcript.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: '12px',
              color: theme.colors.textSecondary,
              lineHeight: 1.6,
              marginBottom: '20px',
            }}
          >
            Prepared remarks are scripted. The Q&amp;A reveals what management is actually worried about.
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <ScoreBlock
              label="PREPARED REMARKS"
              score={qaSplit?.prepared_score}
              count={qaSplit?.prepared_count}
              fillColor={theme.colors.positive}
            />

            <ScoreBlock
              label="Q&A SESSION"
              score={qaSplit?.qa_score}
              count={qaSplit?.qa_count}
              fillColor={theme.colors.amber}
            />
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '20px',
                color: gapColor,
                lineHeight: 1.2,
              }}
            >
              Gap: {formatGap(gap)}
            </div>

            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                lineHeight: 1.6,
                color: theme.colors.textSecondary,
              }}
            >
              {Number.isFinite(gap) && gap > 0.15
                ? 'Management is significantly more positive in scripted remarks than under analyst questioning. This gap signals perception management.'
                : Number.isFinite(gap) && gap > 0.08
                  ? 'Moderate gap between scripted and unscripted tone. Worth monitoring.'
                  : 'Tone is consistent between prepared remarks and Q&A — management credibility signal.'}
            </div>
          </div>
        </>
      )}
    </section>
  )
}