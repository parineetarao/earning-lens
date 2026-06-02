import { useState } from 'react'
import { theme } from '../theme'

function parseQuarterId(quarterId) {
  const value = String(quarterId ?? '').trim()

  const fyQuarterMatch = value.match(/Q([1-4])\s*FY\s*(\d{2,4})/i)
  if (fyQuarterMatch) {
    const quarter = Number(fyQuarterMatch[1])
    const year = Number(fyQuarterMatch[2].length === 2 ? `20${fyQuarterMatch[2]}` : fyQuarterMatch[2])
    return { year, quarter }
  }

  const yearQuarterMatch = value.match(/FY\s*(\d{2,4}).*Q([1-4])/i)
  if (yearQuarterMatch) {
    const year = Number(yearQuarterMatch[1].length === 2 ? `20${yearQuarterMatch[1]}` : yearQuarterMatch[1])
    const quarter = Number(yearQuarterMatch[2])
    return { year, quarter }
  }

  const compactMatch = value.match(/(\d{4}).*Q([1-4])/i)
  if (compactMatch) {
    return { year: Number(compactMatch[1]), quarter: Number(compactMatch[2]) }
  }

  return null
}

function compareQuarterIdsDescending(leftId, rightId) {
  const left = parseQuarterId(leftId)
  const right = parseQuarterId(rightId)

  if (left && right) {
    if (left.year !== right.year) {
      return right.year - left.year
    }

    return right.quarter - left.quarter
  }

  if (left && !right) return -1
  if (!left && right) return 1

  return String(rightId).localeCompare(String(leftId), undefined, { numeric: true, sensitivity: 'base' })
}

function getScoreColor(score) {
  const value = Number(score)
  if (value >= 0.6) return theme.colors.positive
  if (value >= 0.45) return theme.colors.warning
  return theme.colors.negative
}

function formatScore(score) {
  const value = Number(score)
  if (Number.isNaN(value)) {
    return '--'
  }
  return value.toFixed(2)
}

function QuarterCard({
  quarter,
  selected,
  hovered,
  onSelectQuarter,
  onMouseEnter,
  onMouseLeave,
}) {
  const total = Number(quarter.positive_count || 0) + Number(quarter.negative_count || 0) + Number(quarter.neutral_count || 0)
  const positiveWidth = total > 0 ? `${(Number(quarter.positive_count || 0) / total) * 100}%` : '0%'
  const negativeWidth = total > 0 ? `${(Number(quarter.negative_count || 0) / total) * 100}%` : '0%'
  const neutralWidth = total > 0 ? `${(Number(quarter.neutral_count || 0) / total) * 100}%` : '100%'

  const cardStyle = {
    padding: '10px 12px',
    borderRadius: selected ? '0 6px 6px 0' : '6px',
    cursor: 'pointer',
    marginBottom: '2px',
    transition: 'background 150ms ease',
    background: selected ? theme.colors.amberBg : hovered ? theme.colors.bgPrimary : 'transparent',
    borderLeft: selected ? `2px solid ${theme.colors.amber}` : '2px solid transparent',
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectQuarter(quarter.quarterId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelectQuarter(quarter.quarterId)
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={cardStyle}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: selected ? 500 : 400,
            color: theme.colors.textPrimary,
            fontFamily: theme.fonts.body,
            lineHeight: 1.2,
          }}
        >
          {quarter.quarterId}
        </div>

        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '12px',
            color: getScoreColor(quarter.overall_score),
            lineHeight: 1.2,
            flexShrink: 0,
          }}
        >
          {formatScore(quarter.overall_score)}
        </div>
      </div>

      <div
        style={{
          marginTop: '6px',
          height: '3px',
          borderRadius: '2px',
          overflow: 'hidden',
          display: 'flex',
          backgroundColor: theme.colors.neutralBorder,
        }}
      >
        <div style={{ width: positiveWidth, backgroundColor: theme.colors.positive, height: '100%' }} />
        <div style={{ width: negativeWidth, backgroundColor: theme.colors.negative, height: '100%' }} />
        <div style={{ width: neutralWidth, backgroundColor: theme.colors.neutralBorder, height: '100%' }} />
      </div>

      {quarter.guidance_drift_alert ? (
        <div
          style={{
            marginTop: '5px',
            fontSize: '10px',
            color: theme.colors.negative,
            lineHeight: 1.2,
          }}
        >
          ⚠ Guidance drift
        </div>
      ) : null}
    </div>
  )
}

export default function QuarterSidebar({ companyId, companyName, sector, quarters, selectedQuarter, onSelectQuarter }) {
  const [hoveredQuarterId, setHoveredQuarterId] = useState(null)

  const sortedQuarters = quarters || []

  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        backgroundColor: theme.colors.bgSurface,
        borderRight: `1px solid ${theme.colors.border}`,
        height: '100%',
        overflowY: 'auto',
        padding: '20px 0',
      }}
      aria-label={`${companyName || 'Company'} quarter navigation`}
      data-company-id={companyId}
    >
      <div
        style={{
          padding: '0 16px 16px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: theme.colors.navy,
            fontFamily: theme.fonts.body,
            lineHeight: 1.2,
          }}
        >
          {companyId}
        </div>

        <div
          style={{
            fontSize: '11px',
            color: theme.colors.textMuted,
            marginTop: '2px',
            lineHeight: 1.3,
            fontFamily: theme.fonts.body,
          }}
        >
          {companyName}
        </div>

        <div
          style={{
            marginTop: '8px',
            display: 'inline-block',
            fontSize: '10px',
            color: theme.colors.amber,
            backgroundColor: theme.colors.amberBg,
            border: `1px solid ${theme.colors.amberBorder}`,
            padding: '2px 8px',
            borderRadius: '3px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            lineHeight: 1.2,
            fontFamily: theme.fonts.body,
          }}
        >
          {sector}
        </div>
      </div>

      <div
        style={{
          padding: '16px 16px 8px 16px',
          fontSize: '10px',
          color: theme.colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: theme.fonts.mono,
          lineHeight: 1.2,
        }}
      >
        Quarters
      </div>

      <div style={{ padding: '4px 8px' }}>
        {sortedQuarters.length === 0 ? (
          <div
            style={{
              color: theme.colors.textTertiary,
              fontSize: '12px',
              padding: '16px',
              fontFamily: theme.fonts.body,
              lineHeight: 1.4,
            }}
          >
            No quarters processed yet
          </div>
        ) : (
          sortedQuarters.map((quarter) => {
            const selected = quarter.quarterId === selectedQuarter
            const hovered = hoveredQuarterId === quarter.quarterId

            return (
              <QuarterCard
                key={quarter.quarterId}
                quarter={quarter}
                selected={selected}
                hovered={hovered}
                onSelectQuarter={onSelectQuarter}
                onMouseEnter={() => setHoveredQuarterId(quarter.quarterId)}
                onMouseLeave={() => setHoveredQuarterId((current) => (current === quarter.quarterId ? null : current))}
              />
            )
          })
        )}
      </div>
    </aside>
  )
}