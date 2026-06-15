import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const sectorPills = [
  { id: 'steel', label: 'Steel' },
  { id: 'banking', label: 'Banking' },
  { id: 'it_services', label: 'IT Services' },
  { id: 'fmcg', label: 'FMCG' },
  { id: 'auto', label: 'Auto' },
  { id: 'pharma', label: 'Pharma' },
  { id: 'cement', label: 'Cement' },
  { id: 'energy', label: 'Energy' },
]

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0A0F0D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 20px',
    paddingTop: 'calc(32px + 52px)',
    boxSizing: 'border-box',
  },
  content: {
    width: '100%',
    maxWidth: '560px',
  },
  hero: {
    marginBottom: '24px',
  },
  tagline: {
    margin: '0 0 8px',
    fontSize: '28px',
    fontWeight: 500,
    color: '#E8F0EB',
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#8FA897',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  searchWrap: {
    width: '100%',
  },
  searchInput: {
    width: '100%',
    height: '48px',
    backgroundColor: '#0D1410',
    border: '0.5px solid #1E2E26',
    borderRadius: '8px',
    padding: '0 16px',
    fontSize: '14px',
    color: '#E8F0EB',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease',
  },
  loading: {
    marginTop: '14px',
    color: '#4A6354',
    fontSize: '13px',
    textAlign: 'center',
  },
  error: {
    marginTop: '14px',
    color: '#FF4757',
    fontSize: '13px',
    textAlign: 'center',
  },
  dropdown: {
    marginTop: '4px',
    backgroundColor: '#0D1410',
    border: '0.5px solid #1E2E26',
    borderRadius: '8px',
    maxHeight: '280px',
    overflowY: 'auto',
  },
  resultRow: {
    padding: '12px 16px',
    borderBottom: '0.5px solid #1E2E26',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  resultRowLast: {
    borderBottom: 'none',
  },
  resultLeft: {
    minWidth: 0,
    marginRight: '12px',
    fontSize: '13px',
    color: '#8FA897',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ticker: {
    color: '#E8F0EB',
    fontWeight: 500,
  },
  sector: {
    flexShrink: 0,
    color: '#4A6354',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  sectorLabel: {
    marginTop: '32px',
    marginBottom: '12px',
    color: '#4A6354',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'center',
  },
  pillWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
  },
  pill: {
    padding: '6px 16px',
    borderRadius: '20px',
    border: '0.5px solid #1E2E26',
    fontSize: '12px',
    color: '#8FA897',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    transition: 'border-color 150ms ease, color 150ms ease, background-color 150ms ease',
  },
}

function formatSectorLabel(sector) {
  if (!sector) {
    return 'UNKNOWN'
  }

  return sector.replace(/_/g, ' ').toUpperCase()
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadCompanies() {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch('http://localhost:8000/api/companies', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()
        const companyList = Array.isArray(data?.companies)
          ? data.companies
          : Array.isArray(data)
            ? data
            : []

        setCompanies(companyList)
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError('Could not load companies. Is the backend running?')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadCompanies()

    return () => controller.abort()
  }, [])

  const filteredCompanies = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase()

    if (!trimmedQuery) {
      return []
    }

    return companies.filter((company) => {
      const ticker = String(company?.ticker ?? '').toLowerCase()
      const name = String(company?.name ?? '').toLowerCase()

      return ticker.includes(trimmedQuery) || name.includes(trimmedQuery)
    })
  }, [companies, query])

  const showResults = query.trim().length > 0 && !isLoading && !error
  const showPills = query.trim().length === 0

  return (
    <section style={styles.page}>
      <div style={styles.content}>
        <div style={styles.hero}>
          <h1 style={styles.tagline}>Earnings Call Intelligence</h1>
          <p style={styles.subtitle}>
            Sentence-level FinBERT sentiment analysis across 35 NSE-listed companies and 8 quarters
          </p>
        </div>

        <div style={styles.searchWrap}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company — TCS, HDFCBANK, RELIANCE..."
            style={styles.searchInput}
            onFocus={(event) => {
              event.currentTarget.style.borderColor = '#2ECC87'
            }}
            onBlur={(event) => {
              event.currentTarget.style.borderColor = '#1E2E26'
            }}
          />

          {isLoading ? <div style={styles.loading}>Loading companies...</div> : null}
          {error ? <div style={styles.error}>{error}</div> : null}

          {showResults && filteredCompanies.length > 0 ? (
            <div style={styles.dropdown}>
              {filteredCompanies.map((company, index) => {
                const ticker = String(company?.ticker ?? '').trim()
                const name = String(company?.name ?? '').trim()
                const sector = formatSectorLabel(company?.sector)
                const isLast = index === filteredCompanies.length - 1

                return (
                  <div
                    key={`${ticker}-${name}`}
                    style={{
                      ...styles.resultRow,
                      ...(isLast ? styles.resultRowLast : null),
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = '#111A14'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => navigate(`/company/${ticker}/Q4_FY25`)}
                  >
                    <div style={styles.resultLeft}>
                      <span style={styles.ticker}>{ticker}</span>
                      {' — '}
                      <span>{name}</span>
                    </div>
                    <div style={styles.sector}>{sector}</div>
                  </div>
                )
              })}
            </div>
          ) : null}

          {showPills ? (
            <>
              <div style={styles.sectorLabel}>Browse by sector</div>
              <div style={styles.pillWrap}>
                {sectorPills.map((sector) => (
                  <button
                    key={sector.id}
                    type="button"
                    style={styles.pill}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.borderColor = '#2ECC87'
                      event.currentTarget.style.color = '#2ECC87'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.borderColor = '#1E2E26'
                      event.currentTarget.style.color = '#8FA897'
                    }}
                    onClick={() => navigate(`/sector/${sector.id}`)}
                  >
                    {sector.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
