import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'

import SectorHeatmap from '../components/SectorHeatmap'
import CompanyComparison from '../components/CompanyComparison'
import { db } from '../firebase'
import { theme } from '../theme'

function getHeatmapCacheKey(sectorId, companies) {
  return `el_v1_heatmap_${sectorId}_${[...companies].sort().join('_')}`
}

function readHeatmapCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    // Expires after 24 hours
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

function writeHeatmapCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
  } catch {
    // Storage full — clear old entries
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith('el_v1_heatmap_')) {
        localStorage.removeItem(k)
      }
    }
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
    } catch {}
  }
}

// ─── constants ────────────────────────────────────────────────────────────────
const QUARTER_IDS = ['Q1_FY24', 'Q2_FY24', 'Q3_FY24', 'Q4_FY24', 'Q1_FY25', 'Q2_FY25', 'Q3_FY25', 'Q4_FY25']
const MOST_RECENT = 'Q4_FY25'
const PREV_QUARTER = 'Q3_FY25'
const ASPECTS = ['revenue', 'margins', 'guidance', 'competition', 'macro']

const QUARTER_LABELS = {
  Q1_FY24: 'Q1 FY24',
  Q2_FY24: 'Q2 FY24',
  Q3_FY24: 'Q3 FY24',
  Q4_FY24: 'Q4 FY24',
  Q1_FY25: 'Q1 FY25',
  Q2_FY25: 'Q2 FY25',
  Q3_FY25: 'Q3 FY25',
  Q4_FY25: 'Q4 FY25',
}

// ─── normalisers ──────────────────────────────────────────────────────────────
function normalizeSectorList(data) {
  if (Array.isArray(data?.sectors)) return data.sectors
  if (Array.isArray(data)) return data
  return []
}
function normalizeCompanies(companies) {
  return Array.isArray(companies)
    ? companies.map(c => String(c ?? '').trim()).filter(Boolean)
    : []
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function scoreColor(s) {
  const n = Number(s)
  if (!Number.isFinite(n)) return theme.colors.textMuted
  if (n >= 0.65) return theme.colors.positive
  if (n >= 0.50) return theme.colors.warning
  return theme.colors.negative
}
function fmtScore(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : '—'
}
function fmtDelta(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2)
}

// ─── Keyframes (injected once) ────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes sector-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`

// ─── sub-components ───────────────────────────────────────────────────────────
function AspectRadar({ scoresByCompany, companyList }) {
  // compute sector average for each aspect from MOST_RECENT quarter
  const aspectAverages = useMemo(() => {
    const out = {}
    ASPECTS.forEach(aspect => {
      const vals = []
      companyList.forEach(cId => {
        const s = scoresByCompany[cId]
        if (!s) return
        const a = s.__aspects?.[MOST_RECENT]?.[aspect]
        if (Number.isFinite(Number(a))) vals.push(Number(a))
      })
      out[aspect] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    })
    return out
  }, [scoresByCompany, companyList])

  const mostRecentLabel = QUARTER_LABELS[MOST_RECENT] || MOST_RECENT.replace('_', ' ')

  function aspectVerdict(score) {
    if (!Number.isFinite(score)) return { label: 'no signal', color: theme.colors.textMuted }
    if (score >= 0.70) return { label: 'constructive', color: theme.colors.positive }
    if (score >= 0.60) return { label: 'stable', color: theme.colors.textMuted }
    if (score >= 0.50) return { label: 'mixed', color: theme.colors.warning }
    if (score >= 0.40) return { label: 'cautious', color: theme.colors.warning }
    return { label: 'under pressure', color: theme.colors.negative }
  }

  return (
    <div style={{ background: 'transparent', border: 'none', borderRadius: 0, borderTop: `1px solid ${theme.colors.border}`, padding: '24px 20px 20px 20px' }}>
      <div style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        SECTOR ASPECT BREAKDOWN
      </div>
      <div style={{ fontSize: '11px', color: theme.colors.textMuted, fontFamily: theme.fonts.body, marginTop: '4px', marginBottom: '18px', lineHeight: 1.5 }}>
        Average sentiment per aspect across all companies in {mostRecentLabel}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {ASPECTS.map(aspect => {
          const val = aspectAverages[aspect]
          const hasVal = Number.isFinite(val)
          const col = hasVal ? scoreColor(val) : theme.colors.textMuted
          const verdict = aspectVerdict(val)
          const prevVal = (() => {
            const vals = []
            companyList.forEach(cId => {
              const s = scoresByCompany[cId]
              if (!s) return
              const a = s.__aspects?.[PREV_QUARTER]?.[aspect]
              if (Number.isFinite(Number(a))) vals.push(Number(a))
            })
            return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
          })()
          const delta = Number.isFinite(val) && Number.isFinite(prevVal) ? val - prevVal : NaN

          return (
            <div
              key={aspect}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 0',
                borderBottom: `1px solid ${theme.colors.border}`,
                fontFamily: theme.fonts.body,
              }}
            >
              <span style={{
                fontSize: '12px', color: theme.colors.textSecondary,
                width: '90px', flexShrink: 0, textTransform: 'capitalize',
              }}>
                {aspect}
              </span>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: '13px', color: col, minWidth: '52px', textAlign: 'right' }}>
                {hasVal ? val.toFixed(2) : '—'}
              </span>
              <span style={{ fontSize: '12px', color: verdict.color, minWidth: '110px', textAlign: 'right' }}>
                {verdict.label}
              </span>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: Number.isFinite(delta) ? (delta > 0 ? theme.colors.positive : delta < 0 ? theme.colors.negative : theme.colors.textMuted) : theme.colors.textMuted, minWidth: '54px', textAlign: 'right' }}>
                {fmtDelta(delta)}
              </span>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: '10px', color: theme.colors.textMuted, lineHeight: '1.6', marginTop: '18px', fontFamily: theme.fonts.body }}>
        Scores derived from FinBERT sentence-level classification across all available transcripts for this sector in the most recent quarter.
      </p>
    </div>
  )
}

function CoveragePanel({ companyList, scoresByCompany, hasDriftAlert }) {
  return (
    <div style={{ background: 'transparent', border: 'none', borderRadius: 0, borderTop: `1px solid ${theme.colors.border}`, padding: '24px 20px 20px 20px' }}>
      <div style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
        DATA COVERAGE
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {companyList.map(cId => {
          const scores = scoresByCompany[cId] || {}
          const covered = QUARTER_IDS.filter(q => Number.isFinite(Number(scores[q]))).length
          const pct = Math.min(100, (covered / 8) * 100)
          const isPartial = covered < 8
          const fillColor = isPartial ? theme.colors.warning : theme.colors.positive

          return (
            <div key={cId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textSecondary }}>{cId}</span>
                <span style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textTertiary }}>{covered}/8</span>
              </div>
              <div style={{ height: '3px', background: theme.colors.border, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: fillColor, borderRadius: '2px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ borderTop: `1px solid ${theme.colors.border}`, marginTop: '18px', paddingTop: '14px' }}>
        <div style={{ background: theme.colors.bgPrimary, borderRadius: '6px', padding: '12px', border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            GUIDANCE DRIFT ALERTS
          </div>
          {(() => {
            const alerts = companyList.filter(cId => hasDriftAlert[cId] === true)
            if (alerts.length === 0) {
              return (
                <div style={{ fontFamily: theme.fonts.body, fontSize: '11px', color: theme.colors.textMuted, fontStyle: 'italic' }}>
                  No alerts this quarter
                </div>
              )
            }
            return alerts.map(cId => (
              <div key={cId} style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.negative, marginBottom: '4px' }}>
                ⚠ {cId}
              </div>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function SectorPage() {
  const navigate = useNavigate()
  const { sectorId } = useParams()
  const normalizedSectorId = String(sectorId ?? '').trim()

  const [sectorsList, setSectorsList] = useState([])
  const [companies, setCompanies] = useState([])
  const [sectorName, setSectorName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  // Lifted: the full scores + per-company aspect scores
  const [scoresByCompany, setScoresByCompany] = useState({})
  const [heatmapLoading, setHeatmapLoading] = useState(false)
  const [hasDriftAlert, setHasDriftAlert] = useState({})

  const activeSector = useMemo(() => {
    if (sectorsList.length === 0) return null
    return sectorsList.find(s => String(s?.sector_id ?? '').trim() === normalizedSectorId) || sectorsList[0] || null
  }, [normalizedSectorId, sectorsList])

  // ── fetch sector list ──────────────────────────────────────────────────────
  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    async function loadSectors() {
      try {
        setIsLoading(true)
        const response = await fetch('http://localhost:8000/api/sectors', { signal: controller.signal })
        if (!response.ok) throw new Error(`Status ${response.status}`)
        const data = await response.json()
        const nextSectors = normalizeSectorList(data)
        if (!isActive) return

        setSectorsList(nextSectors)
        const matched = nextSectors.find(s => String(s?.sector_id ?? '').trim() === normalizedSectorId) || nextSectors[0] || null
        setCompanies(Array.isArray(matched?.companies) ? matched.companies : [])
        setSectorName(String(matched?.name ?? matched?.sector_id ?? 'Sector').trim())
      } catch (err) {
        if (!isActive || err.name === 'AbortError') return
        setSectorsList([])
        setCompanies([])
        setSectorName('')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    loadSectors()
    return () => { isActive = false; controller.abort() }
  }, [normalizedSectorId])

  const companyList = useMemo(() => normalizeCompanies(companies), [companies])

  // ── fetch scores (lifted from SectorHeatmap) ───────────────────────────────
  useEffect(() => {
    let isActive = true

    async function loadScores() {
      if (companyList.length === 0) {
        setScoresByCompany({})
        setHasDriftAlert({})
        return
      }
      const cacheKey = getHeatmapCacheKey(normalizedSectorId, companyList)
      const cached = readHeatmapCache(cacheKey)

      if (cached) {
        setScoresByCompany(cached.scores || {})
        setHasDriftAlert(cached.alerts || {})
        return
    }
      setHeatmapLoading(true)
      try {
        const entries = await Promise.all(
          companyList.map(async companyId => {
            const snap = await getDocs(collection(db, 'companies', companyId, 'quarters'))
            const companyScores = {}
            const aspects = {}
            const drift = {}

            snap.forEach(doc => {
              const qId = doc.id
              const d = doc.data() || {}
              companyScores[qId] = Number(d.overall_score)

              // aspect scores
              if (d.aspect_scores && typeof d.aspect_scores === 'object') {
                aspects[qId] = {}
                ASPECTS.forEach(a => {
                  const v = d.aspect_scores[a]?.score ?? d.aspect_scores[a]
                  aspects[qId][a] = Number(v)
                })
              }

              // drift
              if (d.guidance_drift_alert === true) drift[qId] = true
            })

            // attach aspects under a special key
            companyScores.__aspects = aspects
            // check drift in most recent quarter
            const hasDrift = Object.keys(drift).length > 0
            return [companyId, companyScores, hasDrift]
          })
        )
        if (!isActive) return

        const scores = {}
        const alertMap = {}
        entries.forEach(([cId, s, drift]) => {
          scores[cId] = s
          alertMap[cId] = drift
        })
        writeHeatmapCache(cacheKey, {
          scores,
          alerts: alertMap,
      })
        setScoresByCompany(scores)
        setHasDriftAlert(alertMap)
      } catch (e) {
        if (!isActive) return
        setScoresByCompany({})
        setHasDriftAlert({})
      } finally {
        if (isActive) setHeatmapLoading(false)
      }
    }

    loadScores()
    return () => { isActive = false }
  }, [companyList])

  // ── derived signals ────────────────────────────────────────────────────────
  const narrative = useMemo(() => {
    let topCompany = null
    let topScore = -Infinity
    let totalScore = 0
    let totalCount = 0

    companyList.forEach(cId => {
      const s = scoresByCompany[cId] || {}
      const cur = Number(s[MOST_RECENT])
      if (Number.isFinite(cur)) {
        if (cur > topScore) { topScore = cur; topCompany = cId }
        totalScore += cur
        totalCount++
      }
    })

    const sectorAvg = totalCount > 0 ? totalScore / totalCount : null
    let bottomCompany = null
    let bottomRelative = Infinity

    companyList.forEach(cId => {
      const s = scoresByCompany[cId] || {}
      const cur = Number(s[MOST_RECENT])
      if (!Number.isFinite(cur) || !Number.isFinite(sectorAvg)) return
      const rel = cur - sectorAvg
      if (rel < bottomRelative) {
        bottomRelative = rel
        bottomCompany = cId
      }
    })

    const driftCompanies = companyList.filter(cId => hasDriftAlert[cId] === true)
    const mostRecentQuarter = QUARTER_LABELS[MOST_RECENT] || MOST_RECENT.replace('_', ' ')

    return {
      topCompany,
      topRelative: Number.isFinite(topScore) && Number.isFinite(sectorAvg) ? topScore - sectorAvg : null,
      bottomCompany,
      bottomRelative: Number.isFinite(bottomRelative) ? bottomRelative : null,
      sectorAvg,
      companiesWithData: totalCount,
      mostRecentQuarter,
      driftCompanies,
    }
  }, [companyList, scoresByCompany, hasDriftAlert])

  const sectorAvgColor = theme.colors.amber
  const topRelativeColor = theme.colors.amber
  const bottomRelativeColor = theme.colors.amber

  // ── sector averages per quarter (passed to heatmap) ────────────────────────
  const sectorAverages = useMemo(() => {
    const out = {}
    QUARTER_IDS.forEach(qId => {
      const vals = companyList
        .map(cId => Number((scoresByCompany[cId] || {})[qId]))
        .filter(v => Number.isFinite(v))
      out[qId] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    })
    return out
  }, [companyList, scoresByCompany])

  // ── tab hover state ────────────────────────────────────────────────────────
  const [hoveredTab, setHoveredTab] = useState(null)

  // ── loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.colors.bgPrimary, paddingTop: '56px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '24px', height: '24px',
            border: `2px solid ${theme.colors.border}`, borderTopColor: theme.colors.amber,
            borderRadius: '50%', animation: 'sector-spin 0.8s linear infinite',
            boxSizing: 'border-box',
          }} />
          <div style={{ color: theme.colors.textMuted, fontSize: '13px', fontFamily: theme.fonts.body }}>
            Loading sector data…
          </div>
        </div>
        <style>{KEYFRAMES}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: theme.colors.bgPrimary, paddingTop: '56px' }}>
      <style>{KEYFRAMES}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HEADER BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <header style={{
        backgroundColor: theme.colors.bgSurface,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
      }}>
        {/* left: sector meta */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            SECTOR INTELLIGENCE
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: theme.colors.navy, fontFamily: theme.fonts.body, marginTop: '4px', lineHeight: 1.2 }}>
            {sectorName || 'Sector'}
          </div>
          <div style={{ fontSize: '11px', color: theme.colors.textMuted, fontFamily: theme.fonts.body, marginTop: '2px' }}>
            {companies.length} companies · {QUARTER_IDS.length} quarters · FinBERT sentence-level
          </div>
        </div>

        {/* right: sector tabs */}
        <nav
          aria-label="Sector switcher"
          style={{
            display: 'flex', flexWrap: 'nowrap', overflowX: 'auto',
            gap: '6px', maxWidth: '700px', scrollbarWidth: 'none',
            paddingBottom: '2px',
          }}
        >
          {sectorsList.map(sector => {
            const key = String(sector?.sector_id ?? '').trim()
            const isActive = key === normalizedSectorId || (!normalizedSectorId && activeSector?.sector_id === key)
            const isHov = hoveredTab === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(`/sector/${key}`)}
                onMouseEnter={() => setHoveredTab(key)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  fontSize: '12px', padding: '5px 14px', borderRadius: '20px',
                  border: `1px solid ${isActive ? theme.colors.amber : isHov ? theme.colors.borderStrong : theme.colors.border}`,
                  color: isActive ? theme.colors.amber : theme.colors.textSecondary,
                  background: isActive ? theme.colors.amberBg : theme.colors.bgSurface,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: theme.fonts.body,
                  transition: 'border-color 150ms ease, color 150ms ease, background-color 150ms ease',
                  lineHeight: 1.4,
                }}
              >
                {sector?.name ?? key}
              </button>
            )
          })}
        </nav>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — SECTOR INTELLIGENCE NARRATIVE
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: theme.colors.bgPrimary,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '24px',
        alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', color: theme.colors.textSecondary, lineHeight: '1.8', maxWidth: '760px', fontFamily: theme.fonts.body, margin: 0 }}>
            <span style={{ color: theme.colors.navy, fontWeight: 600 }}>
              {sectorName} sector
            </span>
            {' '}sentiment averaged{' '}
            <span style={{ fontFamily: theme.fonts.mono, color: theme.colors.amber, fontSize: '13px' }}>
              {Number.isFinite(narrative.sectorAvg) ? narrative.sectorAvg.toFixed(2) : '—'}
            </span>
            {' '}across {narrative.companiesWithData} companies in {narrative.mostRecentQuarter}.{' '}
            <span style={{ color: theme.colors.navy, fontWeight: 600 }}>{narrative.topCompany || '—'}</span>
            {' '}leads sector peers with a relative score of{' '}
            <span style={{ fontFamily: theme.fonts.mono, color: topRelativeColor }}>
              {Number.isFinite(narrative.topRelative) ? `+${narrative.topRelative.toFixed(2)}` : '—'}
            </span>
            .{' '}
            <span style={{ color: theme.colors.navy, fontWeight: 600 }}>{narrative.bottomCompany || '—'}</span>
            {' '}sits{' '}
            <span style={{ fontFamily: theme.fonts.mono, color: bottomRelativeColor }}>
              {Number.isFinite(narrative.bottomRelative) ? narrative.bottomRelative.toFixed(2) : '—'}
            </span>
            {' '}below peers.
            {narrative.driftCompanies.length > 0 && (
              <>{' '}
                <span style={{ color: theme.colors.negative, fontWeight: 500 }}>
                  {narrative.driftCompanies.join(', ')}
                </span>
                {' '}
                {narrative.driftCompanies.length === 1 ? 'has' : 'have'} active guidance drift alerts — guidance sentiment dropped more than 0.20 points quarter-over-quarter.
              </>
            )}
          </p>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: '28px', color: sectorAvgColor, lineHeight: 1 }}>
            {Number.isFinite(narrative.sectorAvg) ? narrative.sectorAvg.toFixed(2) : '—'}
          </div>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px' }}>
            sector avg · {narrative.mostRecentQuarter}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — HEATMAP
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '28px 40px' }}>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          SENTIMENT HEATMAP
        </div>
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontStyle: 'italic', marginTop: '3px', marginBottom: '16px' }}>
          Click any cell to open that company-quarter transcript
        </div>
        <SectorHeatmap
          companies={companies}
          sectorName={sectorName}
          scoresByCompany={scoresByCompany}
          sectorAverages={sectorAverages}
          loading={heatmapLoading}
          hasDriftAlert={hasDriftAlert}
          onCellClick={(companyId, quarterId) => navigate(`/company/${companyId}/${quarterId}`)}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — BOTTOM GRID
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '0 40px 48px 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 280px',
          gap: '20px',
          alignItems: 'start',
        }}>
          {/* left: company comparison chart */}
          <div>
            <CompanyComparison companies={companies} />
          </div>

          {/* middle: aspect radar */}
          <AspectRadar scoresByCompany={scoresByCompany} companyList={companyList} />

          {/* right: coverage + drift alerts */}
          <CoveragePanel
            companyList={companyList}
            scoresByCompany={scoresByCompany}
            hasDriftAlert={hasDriftAlert}
          />
        </div>
      </div>
    </div>
  )
}
