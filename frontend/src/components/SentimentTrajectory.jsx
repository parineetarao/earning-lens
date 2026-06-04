import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { collection, getDocs } from 'firebase/firestore'

import { db } from '../firebase'
import { theme } from '../theme'

const ASPECT_ORDER = ['revenue', 'margins', 'guidance', 'competition', 'macro']

const ASPECT_COLORS = {
  revenue: theme.colors.positive,
  margins: theme.colors.warning,
  guidance: theme.colors.navy,
  competition: theme.colors.negative,
  macro: '#9B59B6',
}

const ASPECT_LABELS = {
  revenue: 'Revenue',
  margins: 'Margins',
  guidance: 'Guidance',
  competition: 'Competition',
  macro: 'Macro',
}

const TICKS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

function formatQuarterLabel(quarterId) {
  const value = String(quarterId ?? '').trim()

  if (!value) {
    return ''
  }

  return value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseQuarterSortKey(quarterId) {
  const normalized = String(quarterId ?? '').trim().replace(/\s+/g, '_')
  const match = normalized.match(/^Q([1-4])_FY(\d{2,4})$/i)

  if (!match) {
    return {
      year: Number.POSITIVE_INFINITY,
      quarter: Number.POSITIVE_INFINITY,
      fallback: normalized,
    }
  }

  const quarter = Number(match[1])
  const fiscalYear = Number(match[2])
  const year = fiscalYear < 100 ? 2000 + fiscalYear : fiscalYear

  return {
    year,
    quarter,
    fallback: normalized,
  }
}

function sortQuarters(left, right) {
  const leftKey = parseQuarterSortKey(left.quarterId)
  const rightKey = parseQuarterSortKey(right.quarterId)

  if (leftKey.year !== rightKey.year) {
    return leftKey.year - rightKey.year
  }

  if (leftKey.quarter !== rightKey.quarter) {
    return leftKey.quarter - rightKey.quarter
  }

  return leftKey.fallback.localeCompare(rightKey.fallback)
}

function getAspectScore(aspectScores, aspect) {
  const aspectEntry = aspectScores?.[aspect]
  const value = Number(aspectEntry?.score ?? aspectEntry)

  return Number.isFinite(value) ? value : 0.5
}

function renderTooltip({ active, payload, label }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '6px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: theme.colors.textSecondary,
          marginBottom: '6px',
          lineHeight: 1.2,
          fontFamily: theme.fonts.body,
        }}
      >
        {label}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {payload
          .filter((entry) => entry?.dataKey && ASPECT_ORDER.includes(entry.dataKey))
          .map((entry) => {
            const aspect = entry.dataKey
            const color = ASPECT_COLORS[aspect]
            const numericValue = Number(entry?.value)
            const displayValue = Number.isFinite(numericValue) ? numericValue.toFixed(2) : '--'

            return (
              <div
                key={aspect}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  minWidth: '160px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: theme.colors.textSecondary,
                      lineHeight: 1.2,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    {ASPECT_LABELS[aspect] || aspect}
                  </span>
                </div>

                <span
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: '12px',
                    color: '#000000',
                    lineHeight: 1.2,
                    fontWeight: 600,
                  }}
                >
                  {displayValue}
                </span>
              </div>
            )
          })}
      </div>
    </div>
  )
}

function renderLegend({ payload }) {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center',
        marginTop: '16px',
      }}
    >
      {payload
        .filter((entry) => entry?.dataKey && ASPECT_ORDER.includes(entry.dataKey))
        .map((entry) => {
          const aspect = entry.dataKey

          return (
            <div
              key={aspect}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: ASPECT_COLORS[aspect],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: theme.colors.textSecondary,
                  lineHeight: 1.2,
                  fontFamily: theme.fonts.body,
                }}
              >
                {ASPECT_LABELS[aspect] || aspect}
              </span>
            </div>
          )
        })}
    </div>
  )
}

export default function SentimentTrajectory({ companyId, selectedQuarterId }) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadTrajectory() {
      const normalizedCompanyId = String(companyId ?? '').trim()

      if (!normalizedCompanyId) {
        setChartData([])
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const quartersCollection = collection(db, 'companies', normalizedCompanyId, 'quarters')
        const snapshot = await getDocs(quartersCollection)

        const nextChartData = snapshot.docs
          .map((quarterDoc) => {
            const quarterId = quarterDoc.id
            const quarterData = quarterDoc.data() || {}
            const aspectScores = quarterData.aspect_scores || {}

            return {
              quarterId,
              quarter: formatQuarterLabel(quarterId),
              revenue: getAspectScore(aspectScores, 'revenue'),
              margins: getAspectScore(aspectScores, 'margins'),
              guidance: getAspectScore(aspectScores, 'guidance'),
              competition: getAspectScore(aspectScores, 'competition'),
              macro: getAspectScore(aspectScores, 'macro'),
            }
          })
          .sort(sortQuarters)

        if (!isActive) {
          return
        }

        setChartData(nextChartData)
      } catch (error) {
        if (!isActive) {
          return
        }

        setChartData([])
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadTrajectory()

    return () => {
      isActive = false
    }
  }, [companyId])

  const selectedQuarterLabel = formatQuarterLabel(selectedQuarterId)

  if (loading) {
    return (
      <section
        style={{
          padding: '20px 0',
        }}
      >
        <div
          style={{
            color: theme.colors.textMuted,
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: 1.4,
            fontFamily: theme.fonts.body,
          }}
        >
          Loading trajectory data...
        </div>
      </section>
    )
  }

  return (
    <section
      style={{
        padding: '20px 0',
      }}
      aria-label="Sentiment trajectory"
    >
      <div style={{ width: '100%', height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.colors.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 10, fill: theme.colors.textTertiary, fontFamily: theme.fonts.mono }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              domain={[0.2, 1.0]}
              ticks={TICKS}
              tick={{ fontSize: 10, fill: theme.colors.textTertiary, fontFamily: theme.fonts.mono }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={renderTooltip} />
            <Legend content={renderLegend} />
            {selectedQuarterLabel ? (
              <ReferenceLine
                x={selectedQuarterLabel}
                stroke={theme.colors.amber}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            ) : null}
            {ASPECT_ORDER.map((aspect) => (
              <Line
                key={aspect}
                type="monotone"
                dataKey={aspect}
                stroke={ASPECT_COLORS[aspect]}
                strokeWidth={2}
                dot={{ r: 3, fill: ASPECT_COLORS[aspect], strokeWidth: 0 }}
                activeDot={{ r: 5, fill: ASPECT_COLORS[aspect], stroke: '#FFF', strokeWidth: 2 }}
                connectNulls={true}
                animationDuration={800}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}