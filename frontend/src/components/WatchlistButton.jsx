import { useState } from 'react'
import useWatchlist from '../hooks/useWatchlist'

export default function WatchlistButton({ companyId, companyName }) {
  const { isWatched, toggleWatchlist } = useWatchlist()
  const [justAdded, setJustAdded] = useState(false)

  const watched = isWatched(companyId)

  const handleClick = () => {
    toggleWatchlist(companyId)
    if (!watched) {
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleClick}
        title={watched ? `Remove ${companyId} from watchlist` : `Add ${companyId} to watchlist`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          background: watched ? '#FEF3C7' : 'transparent',
          border: `1px solid ${watched ? '#FCD34D' : '#E4E7EE'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          color: watched ? '#78350F' : '#6B7280',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!watched) {
            e.currentTarget.style.borderColor = '#FCD34D'
            e.currentTarget.style.color = '#78350F'
          }
        }}
        onMouseLeave={e => {
          if (!watched) {
            e.currentTarget.style.borderColor = '#E4E7EE'
            e.currentTarget.style.color = '#6B7280'
          }
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill={watched ? '#C8922A' : 'none'}
          stroke={watched ? '#C8922A' : '#9CA3AF'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'all 200ms ease', flexShrink: 0 }}
        >
          <path d="M7 1L8.854 5.09L13.5 5.635L10.25 8.59L11.09 13L7 10.75L2.91 13L3.75 8.59L0.5 5.635L5.146 5.09L7 1Z" />
        </svg>
        {watched ? 'Watching' : 'Watch'}
      </button>

      {justAdded && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0C1628',
            color: '#FFFFFF',
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            padding: '5px 12px',
            borderRadius: '5px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'tooltipFadeIn 200ms ease',
            zIndex: 100,
          }}
        >
          Added to watchlist
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #0C1628',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
