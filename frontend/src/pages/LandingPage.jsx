import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, radius } from '../theme';
import CinematicWalkthrough from '../components/CinematicWalkthrough';

// ─── STYLES ────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
  }

  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes ripple {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
  }

  @keyframes transcriptRowIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes logoScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
`;

// ─── DATA ──────────────────────────────────────────────────────────────────
const STATS = [
  { target: 35,     label: 'Companies tracked',     suffix: '',  data: [28,29,30,32,33,34,35] },
  { target: 8,      label: 'Quarters of history',   suffix: '',  data: [50,50,50,50,50,50,50] },
  { target: 65000,  label: 'Sentences scored',      suffix: '+', data: [12000,24000,35000,42000,52000,60000,65000] },
  { target: 8,      label: 'Market sectors',        suffix: '',  data: [50,50,50,50,50,50,50] },
  { target: 259,    label: 'Transcripts processed', suffix: '',  data: [50,80,120,160,200,230,259] },
];

const SECTORS = [
  { name: 'STEEL',       tickers: ['SAIL', 'JINDALSTEL', 'NMDC', 'HINDALCO'] },
  { name: 'BANKING',     tickers: ['HDFCBANK', 'ICICIBANK', 'SBIN'] },
  { name: 'IT SERVICES', tickers: ['TCS', 'WIPRO', 'HCLTECH', 'TECHM', 'INFY'] },
  { name: 'FMCG',        tickers: ['HINDUNILVR', 'BRITANNIA', 'DABUR', 'MARICO', 'NESTLEIND'] },
  { name: 'AUTO',        tickers: ['BAJAJAUTO', 'HEROMOTOCO', 'EICHERMOT', 'MM'] },
  { name: 'PHARMA',      tickers: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'AUROPHARMA'] },
  { name: 'CEMENT',      tickers: ['ULTRACEMCO', 'AMBUJACEM', 'SHREECEM', 'ACCLTD'] },
  { name: 'ENERGY',      tickers: ['RELIANCE', 'POWERGRID', 'NTPC', 'TATAPOWER', 'ADANIGREEN'] },
];

const LOGO_COMPANIES = [
  { ticker: 'TCS',        name: 'Tata Consultancy Services', domain: 'tcs.com' },
  { ticker: 'RELIANCE',   name: 'Reliance Industries', domain: 'relianceindustries.com' },
  { ticker: 'WIPRO',      name: 'Wipro', domain: 'wipro.com' },
  { ticker: 'ICICIBANK',  name: 'ICICI Bank', domain: 'icicibank.com' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever', domain: 'hul.co.in' },
  { ticker: 'DRREDDY',    name: "Dr. Reddy's", domain: 'drreddys.com' },
  { ticker: 'BAJAJAUTO',  name: 'Bajaj Auto', domain: 'bajajauto.com' },
  { ticker: 'LTIM',       name: 'LTIMindtree', domain: 'ltimindtree.com' },
  { ticker: 'JINDALSTEL', name: 'Jindal Steel & Power', domain: 'jindalsteelpower.com' },
  { ticker: 'ADANIGREEN', name: 'Adani Green Energy', domain: 'adanigreen.com' },
  { ticker: 'DABUR',      name: 'Dabur India', domain: 'dabur.com' },
];

const SECTOR_PILLS = [
  { id: 'steel', label: 'Steel', count: 4, color: '#64748B' },
  { id: 'banking', label: 'Banking', count: 3, color: '#3B82F6' },
  { id: 'it_services', label: 'IT Services', count: 5, color: '#8B5CF6' },
  { id: 'fmcg', label: 'FMCG', count: 5, color: '#F59E0B' },
  { id: 'auto', label: 'Auto', count: 4, color: '#EF4444' },
  { id: 'pharma', label: 'Pharma', count: 5, color: '#10B981' },
  { id: 'cement', label: 'Cement', count: 4, color: '#6B7280' },
  { id: 'energy', label: 'Energy', count: 5, color: '#F97316' }
];

// ─── HELPERS ───────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const steps = Math.ceil(duration / 50)
          let step = 0
          const interval = setInterval(() => {
            step++
            setCount(Math.round((step / steps) * target))
            if (step >= steps) clearInterval(interval)
          }, 50)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

function useSectionReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(16px)'
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function getHeatmapColor(score) {
  if (score === null || score === undefined) return '#F1F5F9';
  if (score >= 0.70) return '#86EFAC';
  if (score >= 0.60) return '#BBF7D0';
  if (score >= 0.50) return '#FDE68A';
  if (score >= 0.40) return '#FCA5A5';
  return '#F87171';
}

function getTickerScores(ticker) {
  const custom = {
    'SAIL':      [0.80,0.75,0.78,0.82,0.80,0.76,0.80,0.75],
    'JINDALSTEL':[0.85,0.80,0.82,0.88,0.80,0.80,0.78,0.84],
    'NMDC':      [0.81,0.78,0.80,0.84,0.76,0.78,0.86,0.84],
    'HINDALCO':  [0.78,0.71,0.75,0.75,0.80,0.75,0.77,0.74]
  };
  if (custom[ticker]) return custom[ticker];
  
  let base = 0;
  for (let i = 0; i < ticker.length; i++) {
    base += ticker.charCodeAt(i);
  }
  
  const scores = [];
  for (let i = 0; i < 8; i++) {
    const val = 0.35 + ((base + i * 17) % 50) / 100;
    scores.push(val);
  }
  return scores;
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────

function StatBlock({ stat, last }) {
  const { count, ref } = useCountUp(stat.target, 2000)
  return (
    <div
      ref={ref}
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.08)',
        position: 'relative'
      }}
    >
      <div style={{
        fontSize: '32px',
        fontWeight: 700,
        color: '#FFFFFF',
        fontFamily: 'Space Mono, monospace',
        lineHeight: 1
      }}>
        {count.toLocaleString()}{stat.suffix}
      </div>
      <div style={{
        fontSize: '11px',
        color: 'rgba(255,255,255,0.4)',
        marginTop: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: 'Space Mono, monospace'
      }}>
        {stat.label}
      </div>
    </div>
  )
}

function BaseCard({ visible, delay, hovered, setHovered, fullWidth, children }) {
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '22px',
        position: 'relative',
        transition: `box-shadow 200ms ease, transform 200ms ease, opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-2px)' : 'translateY(0)') : 'translateY(20px)',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        gridColumn: fullWidth ? '1 / -1' : 'auto',
        display: fullWidth ? 'flex' : 'block',
        alignItems: fullWidth ? 'center' : 'stretch',
        gap: fullWidth ? '60px' : '0',
      }}
    >
      {children}
    </div>
  )
}

function FeatureIcon({ label, bg, color }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        background: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Space Mono, monospace',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        pointerEvents: 'none',
      }}
    >
      {label}
    </div>
  )
}

function Card1({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
      <FeatureIcon label="SN" bg="#FEF3C7" color="#C8922A" />
      <div style={{ height: '80px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ borderLeft: '3px solid #059669', background: '#ECFDF5', display: 'flex', alignItems: 'center', padding: '4px 8px', gap: '8px' }}>
          <span style={{ fontSize: '8px', color: '#059669', fontFamily: 'Space Mono, monospace' }}>pos</span>
          <div style={{ background: '#059669', opacity: 0.6, height: '6px', width: '120px', borderRadius: '3px' }} />
        </div>
        <div style={{ borderLeft: '3px solid #9CA3AF', background: 'transparent', display: 'flex', alignItems: 'center', padding: '4px 8px', gap: '8px' }}>
          <span style={{ fontSize: '8px', color: '#6B7280', fontFamily: 'Space Mono, monospace' }}>neu</span>
          <div style={{ background: '#9CA3AF', opacity: 0.5, height: '6px', width: '90px', borderRadius: '3px' }} />
        </div>
        <div style={{ borderLeft: '3px solid #DC2626', background: '#FEF2F2', display: 'flex', alignItems: 'center', padding: '4px 8px', gap: '8px' }}>
          <span style={{ fontSize: '8px', color: '#DC2626', fontFamily: 'Space Mono, monospace' }}>neg</span>
          <div style={{ background: '#DC2626', opacity: 0.6, height: '6px', width: '130px', borderRadius: '3px' }} />
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Sentence-Level Sentiment</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        Every sentence in every earnings call is individually scored for tone by FinBERT — not just the overall transcript.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>FinBERT · yiyanghkust/finbert-tone</div>
    </BaseCard>
  )
}

function Card2({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  const text = "Management tone deteriorated this quarter, driven primarily by cautious guidance language. The sharpest change was in the guidance section where confidence dropped from 0.71 to 0.31...";
  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    if (hovered) {
      let i = 0;
      setDisplayedText('');
      const interval = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 15);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(text);
    }
  }, [hovered, text]);

  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
      <FeatureIcon label="AI" bg="#FEF3C7" color="#C8922A" />
      <div style={{ height: '80px', marginBottom: '16px' }}>
        <div style={{
          borderLeft: '2px solid #C8922A', background: '#FEF3C7',
          padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: '10px', color: '#374151',
          lineHeight: '1.6', fontStyle: 'italic', fontFamily: 'Inter, sans-serif',
          overflow: 'hidden', maxHeight: '80px',
        }}>
          "{displayedText}"
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>AI Analyst Briefs</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        Each quarter generates a written analyst note interpreting the sentiment data and management's underlying confidence.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>Groq · LLaMA 3.1 · Automated Synthesis</div>
    </BaseCard>
  )
}

function Card3({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  const rows = [
    ['#059669', '#059669', '#10B981', '#34D399', '#059669'],
    ['#10B981', '#34D399', '#10B981', '#059669', '#10B981'],
    ['#FBBF24', '#34D399', '#10B981', '#10B981', '#34D399'],
    ['#059669', '#10B981', '#059669', '#10B981', '#059669']
  ];
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
      <FeatureIcon label="HM" bg="#ECFDF5" color="#059669" />
      <div style={{ height: '80px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 14px)', gap: '3px' }}>
          {rows.map((r, i) => r.map((c, j) => {
            const isGlow = hovered && i === 1 && j === 2;
            return <div key={`${i}-${j}`} style={{
              width: '14px', height: '14px', background: c, borderRadius: '2px',
              border: isGlow ? '1px solid #059669' : 'none',
              transform: isGlow ? 'scale(1.2)' : 'none',
              transition: 'all 200ms ease', zIndex: isGlow ? 1 : 0,
            }} />
          }))}
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Sector Intelligence Heatmap</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        See how every company in a sector compares across eight quarters in one view. Click any cell to open the full transcript.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>35 companies · 8 sectors · 8 quarters</div>
    </BaseCard>
  )
}

function Card4({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
      <FeatureIcon label="GD" bg="#FEF2F2" color="#DC2626" />
      <div style={{ height: '80px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ borderLeft: '2px solid #059669', paddingLeft: '8px' }}>
            <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>Q2 FY25</div>
            <div style={{ fontSize: '11px', color: '#059669', fontFamily: 'Space Mono, monospace', marginTop: '2px' }}>Guidance 0.71</div>
          </div>
          <div style={{ fontSize: '12px', color: '#DC2626', fontFamily: 'Space Mono, monospace' }}>→ −0.23</div>
          <div style={{ borderLeft: '2px solid #DC2626', paddingLeft: '8px' }}>
            <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>Q3 FY25</div>
            <div style={{ fontSize: '11px', color: '#DC2626', fontFamily: 'Space Mono, monospace', marginTop: '2px' }}>Guidance 0.48</div>
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <span style={{
            background: '#FEF2F2', color: '#DC2626', padding: '4px 10px', borderRadius: '3px',
            fontSize: '10px', fontFamily: 'Space Mono, monospace', animation: 'pulse 2s infinite', display: 'inline-block'
          }}>
            ⚠ GUIDANCE DRIFT ALERT
          </span>
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Guidance Drift Alerts</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        Fires automatically when guidance language becomes measurably more cautious quarter-over-quarter.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>Automated Detection · Sentiment Deltas</div>
    </BaseCard>
  )
}

function Card5({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
      <FeatureIcon label="QA" bg="#FFFBEB" color="#D97706" />
      <div style={{ height: '80px', marginBottom: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace' }}>PREPARED REMARKS</span>
            <span style={{ fontSize: '10px', color: '#059669', fontFamily: 'Space Mono, monospace' }}>0.68</span>
          </div>
          <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '68%', height: '100%', background: '#059669', transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace' }}>Q&A SESSION</span>
            <span style={{ fontSize: '10px', color: '#C8922A', fontFamily: 'Space Mono, monospace' }}>0.44</span>
          </div>
          <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '44%', height: '100%', background: '#C8922A', transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#D97706', fontFamily: 'Space Mono, monospace', marginTop: '12px' }}>
          Gap: +0.24 — perception management signal
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Prepared vs Q&A Split</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        The gap between scripted and unscripted tone reveals what management is actually concerned about.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>Boundary Detection · Multi-Section Scoring</div>
    </BaseCard>
  )
}

function Card6({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
      <FeatureIcon label="VX" bg="#F5F3FF" color="#7C3AED" />
      <div style={{ height: '80px', marginBottom: '16px', display: 'flex', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '9px', color: '#DC2626', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '6px' }}>▲ INCREASED</div>
          <div style={{ fontSize: '10px', color: '#DC2626', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>headwinds +9×</div>
          <div style={{ fontSize: '10px', color: '#DC2626', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>elevated +5×</div>
          <div style={{ fontSize: '10px', color: '#DC2626', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>cautious +4×</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#059669', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '6px' }}>▼ DECREASED</div>
          <div style={{ fontSize: '10px', color: '#059669', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>confident −8×</div>
          <div style={{ fontSize: '10px', color: '#059669', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>robust −6×</div>
          <div style={{ fontSize: '10px', color: '#059669', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>optimistic −4×</div>
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Vocabulary Shift Tracker</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        Track which words management starts using — and stops using — each quarter as a leading indicator of sentiment.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>TF-IDF Ranking · Vocabulary Deltas</div>
    </BaseCard>
  )
}

function Card7({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  const companies = [
    { name: 'TCS', score: 0.74, color: '#059669' },
    { name: 'WIPRO', score: 0.64, color: '#D97706' },
    { name: 'HCLTECH', score: 0.67, color: '#D97706' },
    { name: 'TECHM', score: 0.71, color: '#059669' },
    { name: 'LTIM', score: 0.74, color: '#059669' }
  ];
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered} fullWidth={true}>
      <div style={{ flex: 1 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#C8922A' }}>
          ≈
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E3A5F', marginTop: '16px', fontFamily: 'Inter, sans-serif' }}>Peer Relative Tone Index</div>
        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
          A sentiment score that looks acceptable in isolation can be alarming relative to what sector peers are saying in the same quarter.
        </div>
        <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '14px', fontFamily: 'Space Mono, monospace' }}>Sector Average Baselines · Relative Benchmarking</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '280px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '50%', top: '-20px', bottom: '0', borderLeft: '1px dashed #9CA3AF' }} />
        <div style={{ position: 'absolute', left: '50%', top: '-34px', transform: 'translateX(-50%)', fontSize: '9px', color: '#6B7280', fontFamily: 'Space Mono, monospace' }}>SECTOR AVG</div>
        
        {companies.map(c => {
          const width = Math.max(0, Math.min(100, (c.score - 0.58) / 0.20 * 100));
          return (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
              <div style={{ width: '60px', fontSize: '10px', color: '#6B7280', fontFamily: 'Space Mono, monospace' }}>{c.name}</div>
              <div style={{ flex: 1, height: '4px', background: '#E2E8F0', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${width}%`, background: c.color, borderRadius: '2px' }} />
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontSize: '10px', color: c.color, fontFamily: 'Space Mono, monospace' }}>{c.score}</div>
            </div>
          )
        })}
      </div>
    </BaseCard>
  )
}

function FeatureCardsGrid() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'
    }}>
      <Card1 visible={visible} delay={0} />
      <Card2 visible={visible} delay={0.1} />
      <Card3 visible={visible} delay={0.2} />
      <Card4 visible={visible} delay={0.3} />
      <Card5 visible={visible} delay={0.4} />
      <Card6 visible={visible} delay={0.5} />
      <Card7 visible={visible} delay={0.6} />
    </div>
  )
}

function StepBlock({ num, icon, iconColor, title, desc, tags, iconBg }) {
  return (
    <div>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#C8922A', display: 'block', marginBottom: '16px' }}>
        {num}
      </span>
      <div style={{
        width: '40px', height: '40px',
        background: iconBg, border: '1px solid #E2E8F0', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', color: iconColor, fontFamily: 'Space Mono, monospace',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E3A5F', marginTop: '14px', fontFamily: 'Inter, sans-serif' }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        {desc}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
        {tags.map(t => (
          <span key={t} style={{
            fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#374151',
            background: '#F1F5F9', border: '1px solid #E2E8F0',
            borderRadius: '3px', padding: '2px 8px',
          }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function SectorHeatmapCard({ sector, navigate, index, visible }) {
  const [hovered, setHovered] = useState(false);
  const animDelay = index * 0.08;

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: `opacity 0.6s ease ${animDelay}s, transform 0.6s ease ${animDelay}s`,
    }}>
      <div
        onClick={() => navigate(`/sector/${sector.name.toLowerCase().replace(' ', '_')}`)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4E7EE',
          borderRadius: '8px',
          padding: '20px',
          cursor: 'pointer',
          transition: 'border-color 150ms ease, transform 150ms ease',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: '-8px',
          right: '12px',
          fontSize: '48px',
          color: 'rgba(200,146,42,0.08)',
          fontFamily: 'Space Mono, monospace',
          fontWeight: 700,
          pointerEvents: 'none',
          lineHeight: 1
        }}>
          {sector.name.replace(' ', '').substring(0, 4).toUpperCase()}
        </div>

        <div style={{
          fontSize: '10px',
          color: '#C8922A',
          fontFamily: 'Space Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '12px'
        }}>
          {sector.name}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '3px',
          marginBottom: '14px',
          position: 'relative',
          zIndex: 1
        }}>
          {sector.tickers.map(ticker => {
            const scores = getTickerScores(ticker);
            return scores.map((score, i) => (
              <div key={`${ticker}-${i}`} style={{
                height: '8px',
                borderRadius: '1px',
                background: getHeatmapColor(score),
                color: 'transparent'
              }} />
            ));
          })}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '11px', color: '#374151', fontFamily: 'Inter, sans-serif', marginBottom: '2px' }}>
            {sector.tickers.length} companies
          </div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
            8 quarters · Q1 FY24–Q4 FY25
          </div>
        </div>
      </div>
    </div>
  )
}

function LogoItem({ ticker, name }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/company/${ticker}/Q4_FY25`)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '0 44px',
        height: '100%',
        cursor: 'pointer',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        opacity: 0.85,
        transition: 'all 200ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '0.85';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <img
        src={`/logos/${ticker}.png`}
        alt={name}
        style={{
          height: '50px',
          width: 'auto',
          maxWidth: '140px',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontWeight: 500 }}>{name}</span>
    </div>
  );
}

function CompanyLogoStrip() {
  const doubled = [...LOGO_COMPANIES, ...LOGO_COMPANIES];
  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        height: '120px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        marginBottom: '40px'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none', zIndex: 3 }}>
        <div style={{ flex: 1, background: 'linear-gradient(to right, #0C1628, transparent)', maxWidth: '160px' }} />
        <div style={{ flex: 1 }} />
        <div style={{ flex: 1, background: 'linear-gradient(to left, #0C1628, transparent)', maxWidth: '160px' }} />
      </div>
      <div style={{ display: 'flex', height: '100%', animation: 'logoScroll 55s linear infinite', width: 'max-content' }} onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'} onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}>
        {doubled.map((c, i) => <LogoItem key={`${c.ticker}-${i}`} ticker={c.ticker} name={c.name} />)}
      </div>
    </div>
  )
}

// ─── MAIN LANDING PAGE ─────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  // Hover states
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [secondaryHovered, setSecondaryHovered] = useState(false);
  const [hoveredSector, setHoveredSector] = useState(null);

  // Section reveal refs
  const sec2Ref = useSectionReveal();
  const sec3Ref = useSectionReveal();
  const sec4Ref = useSectionReveal();
  const sec5Ref = useSectionReveal();
  const sec6Ref = useSectionReveal();
  const sec7Ref = useSectionReveal();

  return (
    <div style={{ background: colors.bgPrimary, color: colors.textPrimary, fontFamily: fonts.body }}>
      <style>{STYLES}</style>

      {/* SECTION 1 — HERO */}
      <section style={{
        height: '100vh',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 80px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Background Decoration */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.4
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,255,255,0) 0%, #FFFFFF 100%)'
        }} />

        <div style={{
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center'
        }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Top Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '4px',
            padding: '5px 12px',
            marginBottom: '24px',
            width: 'fit-content'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C8922A', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: '#C8922A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              LIVE · 259 TRANSCRIPTS ANALYSED
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ margin: 0, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <div style={{ fontSize: '52px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#1E3A5F', letterSpacing: '-0.02em', lineHeight: 1.1, animation: 'slideUpFade 0.6s ease-out 0s both' }}>
              What management says
            </div>
            <div style={{ fontSize: '52px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#1E3A5F', letterSpacing: '-0.02em', lineHeight: 1.1, animation: 'slideUpFade 0.6s ease-out 0.1s both' }}>
              tells you what's coming.
            </div>
            <div style={{ fontSize: '52px', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#C8922A', letterSpacing: '-0.02em', lineHeight: 1.1, animation: 'slideUpFade 0.6s ease-out 0.2s both' }}>
              Before the numbers do.
            </div>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '15px', color: '#374151', lineHeight: 1.7, maxWidth: '480px', margin: '20px 0 0 0',
            fontFamily: 'Inter, sans-serif', animation: 'fadeIn 0.7s ease-out 0.4s both'
          }}>
            EarningLens reads every earnings call from 35 NSE-listed companies,
            tracks how management tone shifts quarter by quarter, and surfaces
            the signals that move before reported results do.
          </p>

          {/* Meta Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', animation: 'fadeIn 0.7s ease-out 0.45s both' }}>
            <div style={{ fontSize: '12px', fontFamily: 'Space Mono, monospace', color: '#9CA3AF' }}>
              65,000+ sentences analysed · 35 companies · 8 quarters
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'Space Mono, monospace', color: '#9CA3AF' }}>
              Updated each quarter · NSE-listed companies · Zero manual annotation
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '36px', animation: 'fadeIn 0.7s ease-out 0.55s both' }}>
            <button
              onClick={() => sec7Ref.current?.scrollIntoView({ behavior: 'smooth' })}
              onMouseEnter={() => setPrimaryHovered(true)}
              onMouseLeave={() => setPrimaryHovered(false)}
              style={{
                background: primaryHovered ? '#1E2B3A' : '#0C1628',
                color: '#FFFFFF',
                fontSize: '14px', fontWeight: 500,
                padding: '13px 28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                boxShadow: primaryHovered ? '0 4px 12px rgba(12,22,40,0.35)' : '0 1px 2px rgba(12,22,40,0.25)',
                transform: primaryHovered ? 'translateY(-1px)' : 'none',
                transition: 'all 150ms ease',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Explore Companies →
            </button>
            <button
              onClick={() => navigate('/sector/it_services')}
              onMouseEnter={() => setSecondaryHovered(true)}
              onMouseLeave={() => setSecondaryHovered(false)}
              style={{
                background: '#FFFFFF',
                color: '#374151',
                border: '1px solid',
                borderColor: secondaryHovered ? '#CBD3DF' : '#E4E7EE',
                fontSize: '14px',
                padding: '13px 28px', borderRadius: '6px', cursor: 'pointer',
                transition: 'all 150ms ease',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              View Sector Intelligence
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN - Product Window */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.06), 0 0 0 1px #E2E8F0',
          overflow: 'hidden', animation: 'slideUpFade 0.8s ease-out 0.3s both'
        }}>
          {/* Header Bar */}
          <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', height: '36px', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FEBC2E' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#28C840' }} />
            </div>
            <div style={{ flex: 1, height: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '10px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace' }}>
              earninglens.vercel.app/company/TCS/Q4_FY25
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', height: '420px' }}>
            {/* Sidebar */}
            <div style={{ background: '#F8FAFC', borderRight: '1px solid #E2E8F0', padding: '12px 0' }}>
              <div style={{ padding: '0 12px 12px 12px', borderBottom: '1px solid #E2E8F0', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>TCS</div>
                <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>Tata Consultancy Services</div>
              </div>
              <div style={{ padding: '4px 6px' }}>
                {/* Q4 FY25 Card */}
                <div style={{ padding: '8px 10px', borderRadius: '5px', marginBottom: '2px', background: '#FEF3C7', borderLeft: '2px solid #C8922A' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#1E3A5F', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Q4 FY25</div>
                    <div style={{ fontSize: '10px', color: '#C8922A', fontFamily: 'Space Mono, monospace' }}>0.74</div>
                  </div>
                  <div style={{ height: '3px', display: 'flex', marginTop: '5px', borderRadius: '1.5px', overflow: 'hidden' }}>
                    <div style={{ width: '65%', background: '#059669' }} />
                    <div style={{ width: '22%', background: '#DC2626' }} />
                    <div style={{ width: '13%', background: '#E5E7EB' }} />
                  </div>
                </div>
                {/* Other Quarters */}
                {[
                  { q: 'Q3 FY25', score: '0.68', color: '#374151' },
                  { q: 'Q2 FY25', score: '0.61', color: '#374151' },
                  { q: 'Q1 FY25', score: '0.48', color: '#DC2626', alert: '⚠ Guidance drift' },
                  { q: 'Q4 FY24', score: '0.66', color: '#374151' },
                ].map((card, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: '5px', marginBottom: '2px', background: 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#1E3A5F', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{card.q}</div>
                      <div style={{ fontSize: '10px', color: card.color, fontFamily: 'Space Mono, monospace' }}>{card.score}</div>
                    </div>
                    {card.alert && (
                      <div style={{ fontSize: '9px', color: '#DC2626', marginTop: '4px', fontFamily: 'Space Mono, monospace' }}>{card.alert}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ background: '#FFFFFF', padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Analyst Brief */}
              <div style={{ background: '#F7F8FA', borderLeft: '2px solid #C8922A', borderRadius: '0 4px 4px 0', padding: '10px 12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '9px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>ANALYST BRIEF</div>
                <div style={{ fontSize: '10px', color: '#374151', lineHeight: '1.6', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                  Management tone was constructive at 0.74, up from 0.68 last quarter. Revenue led at 0.81 driven by BFSI deal momentum. Margin language softened — wage headwinds expected to persist through H1 FY26.
                </div>
              </div>

              {/* Sentences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { type: 'positive', text: "We are very pleased to report strong revenue growth of 13.2% in constant currency terms, driven by BFSI verticals." },
                  { type: 'neutral', text: "The board has approved a final dividend of ₹28 per share." },
                  { type: 'negative', text: "Margin headwinds from wage increases are expected to persist through H1 FY26." },
                  { type: 'positive', text: "Our deal pipeline remains robust at $12.3 billion." },
                  { type: 'negative', text: "We maintain a cautious stance on discretionary tech spend." }
                ].map((row, i) => {
                  const isPos = row.type === 'positive';
                  const isNeg = row.type === 'negative';
                  const border = isPos ? '2px solid #059669' : isNeg ? '2px solid #DC2626' : '1px solid #E5E7EB';
                  const bg = isPos ? '#FAFFFE' : isNeg ? '#FFFAFA' : 'transparent';
                  const chipColor = isPos ? '#059669' : isNeg ? '#DC2626' : '#6B7280';
                  const chipBg = isPos ? '#ECFDF5' : isNeg ? '#FEF2F2' : '#F9FAFB';

                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 0', borderBottom: '1px solid #F1F5F9', background: bg, borderLeft: border, paddingLeft: '8px' }}>
                      <div style={{ fontSize: '8px', color: chipColor, background: chipBg, border: `1px solid ${chipColor}`, borderRadius: '2px', padding: '1px 5px', flexShrink: 0, marginTop: '2px', fontFamily: 'Space Mono, monospace' }}>
                        {row.type}
                      </div>
                      <div style={{ fontSize: '10px', color: '#374151', lineHeight: '1.5', flex: 1, fontFamily: 'Inter, sans-serif' }}>
                        {row.text}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* SECTION 2 — STATS STRIP */}
      <section ref={sec2Ref} style={{ background: '#0C1628', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {STATS.map((s, i) => <StatBlock key={s.label} stat={s} last={i === STATS.length - 1} />)}
      </section>

      {/* SECTION 3 — HOW IT WORKS (CINEMATIC WALKTHROUGH) */}
      <section ref={sec3Ref} style={{
        background: '#F7F8FA',
        padding: '80px 80px',
        borderTop: '1px solid #E4E7EE',
        borderBottom: '1px solid #E4E7EE',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '11px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>HOW IT WORKS</div>
          <h2 style={{
            fontSize: '32px', color: '#0C1628', fontWeight: 600, fontFamily: 'Inter, sans-serif',
            margin: '8px 0 0 0',
          }}>See it in action.</h2>
          <p style={{
            fontSize: '14px', color: '#6B7280', fontFamily: 'Inter, sans-serif',
            maxWidth: '480px', margin: '10px auto 48px auto', lineHeight: 1.6,
          }}>
            A 30-second walkthrough of how EarningLens surfaces intelligence
            from an earnings call.
          </p>
        </div>
        <CinematicWalkthrough />
      </section>

      {/* SECTION 4 — FEATURE CARDS */}
      <section ref={sec4Ref} style={{ background: '#F7F8FA', padding: '80px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>INTELLIGENCE FEATURES</div>
          <h2 style={{ fontSize: '28px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', margin: '8px 0' }}>What EarningLens does</h2>
          <div style={{ fontSize: '15px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Seven intelligence layers extracted from every earnings call.</div>
        </div>
        <FeatureCardsGrid />
      </section>

      {/* SECTION 5 — COVERAGE */}
      <section ref={sec5Ref} style={{ background: '#F7F8FA', padding: '80px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>COVERAGE</div>
          <h2 style={{ fontSize: '28px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', margin: '8px 0' }}>35 companies · 8 sectors · 8 quarters of history</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
          {SECTORS.map((sector, idx) => (
            <SectorHeatmapCard key={sector.name} sector={sector} navigate={navigate} index={idx} visible={true} />
          ))}
        </div>
      </section>

      {/* SECTION 6 — METHODOLOGY */}
      <section ref={sec6Ref} style={{ background: '#FFFFFF', padding: '48px 80px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>METHODOLOGY</div>
          <h2 style={{ fontSize: '28px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', margin: '8px 0' }}>From transcript to intelligence</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', alignItems: 'start', maxWidth: '900px', margin: '0 auto' }}>
          <StepBlock num="01" icon="PDF" iconColor="#374151" title="BSE Transcript Download" desc="Python scraper downloads earnings call transcript PDFs from BSE India for all 35 covered companies." tags={['PyMuPDF', 'BSE API', 'Python 3.11']} iconBg="#F8FAFC" />
          <StepBlock num="02" icon="∫" iconColor="#C8922A" title="FinBERT Sentence Scoring" desc="Every sentence in every transcript is individually scored by FinBERT — a BERT model pre-trained on financial text." tags={['FinBERT', 'PyTorch', 'HuggingFace']} iconBg="#F8FAFC" />
          <StepBlock num="03" icon="◈" iconColor="#059669" title="Firebase + LLM Layer" desc="Sentence scores, aspect breakdowns, and AI-generated analyst briefs are written to Firestore for real-time frontend access." tags={['Firebase', 'Groq LLaMA 3.1', 'React 18']} iconBg="#F8FAFC" />
        </div>
      </section>

      {/* SECTION 7 — CTA */}
      <section ref={sec7Ref} style={{ background: '#0C1628', padding: '80px 80px 0 80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 600, color: '#FFFFFF', margin: 0, fontFamily: 'Inter, sans-serif' }}>Start exploring.</h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', marginBottom: '0', fontFamily: 'Inter, sans-serif' }}>
          35 NSE companies. 8 quarters. No login required.
        </p>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '480px', margin: '24px auto 48px auto' }}>
          <input 
            placeholder="Search any NSE company — TCS, HDFCBANK, RELIANCE..." 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const ticker = e.target.value.toUpperCase().trim();
                if (ticker) navigate(`/company/${ticker}/Q4_FY25`);
              }
            }}
            style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0 20px', fontSize: '14px', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <CompanyLogoStrip />

        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace', letterSpacing: '0.1em', margin: '40px 0 20px 0', textAlign: 'center' }}>OR EXPLORE BY SECTOR</div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '60px' }}>
          {SECTOR_PILLS.map((sector) => (
            <div
              key={sector.id}
              onClick={() => navigate(`/sector/${sector.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sector.color }} />
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                {sector.label}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Mono, monospace', marginLeft: '4px' }}>
                ({sector.count})
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '60px auto 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#0C1628', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: 700 }}>EL</div>
            <span style={{ color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500 }}>EarningLens</span>
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Mono, monospace' }}>Built with Analyst-Grade Sentiment Engine · Firebase · React</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Mono, monospace' }}>2025 · Parin · AI & Data Science</span>
        </div>
      </section>
    </div>
  )
}
