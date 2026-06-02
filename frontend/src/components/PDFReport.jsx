import { forwardRef } from 'react'

const PDFReport = forwardRef(function PDFReport({
  companyName,
  companyId,
  quarterId,
  overallScore,
  priorScore,
  aspectScores,
  analyticsBrief,
  sentences,
  qaSplit,
  vocabDelta,
  sectorAverageScore,
  peerRelativeScore,
  peerRelativeLabel,
}, ref) {

  const quarterLabel = quarterId?.replace('_', ' ')
  const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  const scoreColor = (s) =>
    s >= 0.60 ? '#059669' : s >= 0.45 ? '#D97706' : '#DC2626'

  const aspects = ['revenue', 'margins', 'guidance', 'competition', 'macro']

  // Get top 2 most negative sentences per aspect for key quotes
  const getTopNegative = (aspect) =>
    sentences
      .filter(s => s.aspect === aspect && s.sentiment === 'negative')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2)

  return (
    <div
      ref={ref}
      style={{
        width: '794px',           // A4 width at 96dpi
        minHeight: '1123px',      // A4 height at 96dpi
        background: '#FFFFFF',
        fontFamily: 'Inter, sans-serif',
        color: '#111827',
        padding: '48px',
        boxSizing: 'border-box',
        fontSize: '12px',
        lineHeight: 1.6,
      }}
    >
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: '20px',
        borderBottom: '2px solid #0C1628',
        marginBottom: '28px',
      }}>
        <div>
          {/* EL Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '24px', height: '24px', background: '#C8922A',
              borderRadius: '4px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '9px', fontWeight: 700,
              color: '#FFFFFF', fontFamily: 'Space Mono, monospace',
            }}>EL</div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0C1628' }}>EarningLens</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0C1628', lineHeight: 1.2 }}>
            {companyName}
          </div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '3px', fontFamily: 'Space Mono, monospace' }}>
            {companyId} · {quarterLabel} Earnings Call Analysis
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontFamily: 'Space Mono, monospace' }}>
            OVERALL SENTIMENT
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: scoreColor(overallScore), fontFamily: 'Space Mono, monospace', lineHeight: 1 }}>
            {overallScore?.toFixed(2)}
          </div>
          {priorScore && (
            <div style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', marginTop: '4px', color: overallScore > priorScore ? '#059669' : '#DC2626' }}>
              {overallScore > priorScore ? '↑' : '↓'} {Math.abs(overallScore - priorScore).toFixed(2)} vs prior quarter
            </div>
          )}
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '8px' }}>
            Generated {now} · EarningLens
          </div>
        </div>
      </div>

      {/* ANALYST BRIEF */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
          ANALYST BRIEF
        </div>
        <div style={{
          borderLeft: '3px solid #C8922A',
          paddingLeft: '16px',
          background: '#FFFBF0',
          padding: '14px 14px 14px 16px',
          borderRadius: '0 6px 6px 0',
          fontSize: '12px',
          color: '#374151',
          lineHeight: 1.8,
        }}>
          {analyticsBrief || 'Analyst brief not available.'}
        </div>
      </div>

      {/* ASPECT SCORES */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Space Mono, monospace', marginBottom: '12px' }}>
          ASPECT BREAKDOWN · {quarterLabel}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {aspects.map(aspect => {
            const s = aspectScores?.[aspect]
            if (!s) return null
            return (
              <div key={aspect} style={{
                background: '#F8FAFC',
                border: '1px solid #E4E7EE',
                borderRadius: '6px',
                padding: '10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
                  {aspect}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: scoreColor(s.score), fontFamily: 'Space Mono, monospace' }}>
                  {s.score.toFixed(2)}
                </div>
                <div style={{ marginTop: '6px', height: '4px', background: '#E4E7EE', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.score * 100}%`, background: scoreColor(s.score), borderRadius: '2px' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* KEY QUOTES */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Space Mono, monospace', marginBottom: '12px' }}>
          KEY NEGATIVE SIGNALS
        </div>
        {aspects.map(aspect => {
          const quotes = getTopNegative(aspect)
          if (quotes.length === 0) return null
          return (
            <div key={aspect} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                {aspect}
              </div>
              {quotes.map((q, i) => (
                <div key={i} style={{
                  borderLeft: '2px solid #FECACA',
                  paddingLeft: '10px',
                  marginBottom: '4px',
                  fontSize: '11px',
                  color: '#374151',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}>
                  "{q.text.slice(0, 180)}{q.text.length > 180 ? '...' : ''}"
                  <span style={{ color: '#9CA3AF', fontStyle: 'normal', fontFamily: 'Space Mono, monospace', fontSize: '10px', marginLeft: '6px' }}>
                    conf: {q.confidence.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Q&A SPLIT + PEER SCORE (two columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Q&A Split */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E4E7EE', borderRadius: '6px', padding: '14px' }}>
          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
            PREPARED vs Q&A
          </div>
          {qaSplit?.boundary_found ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#374151' }}>Prepared remarks</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: scoreColor(qaSplit.prepared_score) }}>{qaSplit.prepared_score?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: '#374151' }}>Q&A session</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: scoreColor(qaSplit.qa_score) }}>{qaSplit.qa_score?.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: qaSplit.gap > 0.15 ? '#DC2626' : '#374151' }}>
                Gap: {qaSplit.gap > 0 ? '+' : ''}{qaSplit.gap?.toFixed(2)}
                {qaSplit.gap > 0.15 && ' ⚠'}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>Q&A boundary not detected.</div>
          )}
        </div>

        {/* Peer score */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E4E7EE', borderRadius: '6px', padding: '14px' }}>
          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
            PEER COMPARISON
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#374151' }}>This company</span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: scoreColor(overallScore) }}>{overallScore?.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#374151' }}>Sector average</span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#374151' }}>{sectorAverageScore?.toFixed(2) || '—'}</span>
          </div>
          {peerRelativeScore != null && (
            <div style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: peerRelativeScore > 0 ? '#059669' : '#DC2626' }}>
              {peerRelativeScore > 0 ? '+' : ''}{peerRelativeScore.toFixed(2)} vs peers · {peerRelativeLabel?.replace('_', ' ')}
            </div>
          )}
        </div>
      </div>

      {/* VOCAB DELTA */}
      {vocabDelta && (vocabDelta.increased?.length > 0 || vocabDelta.decreased?.length > 0) && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Space Mono, monospace', marginBottom: '12px' }}>
            VOCABULARY SHIFT vs PRIOR QUARTER
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#DC2626', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>▲ INCREASED</div>
              {(vocabDelta.increased || []).slice(0, 5).map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #F3F4F6', fontSize: '11px' }}>
                  <span style={{ color: '#374151', fontFamily: 'Space Mono, monospace' }}>{w.word}</span>
                  <span style={{ color: '#DC2626', fontFamily: 'Space Mono, monospace' }}>+{w.delta}×</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#059669', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>▼ DECREASED</div>
              {(vocabDelta.decreased || []).slice(0, 5).map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #F3F4F6', fontSize: '11px' }}>
                  <span style={{ color: '#374151', fontFamily: 'Space Mono, monospace' }}>{w.word}</span>
                  <span style={{ color: '#059669', fontFamily: 'Space Mono, monospace' }}>{w.delta}×</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{
        borderTop: '1px solid #E4E7EE',
        paddingTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#9CA3AF',
        fontFamily: 'Space Mono, monospace',
      }}>
        <span>EarningLens · earninglens.vercel.app</span>
        <span>Sentiment analysis via FinBERT · AI briefs via Groq LLaMA 3.1</span>
        <span>Generated {now}</span>
      </div>
    </div>
  )
})

export default PDFReport
