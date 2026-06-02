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

const ASPECT_ORDER = ['revenue', 'margins', 'guidance', 'competition', 'macro']

const ASPECT_COLORS = {
  revenue: '#2ECC87',
  margins: '#FFA502',
  guidance: '#378ADD',
  competition: '#FF4757',
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
        backgroundColor: '#0D1410',
        border: '0.5px solid #1E2E26',
        borderRadius: '6px',
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#4A6354',
          marginBottom: '6px',
          lineHeight: 1.2,
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
                  minWidth: '180px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#8FA897',
                      lineHeight: 1.2,
                    }}
                  >
                    {ASPECT_LABELS[aspect] || aspect}
                  </span>
                </div>

                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '12px',
                    color: '#E8F0EB',
                    lineHeight: 1.2,
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
        gap: '12px',
        justifyContent: 'center',
        marginTop: '12px',
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
                  width: '12px',
                  height: '2px',
                  backgroundColor: ASPECT_COLORS[aspect],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: '#8FA897',
                  lineHeight: 1.2,
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
            color: '#4A6354',
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: 1.4,
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
            <CartesianGrid stroke="#1E2E26" strokeDasharray="3 3" />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 10, fill: '#4A6354' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0.2, 1.0]}
              ticks={TICKS}
              tick={{ fontSize: 10, fill: '#4A6354' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={renderTooltip} />
            <Legend content={renderLegend} />
            {selectedQuarterLabel ? (
              <ReferenceLine
                x={selectedQuarterLabel}
                stroke="#2ECC87"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            ) : null}
            {ASPECT_ORDER.map((aspect) => (
              <Line
                key={aspect}
                type="monotone"
                dataKey={aspect}
                stroke={ASPECT_COLORS[aspect]}
                strokeWidth={1.5}
                dot={{ r: 3, fill: ASPECT_COLORS[aspect], stroke: ASPECT_COLORS[aspect], strokeWidth: 1 }}
                activeDot={{ r: 4, fill: ASPECT_COLORS[aspect], stroke: ASPECT_COLORS[aspect], strokeWidth: 1 }}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}