import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import WatchlistPanel from './WatchlistPanel'
import useWatchlist from '../hooks/useWatchlist'

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

function formatSectorLabel(sector) {
  if (!sector) {
    return 'UNKNOWN'
  }

  return sector.replace(/_/g, ' ').toUpperCase()
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchHover, setSearchHover] = useState(false)
  const [watchlistOpen, setWatchlistOpen] = useState(false)
  const [watchlistHover, setWatchlistHover] = useState(false)
  const [query, setQuery] = useState('')
  const [companies, setCompanies] = useState([])

  const { count } = useWatchlist()

  useEffect(() => {
    const handler = () => setSearchOpen(true)
    document.addEventListener('openSearch', handler)
    return () => document.removeEventListener('openSearch', handler)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadCompanies() {
      try {
        const response = await fetch('https://earninglens-backend.onrender.com/api/companies', {
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
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCompanies([])
        }
      }
    }

    loadCompanies()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!searchOpen) {
      setQuery('')
      return
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeydown)

    return () => window.removeEventListener('keydown', handleKeydown)
  }, [searchOpen])

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

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

  const isSectorActive = location.pathname.startsWith('/sector/')
  const showResults = query.trim().length >= 1
  const searchIconColor = searchHover ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.6)'

  const navLinkStyle = (active) => ({
    fontSize: '13px',
    color: active ? '#C8922A' : 'rgba(255,255,255,0.6)',
    fontWeight: 500,
    padding: '6px 12px',
    textDecoration: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    lineHeight: 1,
    transition: 'color 160ms ease',
  })

  return (
    <>
      <style>
        {'@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}.search-overlay-input::placeholder{color:rgba(255,255,255,0.3);}'}
      </style>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          backgroundColor: '#0C1628',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              navigate('/')
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              backgroundColor: '#C8922A',
              color: '#FFFFFF',
              fontFamily: 'Space Mono, monospace',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            EL
          </div>
          <div
            style={{
              marginLeft: '10px',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            EarningLens
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
            }}
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 500,
              padding: '6px 12px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              border: 'none',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1,
              transition: 'color 160ms ease',
            }}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            onMouseEnter={() => setSearchHover(true)}
            onMouseLeave={() => setSearchHover(false)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: searchIconColor,
            }}
            aria-label="Open search"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Watchlist Icon Button */}
          <button
            type="button"
            onClick={() => setWatchlistOpen(true)}
            onMouseEnter={() => setWatchlistHover(true)}
            onMouseLeave={() => setWatchlistHover(false)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: watchlistHover ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.6)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Open watchlist"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 1L8.854 5.09L13.5 5.635L10.25 8.59L11.09 13L7 10.75L2.91 13L3.75 8.59L0.5 5.635L5.146 5.09L7 1Z" />
            </svg>
            {count > 0 && (
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#C8922A',
                border: '1px solid #0C1628',
              }} />
            )}
          </button>

          <a
            href="/sector/it_services"
            onClick={(event) => {
              event.preventDefault()
              navigate('/sector/it_services')
            }}
            onMouseEnter={(event) => {
              if (!isSectorActive) {
                event.currentTarget.style.color = 'rgba(255,255,255,1)'
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = isSectorActive ? '#C8922A' : 'rgba(255,255,255,0.6)'
            }}
            style={navLinkStyle(isSectorActive)}
          >
            Sectors
          </a>
        </nav>
      </header>

      <WatchlistPanel open={watchlistOpen} onClose={() => setWatchlistOpen(false)} />

      {searchOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(10, 18, 40, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '80px',
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '24px',
              lineHeight: 1,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
            aria-label="Close search"
          >
            ×
          </button>

          <div style={{ width: '560px', maxWidth: '90%', position: 'relative' }}>
            <input
              ref={inputRef}
              className="search-overlay-input"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company — TCS, HDFCBANK, RELIANCE..."
              style={{
                width: '100%',
                height: '56px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '0 20px 0 48px',
                fontSize: '16px',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(event) => {
                event.currentTarget.style.borderColor = 'rgba(200,146,42,0.6)'
              }}
              onBlur={(event) => {
                event.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {showResults && filteredCompanies.length > 0 ? (
            <div
              style={{
                marginTop: '8px',
                width: '560px',
                maxWidth: '90%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                maxHeight: '320px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent',
              }}
            >
              {filteredCompanies.map((company) => {
                const ticker = String(company?.ticker ?? '').trim()
                const name = String(company?.name ?? '').trim()
                const sector = formatSectorLabel(company?.sector)

                return (
                  <div
                    key={`${ticker}-${name}`}
                    role="button"
                    tabIndex={0}
                    style={{
                      padding: '14px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      transition: 'background 100ms ease',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'transparent'
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        navigate(`/company/${ticker}/Q4_FY25`)
                        setSearchOpen(false)
                        setQuery('')
                      }
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      navigate(`/company/${ticker}/Q4_FY25`)
                      setSearchOpen(false)
                      setQuery('')
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        marginRight: '12px',
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.7)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <span
                        style={{
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontFamily: 'Space Mono, monospace',
                          fontSize: '14px',
                        }}
                      >
                        {ticker}
                      </span>
                      {' — '}
                      <span>{name}</span>
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        color: 'rgba(200,146,42,0.8)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {sector}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}

          {query.trim().length === 0 ? (
            <>
              <div
                style={{
                  marginTop: '32px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'Space Mono, monospace',
                }}
              >
                Browse by sector
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                }}
              >
                {sectorPills.map((sector) => (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => {
                      navigate(`/sector/${sector.id}`)
                      setSearchOpen(false)
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.borderColor = 'rgba(200,146,42,0.5)'
                      event.currentTarget.style.color = '#C8922A'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      event.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                    }}
                    style={{
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.5)',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'border-color 150ms ease, color 150ms ease',
                    }}
                  >
                    {sector.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
