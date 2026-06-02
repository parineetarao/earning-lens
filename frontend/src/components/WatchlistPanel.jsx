import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useWatchlist from '../hooks/useWatchlist'

export default function WatchlistPanel({ open, onClose }) {
  const { watchlist, removeFromWatchlist } = useWatchlist()
  const navigate = useNavigate()

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 200,
          animation: 'backdropIn 150ms ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '320px',
          background: '#FFFFFF',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          animation: 'slideIn 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 20px 16px 20px',
            borderBottom: '1px solid #E4E7EE',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{
              fontSize: '10px',
              color: '#9CA3AF',
              fontFamily: 'Space Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}>
              WATCHLIST
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0C1628',
              fontFamily: 'Inter, sans-serif',
            }}>
              {watchlist.length} {watchlist.length === 1 ? 'company' : 'companies'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#9CA3AF',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Alert banner if watchlist has items */}
        {watchlist.length > 0 && (
          <div
            style={{
              margin: '12px 16px 0 16px',
              padding: '10px 14px',
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#78350F',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 600 }}>Transcripts update quarterly.</span>
            {' '}New data appears here when processed.
          </div>
        )}

        {/* Company list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {watchlist.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>☆</div>
              No companies watched yet.
              <br />
              Click the Watch button on any
              <br />
              transcript page to add it here.
            </div>
          ) : (
            watchlist.map((companyId) => (
              <div
                key={companyId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #F3F4F6',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  navigate(`/company/${companyId}/Q4_FY25`)
                  onClose()
                }}
              >
                {/* Logo mark */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    background: '#F1F5F9',
                    border: '1px solid #E4E7EE',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: 700,
                    color: '#374151',
                    flexShrink: 0,
                  }}
                >
                  {companyId.slice(0, 2)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0C1628',
                    fontFamily: 'Space Mono, monospace',
                  }}>
                    {companyId}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#9CA3AF',
                    fontFamily: 'Inter, sans-serif',
                    marginTop: '2px',
                  }}>
                    Q4 FY25 · latest available
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromWatchlist(companyId)
                  }}
                  title="Remove from watchlist"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#D1D5DB',
                    fontSize: '16px',
                    padding: '4px',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {watchlist.length > 0 && (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #E4E7EE',
              fontSize: '11px',
              color: '#9CA3AF',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Watchlist is saved in your browser.
            <br />
            Clears if you clear browser storage.
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
