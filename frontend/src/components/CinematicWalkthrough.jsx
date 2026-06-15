import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'

// ─── Scene content renderer ───────────────────────────────────────
function SceneContent({ sceneId, typedText, briefText, showAnswer, showDropdown, nearTarget }) {
  const isTranscript = [
    'transcript','brief-loading','brief-typing',
    'ask-focused','answer-loading','answer-shown',
    'trajectory','vocab','qa-split',
    'pdf-downloading','pdf-done',
  ].includes(sceneId)

  const isSectors = sceneId === 'sectors'

  // ── HEADER (always visible) ──────────────────────────────────
  const header = (
    <div style={{
      height: 30, background: '#0C1628',
      display: 'flex', alignItems: 'center',
      padding: '0 12px', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 14, height: 14, background: '#C8922A',
          borderRadius: 3, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 7, fontWeight: 700,
          color: '#fff', fontFamily: 'Space Mono, monospace',
        }}>EL</div>
        <span style={{ fontSize: 9, color: '#fff', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
          EarningLens
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 8, color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
        <span>Home</span>
        <span style={{ color: sceneId === 'sectors' ? '#C8922A' : 'rgba(255,255,255,0.55)' }}>Sectors</span>
      </div>
    </div>
  )

  // ── LANDING PAGE ──────────────────────────────────────────────
  if (!isTranscript && !isSectors) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {header}
        {/* Hero */}
        <div style={{ display: 'flex', flex: 1, padding: '14px 18px', background: '#fff', gap: 12 }}>
          {/* Left */}
          <div style={{ width: '44%' }}>
            <div style={{
              display: 'inline-block', background: '#FEF3C7',
              border: '1px solid #FCD34D', borderRadius: 3,
              padding: '2px 7px', fontSize: 6,
              color: '#C8922A', fontFamily: 'Space Mono, monospace',
              marginBottom: 8,
            }}>● LIVE · 259 TRANSCRIPTS</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0C1628', lineHeight: 1.2, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
              Tracking management<br />narratives.
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C8922A', lineHeight: 1.2, fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
              Across every quarter.
            </div>
            <div style={{ fontSize: 7, color: '#374151', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', maxWidth: 200, marginBottom: 10 }}>
              A structured view of how management thinking evolves across businesses, sectors, and market conditions.
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <div style={{ background: '#0C1628', color: '#fff', fontSize: 7, padding: '4px 10px', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>
                Explore Companies →
              </div>
              <div style={{ border: '1px solid #E4E7EE', color: '#374151', fontSize: 7, padding: '4px 10px', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>
                View Sector Intelligence
              </div>
            </div>
          </div>
          {/* Right — product mock */}
          <div style={{
            flex: 1, border: '1px solid #E4E7EE', borderRadius: 5,
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
          }}>
            {/* Sidebar */}
            <div style={{ width: 70, background: '#F8FAFC', borderRight: '1px solid #E4E7EE', padding: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: '#0C1628', fontFamily: 'Space Mono, monospace' }}>TCS</div>
              <div style={{ fontSize: 6, color: '#6B7280', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Tata Consultancy</div>
              {[
                { q: 'Q4 FY25', s: '0.74', active: true },
                { q: 'Q3 FY25', s: '0.68' },
                { q: 'Q2 FY25', s: '0.61' },
                { q: 'Q1 FY25', s: '0.48', drift: true },
                { q: 'Q4 FY24', s: '0.66' },
              ].map(({ q, s, active, drift }) => (
                <div key={q} style={{
                  padding: '4px 5px', borderRadius: 3, marginBottom: 2,
                  background: active ? '#FEF3C7' : 'transparent',
                  borderLeft: active ? '2px solid #C8922A' : '2px solid transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 6, color: '#374151', fontFamily: 'Space Mono, monospace' }}>{q}</span>
                    <span style={{ fontSize: 6, color: drift ? '#DC2626' : '#059669', fontFamily: 'Space Mono, monospace' }}>{s}</span>
                  </div>
                  {drift && <div style={{ fontSize: 5, color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>⚠ Guidance drift</div>}
                </div>
              ))}
            </div>
            {/* Content */}
            <div style={{ flex: 1, padding: 6 }}>
              <div style={{ fontSize: 6, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Analyst Brief
              </div>
              <div style={{ fontSize: 6, color: '#374151', lineHeight: 1.5, fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
                Management tone constructive at 0.74, up from 0.68. Revenue led at 0.81 driven by BFSI momentum.
              </div>
              {[
                { type: 'pos', text: 'Strong revenue growth of 13.2% in CC terms.' },
                { type: 'neu', text: 'Board approved final dividend of ₹28 per share.' },
                { type: 'neg', text: 'Margin headwinds from wage increases persist.' },
              ].map(({ type, text }, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 5, alignItems: 'flex-start',
                  padding: '3px 0', borderBottom: '1px solid #F3F4F6',
                  borderLeft: `2px solid ${type === 'pos' ? '#059669' : type === 'neg' ? '#DC2626' : 'transparent'}`,
                  background: type === 'pos' ? 'rgba(5,150,105,0.03)' : type === 'neg' ? 'rgba(220,38,38,0.04)' : 'transparent',
                  paddingLeft: 5,
                }}>
                  <span style={{
                    fontSize: 5, padding: '1px 3px', borderRadius: 2, flexShrink: 0,
                    fontFamily: 'Space Mono, monospace',
                    color: type === 'pos' ? '#059669' : type === 'neg' ? '#DC2626' : '#6B7280',
                    background: type === 'pos' ? '#ECFDF5' : type === 'neg' ? '#FEF2F2' : '#F9FAFB',
                    border: `0.5px solid ${type === 'pos' ? '#A7F3D0' : type === 'neg' ? '#FECACA' : '#E5E7EB'}`,
                  }}>{type}</span>
                  <span style={{ fontSize: 6, color: '#374151', lineHeight: 1.4, fontFamily: 'Inter, sans-serif' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Stats strip */}
        <div style={{
          background: '#0C1628', height: 26, display: 'flex',
          alignItems: 'center', justifyContent: 'space-around',
          padding: '0 12px', flexShrink: 0,
        }}>
          {['35 COMPANIES', '8 QUARTERS', '65,000+ SENTENCES', '8 SECTORS', '259 TRANSCRIPTS'].map(s => (
            <span key={s} style={{ fontSize: 6, color: 'rgba(255,255,255,0.6)', fontFamily: 'Space Mono, monospace' }}>{s}</span>
          ))}
        </div>
        {/* Search overlay */}
        {(sceneId === 'search-open' || sceneId === 'typing') && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(10,18,40,0.82)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', paddingTop: '18%',
            zIndex: 50,
          }}>
            <div style={{ width: 220, position: 'relative' }}>
              <input
                readOnly
                value={typedText}
                placeholder="Search company — TCS, HDFCBANK..."
                style={{
                  width: '100%', height: 28, background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${typedText ? 'rgba(200,146,42,0.7)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 5, padding: '0 10px',
                  fontSize: 9, color: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
              {showDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: '#fff', borderRadius: 5, marginTop: 3,
                  border: '1px solid #E4E7EE',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                  overflow: 'hidden',
                }}>
                  {[
                    { ticker: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'BANKING', highlight: true },
                    { ticker: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
                    { ticker: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'AUTO' },
                  ].map(({ ticker, name, sector, highlight }) => (
                    <div key={ticker} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '7px 10px',
                      background: highlight ? '#FEF3C7' : 'transparent',
                      borderBottom: '1px solid #F3F4F6',
                    }}>
                      <span style={{ fontSize: 8, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                        <b>{ticker}</b> — {name}
                      </span>
                      <span style={{ fontSize: 7, color: '#C8922A', fontFamily: 'Inter, sans-serif' }}>{sector}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── TRANSCRIPT PAGE ──────────────────────────────────────────
  if (isTranscript) {
    const showTrajectory = sceneId === 'trajectory'
    const showVocab = sceneId === 'vocab'
    const showQA = sceneId === 'qa-split'
    const showPDF = sceneId === 'pdf-downloading' || sceneId === 'pdf-done'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
        {header}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left sidebar */}
          <div style={{ width: '14.8%', background: '#F8FAFC', borderRight: '1px solid #E4E7EE', padding: '6px 0', flexShrink: 0 }}>
            <div style={{ padding: '0 8px 6px', borderBottom: '1px solid #E4E7EE', marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#0C1628', fontFamily: 'Space Mono, monospace' }}>HDFCBANK</div>
              <div style={{ fontSize: 6, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>HDFC Bank</div>
              <div style={{ fontSize: 5, background: '#EFF6FF', color: '#1E3A8A', padding: '1px 4px', borderRadius: 2, display: 'inline-block', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
                BANKING
              </div>
            </div>
            <div style={{ fontSize: 5, color: '#9CA3AF', padding: '3px 8px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              QUARTERS
            </div>
            {[
              { q: 'Q4 FY25', s: '0.76', color: '#059669' },
              { q: 'Q3 FY25', s: '0.73', color: '#D97706', active: true },
              { q: 'Q2 FY25', s: '0.81', color: '#059669' },
              { q: 'Q1 FY25', s: '0.68', color: '#DC2626' },
              { q: 'Q4 FY24', s: '0.79', color: '#059669' },
            ].map(({ q, s, color, active }) => (
              <div key={q} style={{
                padding: '4px 8px',
                background: active ? '#FEF9EC' : 'transparent',
                borderLeft: active ? '2px solid #C8922A' : '2px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 6, color: '#374151', fontFamily: 'Space Mono, monospace' }}>{q}</span>
                  <span style={{ fontSize: 6, color, fontFamily: 'Space Mono, monospace' }}>{s}</span>
                </div>
                <div style={{ height: 2, background: '#F3F4F6', borderRadius: 1, marginTop: 2 }}>
                  <div style={{ height: '100%', width: `${parseFloat(s) * 100}%`, background: color, borderRadius: 1 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Center */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 0 }}>
            {/* Action bar */}
            <div style={{
              height: 28, borderBottom: '1px solid #E4E7EE',
              display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6, flexShrink: 0,
            }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: '#0C1628', fontFamily: 'Inter, sans-serif' }}>Q3 FY25</span>
              <span style={{ fontSize: 6, color: '#9CA3AF', fontFamily: 'Space Mono, monospace' }}>· 509 sentences · 20 pages</span>
              <div style={{ flex: 1 }} />
              {[
                { label: '☆ Watch' },
                { label: '↓ Export PDF', highlight: showPDF },
              ].map(({ label, highlight }) => (
                <div key={label} style={{
                  fontSize: 6, padding: '2px 6px', borderRadius: 3,
                  border: `1px solid ${highlight ? '#C8922A' : '#E4E7EE'}`,
                  color: highlight ? '#C8922A' : '#374151',
                  background: highlight ? '#FFFBF0' : 'transparent',
                  fontFamily: 'Inter, sans-serif',
                }}>{label}</div>
              ))}
              {[
                { id: 'transcript', label: 'Transcript' },
                { id: 'trajectory', label: 'Trajectory' },
                { id: 'vocab', label: 'Vocab Delta' },
                { id: 'qa-split', label: 'Q&A Split' },
              ].map(({ id, label }) => {
                const active = sceneId === id || (id === 'transcript' && !showTrajectory && !showVocab && !showQA && !showPDF)
                return (
                  <div key={id} style={{
                    fontSize: 6, padding: '2px 5px', fontFamily: 'Inter, sans-serif',
                    color: active ? '#C8922A' : '#6B7280',
                    borderBottom: active ? '1.5px solid #C8922A' : '1.5px solid transparent',
                    cursor: 'pointer',
                  }}>{label}</div>
                )
              })}
            </div>

            {/* Main content area */}
            <div style={{ flex: 1, padding: '10px 14px', overflow: 'hidden', position: 'relative' }}>

              {/* Transcript view */}
              {!showTrajectory && !showVocab && !showQA && !showPDF && (
                <>
                  {/* Analyst brief */}
                  <div style={{
                    borderLeft: '2px solid #C8922A', background: '#FFFBF0',
                    padding: '7px 10px', borderRadius: '0 4px 4px 0', marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 5, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        ANALYST BRIEF · Q3 FY25
                      </span>
                      <span style={{ fontSize: 9, color: '#059669', fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>0.73</span>
                    </div>
                    <div style={{ fontSize: 6, color: '#374151', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', minHeight: 36 }}>
                      {briefText || <span style={{ color: '#9CA3AF' }}>Loading analysis...</span>}
                    </div>
                    {briefText.length > 50 && (
                      <div style={{ fontSize: 6, color: '#C8922A', marginTop: 4, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                        Read full brief ↓
                      </div>
                    )}
                  </div>

                  {/* Transcript sentences */}
                  <div style={{ fontSize: 6, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    TRANSCRIPT
                  </div>
                  {[
                    { type: 'pos', text: 'Credit growth has been robust across all segments.' },
                    { type: 'neu', text: 'The board approved a dividend of ₹19.50 per share.' },
                    { type: 'neg', text: 'Credit costs remain elevated in the retail segment.', relevant: showAnswer },
                    { type: 'pos', text: 'CASA ratio stands strong at 47.3%.' },
                    { type: 'neg', text: 'Slippages remain above normalised levels.', relevant: showAnswer },
                  ].map(({ type, text, relevant }, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 5, alignItems: 'flex-start',
                      padding: '4px 0', borderBottom: '1px solid #F3F4F6',
                      borderLeft: `2px solid ${type === 'pos' ? '#059669' : type === 'neg' ? '#DC2626' : 'transparent'}`,
                      background: relevant
                        ? 'rgba(200,146,42,0.07)'
                        : type === 'pos' ? 'rgba(5,150,105,0.02)' : type === 'neg' ? 'rgba(220,38,38,0.03)' : 'transparent',
                      paddingLeft: 5,
                      outline: relevant ? '1.5px solid #C8922A' : 'none',
                      borderRadius: relevant ? 2 : 0,
                      position: 'relative',
                    }}>
                      {relevant && (
                        <div style={{
                          position: 'absolute', top: 2, right: 4,
                          fontSize: 4, background: '#FEF3C7', color: '#78350F',
                          border: '0.5px solid #FCD34D', borderRadius: 2, padding: '1px 3px',
                          fontFamily: 'Space Mono, monospace',
                        }}>RELEVANT</div>
                      )}
                      <span style={{
                        fontSize: 5, padding: '1px 3px', borderRadius: 2, flexShrink: 0,
                        fontFamily: 'Space Mono, monospace',
                        color: type === 'pos' ? '#059669' : type === 'neg' ? '#DC2626' : '#6B7280',
                        background: type === 'pos' ? '#ECFDF5' : type === 'neg' ? '#FEF2F2' : '#F9FAFB',
                        border: `0.5px solid ${type === 'pos' ? '#A7F3D0' : type === 'neg' ? '#FECACA' : '#E5E7EB'}`,
                      }}>{type}</span>
                      <span style={{ fontSize: 6, color: '#374151', lineHeight: 1.45, fontFamily: 'Inter, sans-serif' }}>{text}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Trajectory chart */}
              {showTrajectory && (
                <div>
                  <div style={{ fontSize: 6, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: 8 }}>
                    SENTIMENT TRAJECTORY — Q1 FY24 TO Q4 FY25
                  </div>
                  <svg viewBox="0 0 400 140" style={{ width: '100%', height: 140 }}>
                    {/* Grid */}
                    {[0.3, 0.5, 0.7, 0.9].map(v => (
                      <line key={v} x1="30" y1={140 - v * 140} x2="400" y2={140 - v * 140}
                        stroke="#F3F4F6" strokeWidth="1" />
                    ))}
                    {/* Lines */}
                    {[
                      { pts: [76,72,78,76,82,81,79,76], color: '#059669', label: 'Revenue' },
                      { pts: [64,60,68,64,70,65,62,63], color: '#3B82F6', label: 'Guidance' },
                      { pts: [70,54,62,68,67,66,65,64], color: '#D97706', label: 'Margins' },
                      { pts: [74,70,72,74,76,74,72,73], color: '#EC4899', label: 'Competition' },
                      { pts: [82,84,88,86,84,82,80,82], color: '#8B5CF6', label: 'Macro' },
                    ].map(({ pts, color, label }) => {
                      const step = 370 / 7
                      const points = pts.map((v, i) => `${30 + i * step},${140 - (v / 100) * 140}`).join(' ')
                      return (
                        <g key={label}>
                          <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
                            strokeLinejoin="round" strokeLinecap="round"
                            style={{ animation: 'drawLine 1.2s ease-out both' }} />
                          {pts.map((v, i) => (
                            <circle key={i} cx={30 + i * step} cy={140 - (v / 100) * 140}
                              r="2" fill={color} />
                          ))}
                        </g>
                      )
                    })}
                    {/* X-axis labels */}
                    {['Q1\nFY24','Q2\nFY24','Q3\nFY24','Q4\nFY24','Q1\nFY25','Q2\nFY25','Q3\nFY25','Q4\nFY25'].map((l, i) => (
                      <text key={i} x={30 + i * (370/7)} y={138} textAnchor="middle"
                        fontSize="5" fill="#9CA3AF" fontFamily="Space Mono, monospace">
                        {l.split('\n')[0]}
                      </text>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                    {[
                      { color: '#059669', label: 'Revenue' },
                      { color: '#3B82F6', label: 'Guidance' },
                      { color: '#D97706', label: 'Margins' },
                      { color: '#EC4899', label: 'Competition' },
                      { color: '#8B5CF6', label: 'Macro' },
                    ].map(({ color, label }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: 8, height: 2, background: color, borderRadius: 1 }} />
                        <span style={{ fontSize: 5, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocab Delta */}
              {showVocab && (
                <div>
                  <div style={{ fontSize: 6, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: 8 }}>
                    VOCABULARY SHIFT · Q3 FY25 vs Q2 FY25
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 6, color: '#DC2626', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: 5 }}>▲ INCREASED</div>
                      {[['headwinds', '+9×'], ['provisions', '+6×'], ['elevated', '+5×'], ['cautious', '+4×'], ['slippages', '+3×']].map(([w, d]) => (
                        <div key={w} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #F3F4F6' }}>
                          <span style={{ fontSize: 7, color: '#374151', fontFamily: 'Space Mono, monospace' }}>{w}</span>
                          <span style={{ fontSize: 7, color: '#DC2626', fontFamily: 'Space Mono, monospace' }}>{d}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 6, color: '#059669', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: 5 }}>▼ DECREASED</div>
                      {[['confident', '−8×'], ['robust', '−6×'], ['strong', '−5×'], ['optimistic', '−4×'], ['momentum', '−3×']].map(([w, d]) => (
                        <div key={w} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #F3F4F6' }}>
                          <span style={{ fontSize: 7, color: '#374151', fontFamily: 'Space Mono, monospace' }}>{w}</span>
                          <span style={{ fontSize: 7, color: '#059669', fontFamily: 'Space Mono, monospace' }}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Q&A Split */}
              {showQA && (
                <div>
                  <div style={{ fontSize: 6, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: 12 }}>
                    PREPARED REMARKS vs Q&A SESSION
                  </div>
                  {[
                    { label: 'PREPARED REMARKS', score: 0.82, color: '#059669' },
                    { label: 'Q&A SESSION', score: 0.63, color: '#D97706' },
                  ].map(({ label, score, color }) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 6, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: 8, color, fontFamily: 'Space Mono, monospace', fontWeight: 600 }}>{score.toFixed(2)}</span>
                      </div>
                      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${score * 100}%`, background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 7, color: '#DC2626', fontFamily: 'Space Mono, monospace', marginBottom: 6 }}>Gap: +0.19</div>
                  <div style={{ fontSize: 6, color: '#374151', fontFamily: 'Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.5 }}>
                    Management appears more confident in prepared remarks than under analyst questioning.
                  </div>
                </div>
              )}

              {/* PDF downloading */}
              {showPDF && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
                  <div style={{ fontSize: 24 }}>📄</div>
                  <div style={{ fontSize: 8, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                    {sceneId === 'pdf-downloading' ? 'Generating report...' : '✓ Report downloaded'}
                  </div>
                  {sceneId === 'pdf-done' && (
                    <div style={{
                      fontSize: 7, background: '#ECFDF5', border: '1px solid #A7F3D0',
                      color: '#065F46', padding: '4px 10px', borderRadius: 4,
                      fontFamily: 'Space Mono, monospace',
                    }}>
                      HDFCBANK_Q3_FY25_EarningLens.pdf
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ask bar — only on non-tab scenes */}
            {!showTrajectory && !showVocab && !showQA && !showPDF && (
              <div style={{ borderTop: '1px solid #E4E7EE', background: '#FAFBFC', padding: '6px 10px', flexShrink: 0 }}>
                <div style={{ fontSize: 5, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  ASK THE TRANSCRIPT
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{
                    flex: 1, height: 24, background: '#fff',
                    border: `1px solid ${sceneId === 'ask-focused' || sceneId === 'answer-loading' || sceneId === 'answer-shown' ? '#C8922A' : '#E4E7EE'}`,
                    borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 8px',
                    fontSize: 7, color: typedText.includes('management') ? '#111827' : '#9CA3AF',
                    fontFamily: 'Inter, sans-serif', overflow: 'hidden',
                  }}>
                    {typedText.includes('management') ? typedText : 'Ask a question about this transcript...'}
                  </div>
                  <div style={{
                    height: 24, padding: '0 8px', borderRadius: 4, display: 'flex', alignItems: 'center',
                    fontSize: 7, fontFamily: 'Inter, sans-serif',
                    background: typedText.includes('management') ? '#0C1628' : '#F3F4F6',
                    color: typedText.includes('management') ? '#fff' : '#9CA3AF',
                  }}>
                    {sceneId === 'answer-loading' ? '...' : 'Ask →'}
                  </div>
                </div>
                {showAnswer && (
                  <div style={{
                    marginTop: 6, borderLeft: '2px solid #C8922A',
                    background: '#fff', border: '1px solid #E4E7EE',
                    borderRadius: '0 4px 4px 0', padding: '6px 8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 5, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>ANSWER</span>
                      <span style={{ fontSize: 5, background: '#FEF3C7', color: '#78350F', border: '0.5px solid #FCD34D', borderRadius: 2, padding: '1px 4px', fontFamily: 'Space Mono, monospace' }}>
                        2 sentences highlighted
                      </span>
                    </div>
                    <div style={{ fontSize: 6, color: '#374151', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                      Management acknowledged elevated credit costs in the retail segment. Slippages remain above normalised levels — H2 moderation guided.
                    </div>
                    <div style={{ fontSize: 5, color: '#9CA3AF', fontStyle: 'italic', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
                      ↕ Relevant sentences highlighted above
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ width: '18%', background: '#F8FAFC', borderLeft: '1px solid #E4E7EE', padding: 8, flexShrink: 0 }}>
            <div style={{ fontSize: 5, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>OVERALL</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#059669', fontFamily: 'Space Mono, monospace', lineHeight: 1.1 }}>0.73</div>
            <div style={{ fontSize: 6, color: '#059669', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>above sector avg</div>
            <div style={{ fontSize: 5, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: 5 }}>ASPECTS</div>
            {[
              { name: 'Revenue',     score: 0.81, color: '#059669' },
              { name: 'Guidance',    score: 0.79, color: '#059669' },
              { name: 'Margins',     score: 0.64, color: '#D97706' },
              { name: 'Competition', score: 0.76, color: '#059669' },
              { name: 'Macro',       score: 0.88, color: '#059669' },
            ].map(({ name, score, color }) => (
              <div key={name} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 6, color: '#374151', fontFamily: 'Inter, sans-serif' }}>{name}</span>
                  <span style={{ fontSize: 6, color, fontFamily: 'Space Mono, monospace' }}>{score.toFixed(2)}</span>
                </div>
                <div style={{ height: 2, background: '#F3F4F6', borderRadius: 1, marginTop: 2 }}>
                  <div style={{ height: '100%', width: `${score * 100}%`, background: color, borderRadius: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── SECTORS PAGE ──────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F8FAFC' }}>
      {header}
      
      {/* Sector header */}
      <div style={{ padding:'6px 12px', borderBottom:'1px solid #E4E7EE', background:'#fff', flexShrink:0 }}>
        <div style={{ fontSize:5, color:'#9CA3AF', fontFamily:'Space Mono,monospace', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          SECTOR INTELLIGENCE
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#0C1628', fontFamily:'Inter,sans-serif' }}>Banking</div>
            <div style={{ fontSize:5, color:'#6B7280', fontFamily:'Inter,sans-serif' }}>3 companies · 8 quarters</div>
          </div>
          <div style={{ display:'flex', gap:3 }}>
            {['Auto','Banking','Cement','FMCG','IT Services','Pharma','Steel'].map(s => (
              <div key={s} style={{
                fontSize:4, padding:'2px 5px', borderRadius:10,
                border:`0.5px solid ${s==='Banking'?'#C8922A':'#E4E7EE'}`,
                color: s==='Banking'?'#C8922A':'#6B7280',
                background: s==='Banking'?'#FEF3C7':'transparent',
                fontFamily:'Inter,sans-serif',
              }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div style={{ padding:'5px 12px', fontSize:6, color:'#374151', fontFamily:'Inter,sans-serif', borderBottom:'1px solid #F3F4F6', flexShrink:0 }}>
        Banking sector averaged <span style={{color:'#C8922A',fontFamily:'Space Mono,monospace'}}>0.75</span> across 3 companies.{' '}
        <span style={{color:'#0C1628',fontWeight:600}}>HDFCBANK</span> leads at{' '}
        <span style={{color:'#059669',fontFamily:'Space Mono,monospace'}}>+0.06</span> above peers.
      </div>

      {/* Heatmap — compact */}
      <div style={{ padding:'6px 12px', borderBottom:'1px solid #E4E7EE', flexShrink:0 }}>
        <div style={{ fontSize:5, color:'#9CA3AF', fontFamily:'Space Mono,monospace', textTransform:'uppercase', marginBottom:4 }}>SENTIMENT HEATMAP</div>
        <div style={{ display:'grid', gridTemplateColumns:'52px repeat(8,1fr)', gap:2 }}>
          <div/>
          {['Q1 FY24','Q2 FY24','Q3 FY24','Q4 FY24','Q1 FY25','Q2 FY25','Q3 FY25','Q4 FY25'].map(q=>(
            <div key={q} style={{ fontSize:3.5, color:'#9CA3AF', textAlign:'center', fontFamily:'Space Mono,monospace' }}>{q}</div>
          ))}
          {[
            { name:'HDFCBANK', scores:[0.76,0.79,0.81,0.77,0.82,0.81,0.79,0.76] },
            { name:'ICICIBANK', scores:[0.76,null,null,0.76,null,null,0.74,0.77] },
            { name:'SBIN',      scores:[0.79,0.73,0.76,0.75,0.75,0.76,0.76,0.73] },
          ].map(({ name, scores }) => (
            <>
              <div key={name} style={{ fontSize:5, color:'#374151', fontFamily:'Space Mono,monospace', display:'flex', alignItems:'center' }}>{name}</div>
              {scores.map((s,i) => {
                const bg = !s?'#F1F5F9':s>=0.70?'#86EFAC':s>=0.60?'#BBF7D0':'#FDE68A'
                const fg = !s?'#9CA3AF':s>=0.70?'#14532D':s>=0.60?'#166534':'#78350F'
                return (
                  <div key={i} style={{
                    height:16, background:bg, borderRadius:2,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:4, color:fg, fontFamily:'Space Mono,monospace',
                  }}>{s?s.toFixed(2):''}</div>
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Bottom two columns: comparison chart + aspect breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, flex:1, overflow:'hidden' }}>
        
        {/* Left — comparison chart */}
        <div style={{ padding:'6px 10px', borderRight:'1px solid #E4E7EE' }}>
          <div style={{ fontSize:5, color:'#9CA3AF', fontFamily:'Space Mono,monospace', textTransform:'uppercase', marginBottom:4 }}>COMPARE COMPANIES</div>
          <div style={{ display:'flex', gap:6, marginBottom:6 }}>
            <div style={{ fontSize:5, padding:'2px 8px', border:'1px solid #E4E7EE', borderRadius:3, color:'#374151', fontFamily:'Inter,sans-serif', background:'#fff' }}>HDFCBANK ▾</div>
            <span style={{ fontSize:5, color:'#9CA3AF', alignSelf:'center' }}>vs</span>
            <div style={{ fontSize:5, padding:'2px 8px', border:'1px solid #E4E7EE', borderRadius:3, color:'#374151', fontFamily:'Inter,sans-serif', background:'#fff' }}>ICICIBANK ▾</div>
          </div>
          {/* Mini line chart */}
          <svg viewBox="0 0 200 80" style={{ width:'100%', height:80 }}>
            {/* Grid lines */}
            {[0.5,0.7,0.9].map(v=>(
              <line key={v} x1="0" y1={80-v*80} x2="200" y2={80-v*80} stroke="#F3F4F6" strokeWidth="0.5"/>
            ))}
            {/* HDFCBANK line - green */}
            <polyline
              points="0,19 28,17 57,15 85,18 114,14 142,15 170,17 200,19"
              fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* ICICIBANK line - amber dashed */}
            <polyline
              points="0,19 28,20 57,19 85,19 114,21 142,20 170,21 200,19"
              fill="none" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="3,2"
            />
            {/* X axis labels */}
            {['Q1','Q2','Q3','Q4','Q1','Q2','Q3','Q4'].map((l,i)=>(
              <text key={i} x={i*28.5} y={78} fontSize="4" fill="#9CA3AF" fontFamily="Space Mono,monospace">{l}</text>
            ))}
          </svg>
          <div style={{ display:'flex', gap:10, marginTop:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:10, height:2, background:'#059669', borderRadius:1 }}/>
              <span style={{ fontSize:4, color:'#6B7280', fontFamily:'Inter,sans-serif' }}>HDFCBANK</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:10, height:2, background:'#C8922A', borderRadius:1, borderTop:'1px dashed #C8922A' }}/>
              <span style={{ fontSize:4, color:'#6B7280', fontFamily:'Inter,sans-serif' }}>ICICIBANK</span>
            </div>
          </div>
        </div>

        {/* Right — aspect breakdown */}
        <div style={{ padding:'6px 10px' }}>
          <div style={{ fontSize:5, color:'#9CA3AF', fontFamily:'Space Mono,monospace', textTransform:'uppercase', marginBottom:4 }}>SECTOR ASPECT BREAKDOWN</div>
          <div style={{ fontSize:5, color:'#6B7280', fontFamily:'Inter,sans-serif', marginBottom:6 }}>
            Average sentiment per aspect — Q4 FY25
          </div>
          {[
            { label:'Revenue',     score:0.78, status:'stable',         delta:'+0.02', color:'#059669' },
            { label:'Margins',     score:0.71, status:'stable',         delta:'+0.01', color:'#059669' },
            { label:'Guidance',    score:0.76, status:'stable',         delta:'+0.03', color:'#059669' },
            { label:'Competition', score:0.74, status:'mixed',          delta:'+0.05', color:'#D97706' },
            { label:'Macro',       score:0.80, status:'constructive',   delta:'+0.04', color:'#059669' },
          ].map(({ label, score, status, delta, color }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 0', borderBottom:'1px solid #F3F4F6' }}>
              <span style={{ fontSize:6, color:'#374151', fontFamily:'Inter,sans-serif', width:55 }}>{label}</span>
              <div style={{ flex:1, height:2, background:'#F3F4F6', borderRadius:1 }}>
                <div style={{ height:'100%', width:`${score*100}%`, background:color, borderRadius:1 }}/>
              </div>
              <span style={{ fontSize:5, color, fontFamily:'Space Mono,monospace', width:22, textAlign:'right' }}>{score.toFixed(2)}</span>
              <span style={{ fontSize:5, color:'#9CA3AF', fontFamily:'Space Mono,monospace', width:20 }}>{delta}</span>
              <span style={{ fontSize:4.5, color, fontFamily:'Inter,sans-serif', width:50 }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main exported component ──────────────────────────────────────
export default function CinematicWalkthrough() {
  const screenRef = useRef(null)
  const cursorRef = useRef(null)
  const tlRef = useRef(null)
  const [screenDims, setScreenDims] = useState({ w: 728, h: 455 })
  const [sceneId, setSceneId] = useState('home')
  const [ripples, setRipples] = useState([])
  const [typedText, setTypedText] = useState('')
  const [briefText, setBriefText] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Measure screen
  useEffect(() => {
    if (!screenRef.current) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setScreenDims({ w: width, h: height })
    })
    ro.observe(screenRef.current)
    return () => ro.disconnect()
  }, [])

  const fireRipple = useCallback(() => {
    if (!cursorRef.current) return
    const x = parseFloat(gsap.getProperty(cursorRef.current, 'left'))
    const y = parseFloat(gsap.getProperty(cursorRef.current, 'top'))
    const id = Date.now()
    setRipples(p => [...p, { x, y, id }])
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 600)
  }, [])

  // Build GSAP timeline when dims are ready
  useEffect(() => {
    if (!cursorRef.current || screenDims.w < 100) return

    // Kill previous timeline
    if (tlRef.current) { tlRef.current.kill() }

    const { w, h } = screenDims
    const ch = 30 // header height in mock
    const cH = h - ch
    const sW = w * 0.148
    const cW = w * 0.652
    const cS = sW

    const P = {
      searchIcon:       { left: w * 0.86,   top: ch * 0.5           },
      searchInput:      { left: w * 0.50,   top: ch + cH * 0.30     },
      firstResult:      { left: w * 0.50,   top: ch + cH * 0.44     },
      quarterCard:      { left: sW * 0.50,  top: ch + cH * 0.28     },
      'click-quarter':  { left: sW * 0.50,  top: ch + cH * 0.28     },
      briefArea:        { left: cS + cW * 0.45, top: ch + cH * 0.40 },
      askInput:         { left: cS + cW * 0.43, top: h - 32         },
      'click-ask':      { left: cS + cW * 0.43, top: h - 32         },
      askButton:        { left: cS + cW * 0.78, top: h - 32         },
      'ask-button':     { left: cS + cW * 0.78, top: h - 32         },
      'click-ask-send': { left: cS + cW * 0.78, top: h - 32         },
      answerArea:       { left: cS + cW * 0.45, top: ch + cH * 0.65 },
      exportBtn:        { left: cS + cW * 0.310, top: ch + cH * 0.052 },
      'move-export':    { left: cS + cW * 0.310, top: ch + cH * 0.052 },
      'click-export':   { left: cS + cW * 0.310, top: ch + cH * 0.052 },
      'pdf-done':       { left: cS + cW * 0.310, top: ch + cH * 0.052 },
      trajectoryTab:    { left: cS + cW * 0.605, top: ch + cH * 0.052 },
      'move-trajectory':{ left: cS + cW * 0.605, top: ch + cH * 0.052 },
      'click-trajectory':{ left: cS + cW * 0.605, top: ch + cH * 0.052 },
      vocabTab:         { left: cS + cW * 0.725, top: ch + cH * 0.052 },
      'move-vocab':     { left: cS + cW * 0.725, top: ch + cH * 0.052 },
      'click-vocab':    { left: cS + cW * 0.725, top: ch + cH * 0.052 },
      qaTab:            { left: cS + cW * 0.840, top: ch + cH * 0.052 },
      'move-qa':        { left: cS + cW * 0.840, top: ch + cH * 0.052 },
      'click-qa':       { left: cS + cW * 0.840, top: ch + cH * 0.052 },
      sectorsNav:       { left: w * 0.920,   top: ch * 0.5           },
      'move-sectors':   { left: w * 0.920,   top: ch * 0.5           },
      'click-sectors':  { left: w * 0.920,   top: ch * 0.5           },
      heatmap:          { left: w * 0.44,   top: ch + cH * 0.60     },
    }

    const ease = 'power2.inOut'

    gsap.set(cursorRef.current, { left: w * 0.5, top: h * 0.5 })

    const tl = gsap.timeline({ repeat: -1, defaults: { ease } })
    tlRef.current = tl

    tl
      // Home
      .call(() => { setSceneId('home'); setTypedText(''); setBriefText(''); setShowAnswer(false); setShowDropdown(false) })
      .to(cursorRef.current, { ...P.searchIcon, duration: 1.0 })
      .to({}, { duration: 1.2 })

      // Click search
      .call(() => { fireRipple(); setSceneId('search-open') })
      .to({}, { duration: 0.4 })
      .to(cursorRef.current, { ...P.searchInput, duration: 0.7 })
      .call(() => { fireRipple() })
      .to({}, { duration: 0.4 })

      // Type
      .call(() => {
        setSceneId('typing')
        const letters = 'HDFCBANK'
        let i = 0
        const iv = setInterval(() => { i++; setTypedText(letters.slice(0, i)); if (i >= letters.length) { clearInterval(iv); setShowDropdown(true) } }, 260)
      })
      .to({}, { duration: 3.0 })

      // Click result
      .to(cursorRef.current, { ...P.firstResult, duration: 0.55 })
      .to({}, { duration: 0.3 })
      .call(() => { fireRipple(); setSceneId('transcript'); setShowDropdown(false); setTypedText('') })
      .to({}, { duration: 0.7 })

      // Select quarter
      .to(cursorRef.current, { ...P.quarterCard, duration: 0.9 })
      .to({}, { duration: 0.4 })
      .call(() => { fireRipple(); setSceneId('brief-loading') })
      .to({}, { duration: 0.3 })

      // Brief types
      .to(cursorRef.current, { ...P.briefArea, duration: 1.0 })
      .call(() => {
        setSceneId('brief-typing')
        const words = 'Management tone for HDFC Bank in Q3 FY25 was broadly constructive with an overall score of 0.73. Revenue held at 0.81 but margin pressure emerged at 0.64. Guidance was cautious — normalisation guided for H2 FY25.'.split(' ')
        let i = 0
        const iv = setInterval(() => { i++; setBriefText(words.slice(0,i).join(' ')); if (i >= words.length) clearInterval(iv) }, 72)
      })
      .to({}, { duration: 6.2 })

      // Ask transcript
      .to(cursorRef.current, { ...P.askInput, duration: 1.0 })
      .to({}, { duration: 0.3 })
      .call(() => { fireRipple(); setSceneId('ask-focused') })
      .to({}, { duration: 0.3 })
      .call(() => {
        const q = 'What did management say about credit costs?'
        let i = 0
        const iv = setInterval(() => { i++; setTypedText(q.slice(0,i)); if (i >= q.length) clearInterval(iv) }, 65)
      })
      .to({}, { duration: 3.1 })
      .to(cursorRef.current, { ...P.askButton, duration: 0.5 })
      .to({}, { duration: 0.3 })
      .call(() => { fireRipple(); setSceneId('answer-loading'); setTimeout(() => { setShowAnswer(true); setSceneId('answer-shown') }, 1000) })
      .to({}, { duration: 1.6 })
      .to(cursorRef.current, { ...P.answerArea, duration: 0.7 })
      .to({}, { duration: 2.2 })

      // Trajectory
      .to(cursorRef.current, { ...P.trajectoryTab, duration: 0.9 })
      .to({}, { duration: 0.3 })
      .call(() => { fireRipple(); setSceneId('trajectory') })
      .to({}, { duration: 3.8 })

      // Vocab
      .to(cursorRef.current, { ...P.vocabTab, duration: 0.7 })
      .to({}, { duration: 0.3 })
      .call(() => { fireRipple(); setSceneId('vocab') })
      .to({}, { duration: 3.4 })

      // Q&A Split
      .to(cursorRef.current, { ...P.qaTab, duration: 0.7 })
      .to({}, { duration: 0.3 })
      .call(() => { fireRipple(); setSceneId('qa-split') })
      .to({}, { duration: 3.4 })

      // Export PDF
      .to(cursorRef.current, { ...P.exportBtn, duration: 0.9 })
      .to({}, { duration: 0.3 })
      .call(() => { fireRipple(); setSceneId('pdf-downloading'); setTimeout(() => setSceneId('pdf-done'), 1400) })
      .to({}, { duration: 2.8 })

      // Sectors
      .to(cursorRef.current, { ...P.sectorsNav, duration: 1.1 })
      .to({}, { duration: 0.3 })
      .call(() => { fireRipple(); setSceneId('sectors') })
      .to(cursorRef.current, { ...P.heatmap, duration: 1.2 })
      .to({}, { duration: 4.5 })

    return () => { if (tlRef.current) tlRef.current.kill() }
  }, [screenDims, fireRipple])

  return (
    <div style={{ background: '#ECEEF1', padding: '60px 0', borderTop: '1px solid #E4E7EE', borderBottom: '1px solid #E4E7EE' }}>
      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          PRODUCT WALKTHROUGH
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#0C1628', fontFamily: 'Inter, sans-serif' }}>
          See it in action.
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
          A guided demonstration of the full intelligence pipeline.
        </div>
      </div>

      {/* Laptop */}
      <div style={{ maxWidth: 760, margin: '0 auto', filter: 'drop-shadow(0 28px 56px rgba(0,0,0,0.26)) drop-shadow(0 6px 14px rgba(0,0,0,0.12))' }}>
        {/* Lid */}
        <div style={{
          background: 'linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 60%, #141416 100%)',
          borderRadius: '12px 12px 2px 2px',
          padding: '12px 12px 0 12px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset',
        }}>
          {/* Camera notch */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
            <div style={{ width: 40, height: 4, background: '#1C1C1E', borderRadius: '0 0 3px 3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 4, height: 4, background: '#0A0A0A', borderRadius: '50%', border: '0.5px solid rgba(255,255,255,0.08)' }} />
            </div>
          </div>
          {/* Bezel */}
          <div style={{ background: '#1A1A1C', borderRadius: '6px 6px 0 0', padding: 3 }}>
            {/* Screen content */}
            <div
              ref={screenRef}
              style={{
                width: '100%',
                aspectRatio: '16/10',
                background: '#F7F8FA',
                borderRadius: '4px 4px 0 0',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <SceneContent
                sceneId={sceneId}
                typedText={typedText}
                briefText={briefText}
                showAnswer={showAnswer}
                showDropdown={showDropdown}
              />

              {/* Cursor */}
              <div
                ref={cursorRef}
                style={{ position: 'absolute', pointerEvents: 'none', zIndex: 1000 }}
              >
                <svg width="14" height="18" viewBox="0 0 14 18">
                  <path
                    d="M1 1 L1 14 L4 11 L6.5 17 L9 16 L6.5 10 L11.5 10 Z"
                    fill="#1C1C1E"
                    stroke="white"
                    strokeWidth="1"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Ripples */}
              {ripples.map(r => (
                <div key={r.id} style={{ position: 'absolute', left: r.x, top: r.y, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 999 }}>
                  <div style={{ width: 0, height: 0, borderRadius: '50%', border: '2px solid #C8922A', animation: 'rippleGrow 480ms ease-out forwards' }} />
                </div>
              ))}

              {/* Progress bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(0,0,0,0.05)' }}>
                <div style={{ height: '100%', background: '#C8922A', width: '100%', transformOrigin: 'left', animation: 'progressLoop 62s linear infinite' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Hinge */}
        <div style={{ height: 5, background: 'linear-gradient(180deg, #1A1A1C, #0A0A0C)' }} />

        {/* Laptop base — front edge, matches reference */}
<div style={{
  height: 22,
  width: 'calc(100% + 28px)',
  marginLeft: -14,
  background: 'linear-gradient(180deg, #6E6E71 0%, #5A5A5D 50%, #4A4A4D 100%)',
  borderRadius: '0 0 6px 6px',
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset',
}}>
  {/* Center indent — port/latch notch */}
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 52,
    height: 5,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '3px 3px 0 0',
  }} />
</div>

{/* Ground shadow */}
<div style={{
  height: 10,
  width: '85%',
  margin: '0 auto',
  background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(0,0,0,0.2) 0%, transparent 100%)',
}} />

        {/* Shadow */}
        <div style={{ height: 18, background: 'radial-gradient(ellipse 80% 100% at 50% 0%,rgba(0,0,0,0.2),transparent)', borderRadius: '0 0 50% 50%' }} />
      </div>

      <style>{`
        @keyframes rippleGrow {
          from { width:0; height:0; opacity:1; }
          to   { width:34px; height:34px; opacity:0; }
        }
        @keyframes progressLoop {
          from { transform:scaleX(0); }
          to   { transform:scaleX(1); }
        }
      `}</style>
    </div>
  )
}