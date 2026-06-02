import { useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { theme } from '../theme'

// ─── constants ────────────────────────────────────────────────────────────────
const QUARTERS = ['Q1_FY24', 'Q2_FY24', 'Q3_FY24', 'Q4_FY24', 'Q1_FY25', 'Q2_FY25', 'Q3_FY25', 'Q4_FY25']
const MOST_RECENT = 'Q4_FY25'

const QUARTER_LABELS = {
  Q1_FY24: 'Q1 FY24', Q2_FY24: 'Q2 FY24', Q3_FY24: 'Q3 FY24', Q4_FY24: 'Q4 FY24',
  Q1_FY25: 'Q1 FY25', Q2_FY25: 'Q2 FY25', Q3_FY25: 'Q3 FY25', Q4_FY25: 'Q4 FY25',
}

// Absolute-score cell colours (light theme)
function getCellStyle(score) {
  if (!Number.isFinite(score)) {
    return { ...theme.colors.heatEmpty, hasScore: false }
  }
  if (score >= 0.70) return { ...theme.colors.heatHigh, hasScore: true }
  if (score >= 0.60) return { ...theme.colors.heatMidHigh, hasScore: true }
  if (score >= 0.50) return { ...theme.colors.heatMid, hasScore: true }
  if (score >= 0.40) return { ...theme.colors.heatLow, hasScore: true }
  return { ...theme.colors.heatBearish, hasScore: true }
}

function deltaColor(d) {
  if (d > 0.005) return theme.colors.positive
  if (d < -0.005) return theme.colors.negative
  return theme.colors.textMuted
}

function fmtScore(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : ''
}
function fmtDelta(d) {
  const n = Number(d)
  if (!Number.isFinite(n)) return ''
  return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2)
}

// ─── SectorHeatmap ────────────────────────────────────────────────────────────
export default function SectorHeatmap({
  companies = [],
  sectorName,
  onCellClick,
  scoresByCompany = {},     // lifted state passed from SectorPage
  sectorAverages = {},      // { quarterId: avgScore }
  loading = false,
  hasDriftAlert = {},       // { companyId: bool }
}) {
  const [hoveredCell, setHoveredCell] = useState(null)

  const companyList = useMemo(() =>
    Array.isArray(companies)
      ? companies.map(c => String(c ?? '').trim()).filter(Boolean)
      : []
  , [companies])

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: 'transparent', border: 'none', borderRadius: 0, padding: '24px', color: theme.colors.textMuted, fontSize: '12px', fontFamily: theme.fonts.body }}>
        Loading heatmap data…
      </div>
    )
  }

  const DRIFT_COL_W = 84

  return (
    <section
      style={{ background: 'transparent', border: 'none', borderRadius: 0, padding: '20px', overflowX: 'auto' }}
      aria-label={`${sectorName || 'Sector'} sentiment heatmap`}
    >
      {/* ── column header row ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `120px repeat(${QUARTERS.length}, 1fr) ${DRIFT_COL_W}px`,
        gap: '4px',
        marginBottom: '6px',
        alignItems: 'end',
      }}>
        <div />
        {QUARTERS.map(qId => (
          <div key={qId} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: qId === MOST_RECENT ? theme.colors.amber : theme.colors.textTertiary, lineHeight: 1.3 }}>
              {QUARTER_LABELS[qId]}
            </div>
            {qId === MOST_RECENT && (
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: theme.colors.amber, margin: '3px auto 0' }} />
            )}
          </div>
        ))}
        <div style={{ fontFamily: theme.fonts.mono, fontSize: '9px', color: theme.colors.textTertiary, textAlign: 'center' }}>
          DRIFT
        </div>
      </div>

      {/* ── company rows ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {companyList.map(companyId => {
          const companyScores = scoresByCompany[companyId] || {}
          const hasAlert = hasDriftAlert[companyId] === true

          return (
            <div
              key={companyId}
              style={{
                display: 'grid',
                gridTemplateColumns: `120px repeat(${QUARTERS.length}, 1fr) ${DRIFT_COL_W}px`,
                gap: '4px',
                alignItems: 'center',
              }}
            >
              {/* company label */}
              <div style={{
                fontSize: '12px', color: theme.colors.textSecondary,
                fontFamily: theme.fonts.mono,
                whiteSpace: 'nowrap', paddingRight: '8px',
              }}>
                {companyId}
              </div>

              {/* quarter cells */}
              {QUARTERS.map(qId => {
                const absScore = companyScores[qId]
                const avg = sectorAverages[qId]
                const rel = (Number.isFinite(Number(absScore)) && Number.isFinite(Number(avg)))
                  ? Number(absScore) - Number(avg)
                  : NaN
                const cs = getCellStyle(Number(absScore))
                const isHovered = hoveredCell?.companyId === companyId && hoveredCell?.quarterId === qId

                return (
                  <div
                    key={qId}
                    onMouseEnter={() => setHoveredCell({ companyId, quarterId: qId })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => cs.hasScore && typeof onCellClick === 'function' && onCellClick(companyId, qId)}
                    title={cs.hasScore ? `${companyId} ${QUARTER_LABELS[qId]}: ${fmtScore(absScore)} (${fmtDelta(rel)} vs sector)` : ''}
                    style={{
                      height: '44px',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: cs.hasScore ? 'pointer' : 'default',
                      backgroundColor: cs.bg,
                      border: `1px solid ${isHovered && cs.hasScore ? cs.text : cs.border}`,
                      color: cs.text,
                      fontFamily: theme.fonts.mono,
                      position: 'relative',
                      boxSizing: 'border-box',
                      transform: isHovered && cs.hasScore ? 'scale(1.06)' : 'scale(1)',
                      zIndex: isHovered ? 2 : 1,
                      transition: 'transform 120ms ease, border-color 120ms ease',
                      userSelect: 'none',
                      gap: '2px',
                    }}
                  >
                    {cs.hasScore ? (
                      <>
                        <span style={{ fontSize: '10px', lineHeight: 1 }}>{fmtScore(absScore)}</span>
                        <span style={{ fontSize: '9px', lineHeight: 1, color: deltaColor(rel) }}>{fmtDelta(rel)}</span>
                      </>
                    ) : null}

                    {/* hover tooltip */}
                    {isHovered && cs.hasScore && (
                      <div style={{
                        position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
                        transform: 'translateX(-50%)',
                        background: theme.colors.bgSurface, border: `1px solid ${theme.colors.border}`,
                        borderRadius: '4px', padding: '5px 10px',
                        whiteSpace: 'nowrap', pointerEvents: 'none',
                        fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textPrimary,
                        lineHeight: 1.4, zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}>
                        <div>{companyId} · {QUARTER_LABELS[qId]}</div>
                        <div style={{ color: cs.text, marginTop: '2px' }}>{fmtScore(absScore)} · {fmtDelta(rel)} vs sector</div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* drift indicator */}
              <div style={{ textAlign: 'center' }}>
                {hasAlert
                  ? <span style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.negative }}>⚠ DRIFT</span>
                  : null
                }
              </div>
            </div>
          )
        })}
      </div>

      {/* ── legend ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', color: theme.colors.textTertiary, fontFamily: theme.fonts.mono, marginRight: '4px' }}>score bands:</span>
        {[
          { bg: theme.colors.heatHigh.bg, border: theme.colors.heatHigh.border, label: '>= 0.70' },
          { bg: theme.colors.heatMidHigh.bg, border: theme.colors.heatMidHigh.border, label: '0.60-0.69' },
          { bg: theme.colors.heatMid.bg, border: theme.colors.heatMid.border, label: '0.50-0.59' },
          { bg: theme.colors.heatLow.bg, border: theme.colors.heatLow.border, label: '0.40-0.49' },
          { bg: theme.colors.heatBearish.bg, border: theme.colors.heatBearish.border, label: '< 0.40' },
          { bg: theme.colors.heatEmpty.bg, border: theme.colors.heatEmpty.border, label: 'empty' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.bg, border: `1px solid ${item.border}`, flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: theme.colors.textMuted, fontFamily: theme.fonts.mono }}>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}