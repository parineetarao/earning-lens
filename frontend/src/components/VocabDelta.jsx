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
  const deltaColor = direction === 'increased' ? '#2ECC87' : '#FF4757'
  const deltaValue = formatDeltaValue(entry?.delta, direction)
  const hasCounts = Number.isFinite(entry?.prior) || Number.isFinite(entry?.current)

  return (
    <div
      style={{
        padding: '7px 0',
        borderBottom: '0.5px solid #1E2E26',
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
            color: '#E8F0EB',
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
            color: '#4A6354',
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
  const headerColor = direction === 'increased' ? '#2ECC87' : '#FF4757'
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
          color: '#4A6354',
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
              color: '#4A6354',
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
              color: '#4A6354',
              marginBottom: '6px',
            }}
          >
            No vocabulary comparison available
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#4A6354',
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