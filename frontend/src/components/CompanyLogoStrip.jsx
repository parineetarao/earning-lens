import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const COMPANIES = [
  { ticker: 'TCS',        name: 'Tata Consultancy Services' },
  { ticker: 'HDFCBANK',   name: 'HDFC Bank' },
  { ticker: 'RELIANCE',   name: 'Reliance Industries' },
  { ticker: 'WIPRO',      name: 'Wipro' },
  { ticker: 'HCLTECH',    name: 'HCL Technologies' },
  { ticker: 'ICICIBANK',  name: 'ICICI Bank' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever' },
  { ticker: 'SBIN',       name: 'State Bank of India' },
  { ticker: 'DRREDDY',    name: "Dr. Reddy's" },
  { ticker: 'BAJAJAUTO',  name: 'Bajaj Auto' },
  { ticker: 'EICHERMOT',  name: 'Eicher Motors' },
  { ticker: 'HEROMOTOCO', name: 'Hero MotoCorp' },
  { ticker: 'BRITANNIA',  name: 'Britannia Industries' },
  { ticker: 'CIPLA',      name: 'Cipla' },
  { ticker: 'DIVISLAB',   name: "Divi's Laboratories" },
  { ticker: 'ULTRACEMCO', name: 'UltraTech Cement' },
  { ticker: 'AMBUJACEM',  name: 'Ambuja Cements' },
  { ticker: 'HINDALCO',   name: 'Hindalco Industries' },
  { ticker: 'MARICO',     name: 'Marico' },
  { ticker: 'TECHM',      name: 'Tech Mahindra' },
  { ticker: 'LTIM',       name: 'LTIMindtree' },
  { ticker: 'NESTLEIND',  name: 'Nestle India' },
  { ticker: 'SUNPHARMA',  name: 'Sun Pharma' },
  { ticker: 'NTPC',       name: 'NTPC' },
  { ticker: 'SAIL',       name: 'SAIL' },
  { ticker: 'JINDALSTEL', name: 'Jindal Steel & Power' },
  { ticker: 'ACCLTD',     name: 'ACC Limited' },
  { ticker: 'MM',         name: 'Mahindra & Mahindra' },
  { ticker: 'ADANIGREEN', name: 'Adani Green Energy' },
  { ticker: 'AUROPHARMA', name: 'Aurobindo Pharma' },
  { ticker: 'SHREECEM',   name: 'Shree Cement' },
  { ticker: 'DABUR',      name: 'Dabur India' },
  { ticker: 'AXISBANK',   name: 'Axis Bank' },
  { ticker: 'INDUSINDBK', name: 'IndusInd Bank' },
  { ticker: 'JSWSTEEL',   name: 'JSW Steel' },
  { ticker: 'MARUTI',     name: 'Maruti Suzuki' },
  { ticker: 'DALMIACEM',  name: 'Dalmia Bharat' },
  { ticker: 'ONGC',       name: 'ONGC' },
  { ticker: 'TATASTEEL',  name: 'Tata Steel' },
]

function LogoItem({ ticker, name }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <div
      onClick={() => navigate(`/company/${ticker}/Q4_FY25`)}
      title={name}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '0 44px',
        height: '100%',
        cursor: 'pointer',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: 'opacity 150ms ease',
        opacity: 0.75,
        flexShrink: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
    >
      {!imgError ? (
        <img
          src={`/logos/${ticker}.png`}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            height: '52px',
            width: 'auto',
            maxWidth: '140px',
            objectFit: 'contain',
            display: 'block',
            opacity: 1,
            transition: 'transform 150ms ease',
          }}
        />
      ) : (
        <div
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            padding: '0 14px',
            fontFamily: 'Space Mono, monospace',
            fontSize: '11px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          {ticker}
        </div>
      )}
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          color: 'rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap',
          maxWidth: '140px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
        }}
      >
        {name}
      </span>
    </div>
  )
}

export default function CompanyLogoStrip() {
  const doubled = [...COMPANIES, ...COMPANIES]

  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        height: '120px',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Left gradient mask */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '140px',
          background: 'linear-gradient(to right, #0C1628, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Right gradient mask */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '140px',
          background: 'linear-gradient(to left, #0C1628, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Scrolling track */}
      <div
        style={{
          display: 'flex',
          height: '100%',
          animation: 'logoScroll 55s linear infinite',
          width: 'max-content',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.animationPlayState = 'paused'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.animationPlayState = 'running'
        }}
      >
        {doubled.map((company, index) => (
          <LogoItem
            key={`${company.ticker}-${index}`}
            ticker={company.ticker}
            name={company.name}
          />
        ))}
      </div>

      <style>{`
        @keyframes logoScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
