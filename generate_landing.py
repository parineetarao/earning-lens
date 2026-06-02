import os

file_content = """import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, radius } from '../theme';

// ─── KEYFRAMES ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes typeIn {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes cellReveal {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  /* Custom animations from previous implementation that might be needed */
  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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
  { name: 'IT SERVICES', tickers: ['TCS', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM'] },
  { name: 'FMCG',        tickers: ['HINDUNILVR', 'BRITANNIA', 'DABUR', 'MARICO', 'NESTLEIND'] },
  { name: 'AUTO',        tickers: ['BAJAJAUTO', 'HEROMOTOCO', 'EICHERMOT', 'MM'] },
  { name: 'PHARMA',      tickers: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'AUROPHARMA'] },
  { name: 'CEMENT',      tickers: ['ULTRACEMCO', 'AMBUJACEM', 'SHREECEM', 'ACCLTD'] },
  { name: 'ENERGY',      tickers: ['RELIANCE', 'POWERGRID', 'NTPC', 'TATAPOWER', 'ADANIGREEN'] },
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

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────
function StatBlock({ stat, last }) {
  const { count, ref } = useCountUp(stat.target, 2000)
  const display = stat.target >= 1000
    ? count.toLocaleString('en-US')
    : count.toString()

  const max = Math.max(...stat.data)
  const min = Math.min(...stat.data)
  const range = max === min ? 1 : max - min
  
  const points = stat.data.map((val, i) => {
    const x = (i / (stat.data.length - 1)) * 80
    const y = max === min ? 10 : 18 - ((val - min) / range) * 16
    return `${x},${y}`
  }).join(' ')

  const lastX = 80
  const lastY = max === min ? 10 : 18 - ((stat.data[stat.data.length - 1] - min) / range) * 16

  return (
    <div
      ref={ref}
      style={{
        padding: '32px',
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: '32px',
        fontWeight: 700,
        color: '#FFFFFF',
        display: 'block',
        lineHeight: 1,
      }}>
        {display}{stat.suffix}
      </span>
      <span style={{
        fontSize: '11px',
        color: '#93C5FD',
        marginTop: '6px',
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontFamily: 'Inter, sans-serif',
      }}>
        {stat.label}
      </span>
      <svg width="80" height="20" viewBox="0 0 80 20" style={{ marginTop: '8px', display: 'block' }}>
        <line x1="0" y1="18" x2="80" y2="18" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <polyline points={points} stroke="#3B82F6" strokeWidth="1.5" fill="none" />
        <circle cx={lastX} cy={lastY} r="2" fill="#3B82F6" />
      </svg>
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
        padding: '28px',
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

function Card1({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
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
        FinBERT — a BERT model pre-trained on financial text — scores every sentence individually. Not the document. Not the paragraph. The sentence. 65,000+ sentences scored across 259 transcripts.
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
      <div style={{ height: '80px', marginBottom: '16px' }}>
        <div style={{
          borderLeft: '2px solid #2563EB', background: '#EFF6FF',
          padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: '10px', color: '#374151',
          lineHeight: '1.6', fontStyle: 'italic', fontFamily: 'Inter, sans-serif',
          overflow: 'hidden', maxHeight: '80px',
        }}>
          "{displayedText}"
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>AI Analyst Briefs</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        Every transcript has a two-paragraph analyst note generated by Groq LLaMA 3.1, interpreting the sentiment scores.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>Groq · LLaMA 3.1 · Fallback computed</div>
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
        See how every company in the sector compares across all 8 quarters. Absolute and relative scoring.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>35 companies · 8 sectors · 8 quarters</div>
    </BaseCard>
  )
}

function Card4({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
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
            ⚠ THRESHOLD EXCEEDED
          </span>
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Guidance Drift Alerts</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        Automated tracking of quarter-over-quarter guidance drops.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>Automated · Threshold 0.20 · Per quarter</div>
    </BaseCard>
  )
}

function Card5({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
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
            <span style={{ fontSize: '10px', color: '#2563EB', fontFamily: 'Space Mono, monospace' }}>0.44</span>
          </div>
          <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '44%', height: '100%', background: '#2563EB', transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#D97706', fontFamily: 'Space Mono, monospace', marginTop: '12px' }}>
          Gap: +0.24 — perception management signal
        </div>
      </div>
      <div style={{ fontSize: '15px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Prepared vs Q&A Split</div>
      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
        Compare management's scripted remarks vs unscripted Q&A sentiment.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>Boundary detection · Per-section scoring</div>
    </BaseCard>
  )
}

function Card6({ visible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BaseCard visible={visible} delay={delay} hovered={hovered} setHovered={setHovered}>
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
        Automatically highlights words driving shifts in sentiment.
      </div>
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontFamily: 'Space Mono, monospace' }}>No ML · Word frequency · Delta ranking</div>
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
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#2563EB' }}>
          ≈
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E3A5F', marginTop: '16px', fontFamily: 'Inter, sans-serif' }}>Peer Relative Tone Index</div>
        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
          Instead of showing absolute sentiment scores, EarningLens shows each company's score relative to its sector average for that quarter. A company 0.15 below its sector peers on guidance sentiment is diverging in a way that matters — even if its absolute score seems acceptable.
        </div>
        <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '14px', fontFamily: 'Space Mono, monospace' }}>Pure arithmetic · Firestore computed · Per sector</div>
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
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'
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

// ─── STEP BLOCK (METHODOLOGY) ──────────────────────────────────────────────
function StepBlock({ num, icon, iconColor, title, desc, tags, iconBg }) {
  return (
    <div>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#2563EB', display: 'block', marginBottom: '16px' }}>
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

// ─── SECTOR HEATMAP HELPERS ────────────────────────────────────────────────
function getHeatmapColor(score) {
  if (score === null || score === undefined) return '#F1F5F9';
  if (score >= 0.70) return '#D1FAE5';
  if (score >= 0.60) return '#ECFDF5';
  if (score >= 0.50) return '#FEF9C3';
  if (score >= 0.40) return '#FFEDD5';
  return '#FEE2E2';
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
          border: '1px solid',
          borderColor: hovered ? '#2563EB' : '#E2E8F0',
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
          color: 'rgba(37,99,235,0.04)',
          fontFamily: 'Space Mono, monospace',
          fontWeight: 700,
          pointerEvents: 'none',
          lineHeight: 1
        }}>
          {sector.name.replace(' ', '').substring(0, 4).toUpperCase()}
        </div>

        <div style={{
          fontSize: '10px',
          color: '#2563EB',
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

// ─── INTERACTIVE WALKTHROUGH DEMO (SECTION 4) ──────────────────────────────
function InteractiveWalkthrough() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setStep(s => (s + 1) % 5);
    }, 3500);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const stepsData = [
    {
      title: "Find any NSE company",
      desc: "Search by ticker or company name. Access any of the 35 covered companies instantly.",
      bullets: ["35 companies across 8 sectors", "Instant typeahead search", "Click any result to open"]
    },
    {
      title: "8 quarters of history",
      desc: "The left sidebar shows all available quarters with mini sentiment bars. Guidance drift alerts fire automatically.",
      bullets: ["Chronological quarter navigation", "Mini sentiment breakdown bars", "Guidance drift auto-detection"]
    },
    {
      title: "AI-generated insight",
      desc: "Every transcript has a two-paragraph analyst note generated by Groq LLaMA 3.1, interpreting the sentiment scores.",
      bullets: ["Score interpretation in plain English", "Quarter-over-quarter comparison", "Fallback computed brief always available"]
    },
    {
      title: "Sentence-level intelligence",
      desc: "The full transcript with every sentence individually scored. Green border for positive, red for negative.",
      bullets: ["FinBERT scores every sentence", "Aspect label on hover", "Confidence score per sentence"]
    },
    {
      title: "Peer intelligence",
      desc: "See how every company in the sector compares across all 8 quarters. Click any cell to open that transcript.",
      bullets: ["Relative vs absolute scoring", "Cross-company comparison", "Click-to-transcript navigation"]
    }
  ];

  return (
    <div style={{ marginTop: '32px' }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {stepsData.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              onClick={() => { setStep(i); setAutoPlay(false); }}
              style={{
                background: step === i ? '#2563EB' : 'transparent',
                color: step === i ? '#FFFFFF' : '#9CA3AF',
                border: step === i ? '1px solid #2563EB' : '1px solid #E2E8F0',
                padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: step === i ? 600 : 400,
                cursor: 'pointer', transition: 'all 150ms ease'
              }}
            >
              Step {i + 1}
            </div>
          </div>
        ))}
      </div>
      
      {/* Progress bar */}
      <div style={{ width: '100%', height: '2px', background: '#E2E8F0', marginTop: '12px' }}>
        <div style={{ width: \`\${((step + 1) / 5) * 100}%\`, background: '#2563EB', height: '100%', transition: 'width 500ms ease' }} />
      </div>

      {/* Content Area */}
      <div style={{
        height: '480px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0,
        border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginTop: '32px'
      }}>
        {/* Left Panel */}
        <div style={{ background: '#F8FAFC', borderRight: '1px solid #E2E8F0', padding: '24px' }}>
          <div style={{ fontSize: '18px', color: '#1E3A5F', fontWeight: 600, marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
            {stepsData[step].title}
          </div>
          <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>
            {stepsData[step].desc}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
            What you're seeing:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stepsData[step].bullets.map((b, idx) => (
              <div key={idx} style={{ fontSize: '12px', color: '#374151', padding: '5px 0', borderBottom: '1px solid #E2E8F0', fontFamily: 'Inter, sans-serif' }}>
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel (Animated Demo) */}
        <div style={{ background: '#FFFFFF', overflow: 'hidden', position: 'relative' }}>
          {step === 0 && <DemoStep0 />}
          {step === 1 && <DemoStep1 />}
          {step === 2 && <DemoStep2 />}
          {step === 3 && <DemoStep3 />}
          {step === 4 && <DemoStep4 />}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '24px', gap: '16px' }}>
        <button onClick={() => { setStep(s => (s === 0 ? 4 : s - 1)); setAutoPlay(false); }} style={{
          border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#374151', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'
        }}>← Previous</button>
        <span style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace' }}>Step {step + 1} of 5</span>
        <button onClick={() => { setStep(s => (s + 1) % 5); setAutoPlay(false); }} style={{
          border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#374151', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'
        }}>Next →</button>
        <span onClick={() => setAutoPlay(!autoPlay)} style={{ fontSize: '11px', color: '#9CA3AF', cursor: 'pointer', marginLeft: '16px', fontFamily: 'Inter, sans-serif' }}>
          {autoPlay ? 'Stop auto-play' : 'Resume auto-play'}
        </span>
      </div>
    </div>
  )
}

function DemoStep0() {
  const [text, setText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const targetText = "HDFCBANK";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(targetText.substring(0, i + 1));
      i++;
      if (i >= targetText.length) clearInterval(interval);
    }, 100);
    const dropdownTimer = setTimeout(() => setShowDropdown(true), 600);
    return () => { clearInterval(interval); clearTimeout(dropdownTimer); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 1, animation: 'fadeIn 300ms ease' }}>
      <div style={{ position: 'relative', width: '380px' }}>
        <div style={{ width: '100%', height: '44px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#111827', fontFamily: 'Inter, sans-serif' }}>
          {text || <span style={{ color: '#9CA3AF' }}>Search company — TCS, HDFCBANK...</span>}
        </div>
        {showDropdown && (
          <div style={{ position: 'absolute', top: '52px', left: 0, width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '12px 16px', background: '#EFF6FF', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '14px', color: '#1E3A5F', fontFamily: 'Inter, sans-serif' }}>HDFCBANK — HDFC Bank Limited</span>
              <span style={{ fontSize: '10px', color: '#2563EB', fontFamily: 'Space Mono, monospace' }}>BANKING</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '14px', color: '#374151', fontFamily: 'Inter, sans-serif' }}>HINDUNILVR — Hindustan Unilever</span>
              <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace' }}>FMCG</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#374151', fontFamily: 'Inter, sans-serif' }}>HEROMOTOCO — Hero MotoCorp</span>
              <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace' }}>AUTO</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DemoStep1() {
  const [visibleItems, setVisibleItems] = useState(0);
  const [highlightQ1, setHighlightQ1] = useState(false);

  useEffect(() => {
    let timers = [];
    for (let i = 1; i <= 5; i++) timers.push(setTimeout(() => setVisibleItems(i), i * 200));
    timers.push(setTimeout(() => setHighlightQ1(true), 1200));
    return () => timers.forEach(clearTimeout);
  }, []);

  const q = [
    { name: 'Q4_FY25', score: '0.74', color: '#059669', bars: ['60%', '20%', '20%'] },
    { name: 'Q3_FY25', score: '0.71', color: '#059669', bars: ['55%', '25%', '20%'] },
    { name: 'Q2_FY25', score: '0.68', color: '#D97706', bars: ['45%', '35%', '20%'] },
    { name: 'Q1_FY25', score: '0.48', color: '#DC2626', bars: ['30%', '50%', '20%'], alert: '⚠ Guidance drift' },
    { name: 'Q4_FY24', score: '0.62', color: '#D97706', bars: ['40%', '40%', '20%'] }
  ];

  return (
    <div style={{ padding: '40px', height: '100%', animation: 'fadeIn 300ms ease' }}>
      <div style={{ width: '200px' }}>
        {q.map((card, i) => (
          <div key={card.name} style={{
            opacity: visibleItems > i ? 1 : 0, transform: visibleItems > i ? 'translateY(0)' : 'translateY(10px)', transition: 'all 300ms ease',
            padding: '12px', border: i === 3 && highlightQ1 ? '2px solid #2563EB' : '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '8px',
            background: i === 3 && highlightQ1 ? '#EFF6FF' : '#FFFFFF',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#1E3A5F', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{card.name}</span>
              <span style={{ fontSize: '11px', color: card.color, fontFamily: 'Space Mono, monospace' }}>{card.score}</span>
            </div>
            <div style={{ display: 'flex', height: '3px', borderRadius: '1.5px', overflow: 'hidden' }}>
              <div style={{ width: card.bars[0], background: '#059669' }} />
              <div style={{ width: card.bars[1], background: '#DC2626' }} />
              <div style={{ width: card.bars[2], background: '#E5E7EB' }} />
            </div>
            {card.alert && (
              <div style={{ fontSize: '9px', color: '#DC2626', marginTop: '6px', fontFamily: 'Space Mono, monospace' }}>{card.alert}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoStep2() {
  return (
    <div style={{ padding: '60px', height: '100%', animation: 'fadeIn 300ms ease' }}>
      <div style={{ background: '#F8FAFC', borderLeft: '2px solid #2563EB', borderRadius: '0 4px 4px 0', padding: '16px 20px' }}>
        <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '12px' }}>ANALYST BRIEF</div>
        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', fontFamily: 'Inter, sans-serif', animation: 'fadeIn 1s ease' }}>
          Management tone for SBIN in Q3_FY24 was constructive with an overall score of 0.73, down slightly from 0.76 last quarter. 
          Asset quality commentary was the strongest dimension at 0.82, driven by stable NPAs. 
          Margin language softened to 0.58 — funding costs are expected to remain elevated through H1 FY25.
        </div>
      </div>
    </div>
  )
}

function DemoStep3() {
  const sentences = [
    { type: 'positive', text: "Asset quality remains robust with GNPA at 2.42%, an improvement of 72 bps year-on-year." },
    { type: 'neutral', text: "We have opened 142 new branches during this quarter." },
    { type: 'negative', text: "Cost of deposits has increased and we expect some margin compression in the near term." },
    { type: 'positive', text: "Our digital channels are showing excellent momentum, processing 65% of retail transactions." }
  ];
  
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    let timers = [];
    for (let i = 1; i <= 4; i++) timers.push(setTimeout(() => setVisible(i), i * 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ padding: '40px', height: '100%', animation: 'fadeIn 300ms ease', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sentences.map((s, i) => {
        const isPos = s.type === 'positive';
        const isNeg = s.type === 'negative';
        const bg = isPos ? '#FAFFFE' : isNeg ? '#FFFAFA' : 'transparent';
        const border = isPos ? '2px solid #059669' : isNeg ? '2px solid #DC2626' : '1px solid #E5E7EB';
        const chipColor = isPos ? '#059669' : isNeg ? '#DC2626' : '#6B7280';
        const chipBg = isPos ? '#ECFDF5' : isNeg ? '#FEF2F2' : '#F9FAFB';

        return (
          <div key={i} style={{
            opacity: visible > i ? 1 : 0, transform: visible > i ? 'translateX(0)' : 'translateX(20px)', transition: 'all 300ms ease',
            background: bg, borderLeft: border, padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px'
          }}>
            <div style={{ fontSize: '9px', color: chipColor, background: chipBg, border: \`1px solid \${chipColor}\`, borderRadius: '3px', padding: '2px 6px', fontFamily: 'Space Mono, monospace' }}>
              {s.type.substring(0,3)}
            </div>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>{s.text}</div>
          </div>
        )
      })}
    </div>
  )
}

function DemoStep4() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setHovered(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const companies = ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK'];
  const data = companies.map(c => getTickerScores(c));

  return (
    <div style={{ padding: '40px', height: '100%', animation: 'fadeIn 300ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(8, 20px)', gap: '4px', alignItems: 'center' }}>
        {companies.map((c, i) => (
          <React.Fragment key={c}>
            <div style={{ fontSize: '11px', color: '#374151', fontFamily: 'Space Mono, monospace' }}>{c}</div>
            {data[i].map((score, j) => {
              const isHov = hovered && i === 2 && j === 4;
              return (
                <div key={j} style={{
                  width: '20px', height: '20px', background: getHeatmapColor(score), borderRadius: '2px',
                  opacity: visible ? 1 : 0, transform: visible ? (isHov ? 'scale(1.2)' : 'scale(1)') : 'scale(0.8)',
                  transition: \`opacity 300ms ease \${(i*8 + j)*30}ms, transform 300ms ease \${(i*8 + j)*30}ms\`,
                  border: isHov ? '2px solid #2563EB' : 'none', position: 'relative', zIndex: isHov ? 10 : 1
                }}>
                  {isHov && (
                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px', background: '#1E3A5F', color: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono, monospace', whiteSpace: 'nowrap' }}>
                      SBIN Q1_FY25: {score.toFixed(2)}
                    </div>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
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

  // Section reveal refs
  const sec2Ref = useSectionReveal();
  const sec3Ref = useSectionReveal();
  const sec4Ref = useSectionReveal();
  const sec5Ref = useSectionReveal();
  const sec6Ref = useSectionReveal();
  const sec7Ref = useSectionReveal();
  const sec8Ref = useSectionReveal();

  return (
    <div style={{ background: '#F8FAFC', color: '#111827', fontFamily: 'Inter, sans-serif' }}>
      <style>{STYLES}</style>

      {/* SECTION 1 — HERO */}
      <section style={{
        height: '100vh',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px',
        padding: '0 80px',
        alignItems: 'center',
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

        {/* LEFT COLUMN */}
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Top Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '4px',
            padding: '5px 12px',
            marginBottom: '24px',
            width: 'fit-content'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              LIVE · 259 TRANSCRIPTS
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ margin: 0, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <div style={{ fontSize: '52px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#1E3A5F', letterSpacing: '-0.02em', lineHeight: 1.1, animation: 'slideUpFade 0.6s ease-out 0s both' }}>
              Earnings Call
            </div>
            <div style={{ fontSize: '52px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#1E3A5F', letterSpacing: '-0.02em', lineHeight: 1.1, animation: 'slideUpFade 0.6s ease-out 0.1s both' }}>
              Intelligence
            </div>
            <div style={{ fontSize: '52px', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#2563EB', letterSpacing: '-0.02em', lineHeight: 1.1, animation: 'slideUpFade 0.6s ease-out 0.2s both' }}>
              for Analysts.
            </div>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '16px', color: '#374151', lineHeight: 1.7, maxWidth: '440px', margin: '20px 0 0 0',
            fontFamily: 'Inter, sans-serif', animation: 'fadeIn 0.7s ease-out 0.4s both'
          }}>
            FinBERT sentence-level scoring across 35 NSE-listed companies.
            8 quarters of management tone history. AI-generated analyst briefs.
            No Bloomberg terminal does this.
          </p>

          {/* Meta Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', animation: 'fadeIn 0.7s ease-out 0.45s both' }}>
            <div style={{ fontSize: '12px', fontFamily: 'Space Mono, monospace', color: '#9CA3AF' }}>
              65,000+ sentences scored · 259 transcripts · 8 sectors
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'Space Mono, monospace', color: '#9CA3AF' }}>
              BSE India source · Zero human annotation · Updated quarterly
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '36px', animation: 'fadeIn 0.7s ease-out 0.55s both' }}>
            <button
              onClick={() => navigate('/company/TCS/Q4_FY25')}
              onMouseEnter={() => setPrimaryHovered(true)}
              onMouseLeave={() => setPrimaryHovered(false)}
              style={{
                background: primaryHovered ? '#1D4ED8' : '#2563EB',
                color: '#FFFFFF',
                fontSize: '14px', fontWeight: 500,
                padding: '13px 28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                boxShadow: primaryHovered ? '0 4px 12px rgba(37,99,235,0.4)' : '0 1px 2px rgba(37,99,235,0.3)',
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
                background: secondaryHovered ? '#F8FAFC' : '#FFFFFF',
                color: '#374151',
                border: '1px solid',
                borderColor: secondaryHovered ? '#CBD5E1' : '#E2E8F0',
                fontSize: '14px',
                padding: '13px 28px', borderRadius: '6px', cursor: 'pointer',
                transition: 'all 150ms ease',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              View Sector Heatmap
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN - Product Window */}
        <div style={{
          zIndex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
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
                <div style={{ padding: '8px 10px', borderRadius: '5px', marginBottom: '2px', background: '#EFF6FF', borderLeft: '2px solid #2563EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#1E3A5F', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Q4 FY25</div>
                    <div style={{ fontSize: '10px', color: '#2563EB', fontFamily: 'Space Mono, monospace' }}>0.74</div>
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
              <div style={{ background: '#F8FAFC', borderLeft: '2px solid #2563EB', borderRadius: '0 4px 4px 0', padding: '10px 12px', marginBottom: '12px' }}>
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
                      <div style={{ fontSize: '8px', color: chipColor, background: chipBg, border: \`1px solid \${chipColor}\`, borderRadius: '2px', padding: '1px 5px', flexShrink: 0, marginTop: '2px', fontFamily: 'Space Mono, monospace' }}>
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
      </section>

      {/* SECTION 2 — STATS STRIP */}
      <section ref={sec2Ref} style={{ background: '#1E3A5F', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {STATS.map((s, i) => <StatBlock key={s.label} stat={s} last={i === STATS.length - 1} />)}
      </section>

      {/* SECTION 3 — LIVE INTELLIGENCE SIGNALS */}
      <section ref={sec3Ref} style={{ background: '#F8FAFC', padding: '60px 80px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#2563EB', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>● LIVE INTELLIGENCE SIGNALS</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>Updated quarterly</div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Card 1: Guidance Drift */}
          <div style={{ background: '#FFFFFF', padding: '24px' }}>
            <div style={{ fontSize: '10px', color: '#DC2626', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '12px' }}>⚠ GUIDANCE DRIFT</div>
            <div style={{ fontSize: '13px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '8px' }}>BAJAJAUTO · Q3_FY25</div>
            <div style={{ fontSize: '14px', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
              <span style={{ color: '#059669' }}>0.71</span> <span style={{ color: '#9CA3AF' }}>→</span> <span style={{ color: '#DC2626' }}>0.48</span>
            </div>
            <div style={{ fontSize: '10px', color: '#DC2626', fontFamily: 'Space Mono, monospace', marginBottom: '12px' }}>−0.23 drop · threshold exceeded</div>
            <div>
              <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '2px', fontFamily: 'Inter, sans-serif' }}>Q2 FY25</div>
              <div style={{ height: '4px', width: '71%', background: '#059669', borderRadius: '2px', marginBottom: '6px' }} />
              <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '2px', fontFamily: 'Inter, sans-serif' }}>Q3 FY25</div>
              <div style={{ height: '4px', width: '48%', background: '#DC2626', borderRadius: '2px' }} />
            </div>
          </div>

          {/* Card 2: Peer Relative */}
          <div style={{ background: '#FFFFFF', padding: '24px' }}>
            <div style={{ fontSize: '10px', color: '#D97706', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '12px' }}>↓ BELOW SECTOR PEERS</div>
            <div style={{ fontSize: '13px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '8px' }}>SBIN · Q4_FY25</div>
            <div style={{ fontSize: '14px', color: '#111827', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>ABS 0.73 · AVG 0.81</div>
            <div style={{ fontSize: '10px', color: '#D97706', fontFamily: 'Space Mono, monospace' }}>−0.08 below banking average</div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>SBIN</span>
                <span style={{ fontSize: '9px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Sector avg</span>
              </div>
              <div style={{ position: 'relative', height: '4px' }}>
                <div style={{ position: 'absolute', width: '81%', height: '100%', background: '#9CA3AF', borderRadius: '2px' }} />
                <div style={{ position: 'absolute', width: '73%', height: '100%', background: '#D97706', borderRadius: '2px' }} />
                <div style={{ position: 'absolute', left: '81%', top: '-4px', height: '12px', borderLeft: '1px dashed #9CA3AF' }} />
              </div>
            </div>
          </div>

          {/* Card 3: Vocabulary Shift */}
          <div style={{ background: '#FFFFFF', padding: '24px' }}>
            <div style={{ fontSize: '10px', color: '#7C3AED', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '12px' }}>δ VOCABULARY SHIFT</div>
            <div style={{ fontSize: '13px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '12px' }}>HDFCBANK · Q3 vs Q2 FY25</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#6B7280', fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>INCREASED</div>
                <div style={{ fontSize: '10px', color: '#DC2626', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>+ headwinds (+9×)</div>
                <div style={{ fontSize: '10px', color: '#DC2626', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>+ elevated (+6×)</div>
                <div style={{ fontSize: '10px', color: '#DC2626', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>+ cautious (+5×)</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#6B7280', fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>DECREASED</div>
                <div style={{ fontSize: '10px', color: '#059669', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>− confident (−8×)</div>
                <div style={{ fontSize: '10px', color: '#059669', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>− robust (−6×)</div>
                <div style={{ fontSize: '10px', color: '#059669', fontFamily: 'Space Mono, monospace', padding: '2px 0' }}>− optimistic (−4×)</div>
              </div>
            </div>
          </div>

          {/* Card 4: AI Brief */}
          <div style={{ background: '#FFFFFF', padding: '24px' }}>
            <div style={{ fontSize: '10px', color: '#2563EB', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '12px' }}>✦ AI ANALYST BRIEF</div>
            <div style={{ fontSize: '13px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '8px' }}>DRREDDY · Q4_FY25</div>
            <div style={{ fontSize: '11px', color: '#374151', lineHeight: 1.7, fontFamily: 'Inter, sans-serif', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
              Margin language was notably defensive in Q4 FY25 — the margins aspect scored 0.62, the weakest of all five dimensions. Revenue held at 0.80 but guidance softened to 0.68...
            </div>
            <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', marginTop: '10px' }}>Groq LLaMA 3.1 · FinBERT scores</div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS (ANIMATED WALKTHROUGH) */}
      <section ref={sec4Ref} style={{ background: '#FFFFFF', padding: '80px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>PRODUCT WALKTHROUGH</div>
          <h2 style={{ fontSize: '32px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', margin: '8px 0' }}>See how EarningLens works</h2>
          <div style={{ fontSize: '15px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>An interactive demonstration of the intelligence pipeline</div>
        </div>
        <InteractiveWalkthrough />
      </section>

      {/* SECTION 5 — FEATURE CARDS */}
      <section ref={sec5Ref} style={{ background: '#F8FAFC', padding: '80px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>INTELLIGENCE FEATURES</div>
          <h2 style={{ fontSize: '28px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', margin: '8px 0' }}>Seven layers of intelligence</h2>
        </div>
        <FeatureCardsGrid />
      </section>

      {/* SECTION 6 — METHODOLOGY */}
      <section ref={sec6Ref} style={{ background: '#FFFFFF', padding: '80px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>METHODOLOGY</div>
          <h2 style={{ fontSize: '28px', color: '#1E3A5F', fontWeight: 600, fontFamily: 'Inter, sans-serif', margin: '8px 0' }}>From transcript to intelligence</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr 40px 1fr', alignItems: 'start', maxWidth: '900px', margin: '0 auto' }}>
          <StepBlock num="01" icon="PDF" iconColor="#374151" title="BSE Transcript Download" iconBg="#F8FAFC" desc="Python scraper downloads earnings call transcript PDFs from BSE India for all 35 covered companies. Automatic quarter detection from filing dates." tags={['PyMuPDF', 'BSE API', 'Python 3.11']} />
          <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '36px', justifyContent: 'center' }}><div style={{ height: '1px', width: '100%', background: '#E2E8F0', marginTop: '4px' }} /></div>
          <StepBlock num="02" icon="∫" iconColor="#2563EB" title="FinBERT Sentence Scoring" iconBg="#F8FAFC" desc="Every sentence in every transcript is individually scored by FinBERT — a BERT model pre-trained on financial text. Three labels: positive, negative, neutral with confidence scores." tags={['FinBERT', 'PyTorch', 'HuggingFace']} />
          <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '36px', justifyContent: 'center' }}><div style={{ height: '1px', width: '100%', background: '#E2E8F0', marginTop: '4px' }} /></div>
          <StepBlock num="03" icon="◈" iconColor="#059669" title="Firebase + LLM Layer" iconBg="#F8FAFC" desc="Sentence scores, aspect breakdowns, vocabulary deltas, and AI-generated analyst briefs are written to Firestore. Frontend subscribes in real time." tags={['Firebase', 'Groq LLaMA 3.1', 'React 18']} />
        </div>
      </section>

      {/* SECTION 7 — COVERAGE */}
      <section ref={sec7Ref} style={{ background: '#F8FAFC', padding: '80px', borderTop: '1px solid #E2E8F0' }}>
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

      {/* SECTION 8 — CTA */}
      <section ref={sec8Ref} style={{ background: '#1E3A5F', padding: '80px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '2px', background: '#3B82F6', margin: '0 auto 40px auto' }} />
        <h2 style={{ fontSize: '40px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0, fontFamily: 'Inter, sans-serif' }}>Start with a company.</h2>
        <p style={{ fontSize: '15px', color: '#93C5FD', marginTop: '12px', marginBottom: '48px', fontFamily: 'Inter, sans-serif' }}>No login. No paywall. Real data from real NSE earnings calls.</p>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto 48px auto' }}>
          <input 
            placeholder="Search any NSE company — TCS, HDFCBANK, RELIANCE..." 
            style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0 20px', fontSize: '14px', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace', letterSpacing: '0.1em', marginBottom: '20px', textAlign: 'center' }}>OR EXPLORE BY SECTOR</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { t: 'HINDALCO', n: 'Hindalco Industries', s: 'STEEL', sc: '0.78' },
            { t: 'HDFCBANK', n: 'HDFC Bank', s: 'BANKING', sc: '0.68' },
            { t: 'TCS', n: 'Tata Consultancy Services', s: 'IT SERVICES', sc: '0.74' },
            { t: 'HINDUNILVR', n: 'Hindustan Unilever', s: 'FMCG', sc: '0.63' },
            { t: 'BAJAJAUTO', n: 'Bajaj Auto', s: 'AUTO', sc: '0.71' },
            { t: 'DRREDDY', n: 'Dr. Reddy\\'s Laboratories', s: 'PHARMA', sc: '0.79' },
            { t: 'AMBUJACEM', n: 'Ambuja Cements', s: 'CEMENT', sc: '0.69' },
            { t: 'RELIANCE', n: 'Reliance Industries', s: 'ENERGY', sc: '0.71' }
          ].map(c => (
            <div key={c.t} onClick={() => navigate(\`/company/\${c.t}/Q4_FY25\`)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'all 150ms ease', textAlign: 'left' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'Space Mono, monospace' }}>
                {c.t.substring(0, 2)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace', marginTop: '8px', marginBottom: '4px' }}>{c.s}</div>
              <div style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>{c.t}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>{c.n}</div>
              <div style={{ fontSize: '12px', color: '#4ADE80', fontFamily: 'Space Mono, monospace', marginTop: '10px' }}>Score: {c.sc}</div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '60px auto 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: 700 }}>EL</div>
            <span style={{ color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500 }}>EarningLens</span>
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Mono, monospace' }}>Built with FinBERT · Firebase · React · FastAPI · Groq</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Mono, monospace' }}>2025 · Parin · AI & Data Science</span>
        </div>
      </section>
    </div>
  )
}
"""

with open(r'c:\Users\parin\Desktop\EarningLens\frontend\src\pages\LandingPage.jsx', 'w', encoding='utf-8') as f:
    f.write(file_content)
