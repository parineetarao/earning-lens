import { theme } from '../theme'

function formatDeltaValue(delta, direction) {
  if (!Number.isFinite(delta)) {
    return direction === 'increased' ? '+0' : '0'
  }

  if (direction === 'increased') {
    return `+${delta}`
  }

  return `${delta}`
}

function VocabRow({ entry, direction }) {
  const deltaColor = direction === 'increased' ? theme.colors.positive : theme.colors.negative
  const deltaValue = formatDeltaValue(entry?.delta, direction)
  const hasCounts = Number.isFinite(entry?.prior) || Number.isFinite(entry?.current)

  return (
    <div
      style={{
        padding: '7px 0',
        borderBottom: `0.5px solid ${theme.colors.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            color: '#000000',
            fontFamily: 'Space Mono, monospace',
            lineHeight: 1.35,
            wordBreak: 'break-word',
          }}
        >
          {entry?.word || '--'}
        </div>

        <div
          style={{
            fontSize: '11px',
            color: deltaColor,
            fontFamily: 'Space Mono, monospace',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {deltaValue}
        </div>
      </div>

      {hasCounts ? (
        <div
          style={{
            marginTop: '3px',
            fontSize: '10px',
            color: theme.colors.textMuted,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.4,
          }}
        >
          prior:
          {' '}
          {Number.isFinite(entry?.prior) ? entry.prior : '--'}
          {' '}
          → now:
          {' '}
          {Number.isFinite(entry?.current) ? entry.current : '--'}
        </div>
      ) : null}
    </div>
  )
}

function Section({ title, direction, entries }) {
  const headerColor = direction === 'increased' ? theme.colors.positive : theme.colors.negative
  const icon = direction === 'increased' ? '▲' : '▼'

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          marginBottom: '10px',
          fontSize: '10px',
          color: headerColor,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.06em',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {icon}
        {' '}
        {title}
      </div>

      <div>
        {entries.map((entry) => (
          <VocabRow
            key={`${direction}-${entry?.word || 'word'}-${entry?.delta ?? '0'}`}
            entry={entry}
            direction={direction}
          />
        ))}
      </div>
    </div>
  )
}

export default function VocabDelta({ vocabDelta, currentQuarter, priorQuarter }) {
  const increased = Array.isArray(vocabDelta?.increased) ? vocabDelta.increased : []
  const decreased = Array.isArray(vocabDelta?.decreased) ? vocabDelta.decreased : []
  const hasData = increased.length > 0 || decreased.length > 0

  return (
    <div style={{ padding: '20px 0' }}>
      <div
        style={{
          marginBottom: '8px',
          fontSize: '10px',
          color: theme.colors.textTertiary,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.08em',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        VOCABULARY SHIFT
      </div>

      {hasData ? (
        <>
          <div
            style={{
              marginBottom: '16px',
              fontSize: '11px',
              color: theme.colors.textSecondary,
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5,
            }}
          >
            Words that changed most in frequency:
            {' '}
            {currentQuarter || 'current quarter'}
            {' '}
            vs
            {' '}
            {priorQuarter}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <Section title="INCREASED" direction="increased" entries={increased} />
            <Section title="DECREASED" direction="decreased" entries={decreased} />
          </div>
        </>
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '32px',
              marginBottom: '12px',
              opacity: 0.2,
            }}
          >
            δ
          </div>
          <div
            style={{
              fontSize: '13px',
              color: theme.colors.textMuted,
              marginBottom: '6px',
            }}
          >
            No vocabulary comparison available
          </div>
          <div
            style={{
              fontSize: '11px',
              color: theme.colors.textMuted,
              fontFamily: 'Space Mono',
              lineHeight: 1.6,
              maxWidth: '320px',
              margin: '0 auto',
            }}
          >
            Vocabulary delta requires two consecutive quarters of transcript data.
            {' '}
            Process {priorQuarter || 'the prior quarter'} to enable this feature.
          </div>
        </div>
      )}
    </div>
  )
}