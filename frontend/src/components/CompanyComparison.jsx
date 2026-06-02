import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { collection, getDocs } from 'firebase/firestore'

import { db } from '../firebase'
import { theme } from '../theme'

const QUARTER_IDS = ['Q1_FY24', 'Q2_FY24', 'Q3_FY24', 'Q4_FY24', 'Q1_FY25', 'Q2_FY25', 'Q3_FY25', 'Q4_FY25']
const MOST_RECENT = QUARTER_IDS[QUARTER_IDS.length - 1]

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

const SERIES_COLORS = {
  a: theme.colors.positive,
  b: theme.colors.amber,
}

const containerStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 0,
  borderTop: `1px solid ${theme.colors.border}`,
  padding: '24px 20px 20px 20px',
  boxSizing: 'border-box',
  minWidth: 0,
}

const selectStyle = {
  flex: 1,
  minWidth: 0,
  fontSize: '13px',
  backgroundColor: theme.colors.bgSurface,
  color: theme.colors.textPrimary,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '6px',
  padding: '6px 12px',
  fontFamily: theme.fonts.body,
  outline: 'none',
  boxSizing: 'border-box',
}

function normalizeCompanies(companies) {
  return Array.isArray(companies)
    ? companies.map((company) => String(company ?? '').trim()).filter(Boolean)
    : []
}

function formatQuarterLabel(quarterId) {
  return QUARTER_LABELS[quarterId] || quarterId.replace('_', ' ')
}

function formatScore(score) {
  const numericScore = Number(score)

  if (!Number.isFinite(numericScore)) {
    return '—'
  }

  return numericScore.toFixed(2)
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.bgSurface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '6px',
        padding: '10px 14px',
        boxSizing: 'border-box',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: theme.colors.textTertiary,
          marginBottom: '6px',
          fontFamily: theme.fonts.body,
        }}
      >
        {label}
      </div>

      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            lineHeight: 1.4,
            marginTop: entry.index === 0 ? 0 : '4px',
          }}
        >
          <span style={{ color: entry.color, fontSize: '13px', fontFamily: theme.fonts.mono }}>
            {entry.name}
          </span>
          <span style={{ color: theme.colors.textPrimary, fontSize: '13px', fontFamily: theme.fonts.mono }}>
            {formatScore(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CompanyLegend({ companyA, companyB }) {
  const items = [
    { ticker: companyA, color: SERIES_COLORS.a },
    { ticker: companyB, color: SERIES_COLORS.b },
  ].filter((item) => Boolean(item.ticker))

  if (items.length === 0) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        marginTop: '12px',
        flexWrap: 'wrap',
      }}
    >
      {items.map((item) => (
        <div
          key={item.ticker}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.body,
            lineHeight: 1.2,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              backgroundColor: item.color,
              flexShrink: 0,
            }}
          />
          <span>{item.ticker}</span>
        </div>
      ))}
    </div>
  )
}

export default function CompanyComparison({ companies = [] }) {
  const companyList = useMemo(() => normalizeCompanies(companies), [companies])
  const [companyA, setCompanyA] = useState(companyList[0] || '')
  const [companyB, setCompanyB] = useState(companyList[1] || '')
  const [scoresByCompany, setScoresByCompany] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCompanyA((currentCompanyA) => {
      if (companyList.includes(currentCompanyA)) {
        return currentCompanyA
      }

      return companyList[0] || ''
    })

    setCompanyB((currentCompanyB) => {
      if (companyList.includes(currentCompanyB)) {
        return currentCompanyB
      }

      return companyList[1] || companyList[0] || ''
    })
  }, [companyList])

  useEffect(() => {
    let isActive = true

    async function loadQuarterScores() {
      const selectedCompanies = [companyA, companyB].filter(Boolean)

      if (selectedCompanies.length === 0) {
        setScoresByCompany({})
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const entries = await Promise.all(
          selectedCompanies.map(async (companyId) => {
            const quartersCollection = collection(db, 'companies', companyId, 'quarters')
            const snapshot = await getDocs(quartersCollection)

            const quarterScores = {}

            snapshot.forEach((quarterDoc) => {
              const quarterId = quarterDoc.id
              const quarterData = quarterDoc.data() || {}
              quarterScores[quarterId] = Number(quarterData.overall_score)
            })

            return [companyId, quarterScores]
          })
        )

        if (!isActive) {
          return
        }

        setScoresByCompany(Object.fromEntries(entries))
      } catch (error) {
        if (!isActive) {
          return
        }

        setScoresByCompany({})
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadQuarterScores()

    return () => {
      isActive = false
    }
  }, [companyA, companyB])

  const chartData = useMemo(() => {
    return QUARTER_IDS.map((quarterId) => ({
      quarter: formatQuarterLabel(quarterId),
      [companyA]: companyA ? scoresByCompany[companyA]?.[quarterId] ?? null : null,
      [companyB]: companyB ? scoresByCompany[companyB]?.[quarterId] ?? null : null,
    }))
  }, [companyA, companyB, scoresByCompany])

  const comparisonText = useMemo(() => {
    const scoreA = Number(scoresByCompany[companyA]?.[MOST_RECENT])
    const scoreB = Number(scoresByCompany[companyB]?.[MOST_RECENT])

    if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) {
      return {
        text: 'Latest quarter data unavailable for one or both companies.',
        color: theme.colors.textMuted,
      }
    }

    const diff = scoreA - scoreB
    if (diff > 0.05) {
      return {
        text: `${companyA} is outperforming ${companyB} by ${diff.toFixed(2)} points in the most recent quarter.`,
        color: theme.colors.positive,
      }
    }
    if (diff < -0.05) {
      return {
        text: `${companyA} is underperforming ${companyB} by ${Math.abs(diff).toFixed(2)} points in the most recent quarter.`,
        color: theme.colors.negative,
      }
    }

    return {
      text: `Both companies are tracking within ${diff.toFixed(2)} of each other — tone is broadly aligned.`,
      color: theme.colors.textMuted,
    }
  }, [companyA, companyB, scoresByCompany])

  if (companyList.length === 0) {
    return (
      <section style={containerStyle}>
        <div
          style={{
            color: theme.colors.textMuted,
            fontSize: '13px',
            fontFamily: theme.fonts.body,
          }}
        >
          No companies available for comparison.
        </div>
      </section>
    )
  }

  return (
    <section style={containerStyle} aria-label="Company sentiment comparison">
      <div
        style={{
          fontSize: '12px',
          fontFamily: theme.fonts.body,
          color: comparisonText.color,
          marginBottom: '14px',
        }}
      >
        {comparisonText.text}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          alignItems: 'center',
        }}
      >
        <select value={companyA} onChange={(event) => setCompanyA(event.target.value)} style={selectStyle}>
          {companyList.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>

        <span
          style={{
            fontSize: '12px',
            color: theme.colors.textTertiary,
            flexShrink: 0,
            fontFamily: theme.fonts.body,
          }}
        >
          vs
        </span>

        <select value={companyB} onChange={(event) => setCompanyB(event.target.value)} style={selectStyle}>
          {companyList.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      <div style={{ width: '100%', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke={theme.colors.border} strokeDasharray="3 3" />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 10, fill: theme.colors.textTertiary }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0.3, 1]}
              tick={{ fontSize: 10, fill: theme.colors.textTertiary }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={() => <CompanyLegend companyA={companyA} companyB={companyB} />} />
            <Line
              type="monotone"
              dataKey={companyA}
              stroke={SERIES_COLORS.a}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={companyB}
              stroke={SERIES_COLORS.b}
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {loading ? (
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
        >
          Loading comparison data...
        </div>
      ) : null}
    </section>
  )
}
