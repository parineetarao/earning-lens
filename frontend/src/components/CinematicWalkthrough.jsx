import React, { useState, useEffect, useRef } from 'react';

// ─── HELPERS ───────────────────────────────────────────────────────────────
function getHeatmapColor(score) {
  if (score == null) return '#F1F5F9';
  if (score >= 0.70) return '#86EFAC';
  if (score >= 0.60) return '#BBF7D0';
  if (score >= 0.50) return '#FDE68A';
  if (score >= 0.40) return '#FCA5A5';
  return '#F87171';
}

const SCENES = [
  { id: 'landing',           duration: 3500, click: false, label: '' },
  { id: 'search-open',       duration: 1800, click: true,  label: 'Opening search...' },
  { id: 'typing-hdfcbank',   duration: 4500, click: false, label: 'Searching HDFC Bank...' },
  { id: 'click-result',      duration: 1800, click: true,  label: 'Selecting company...' },
  { id: 'transcript-load',   duration: 2500, click: false, label: 'Loading intelligence...' },
  { id: 'brief-typing',      duration: 6000, click: false, label: 'AI Analyst Brief' },
  { id: 'transcript-scroll', duration: 5000, click: false, label: 'Sentence-level tone' },
  { id: 'click-trajectory',  duration: 1800, click: true,  label: 'Viewing trajectory...' },
  { id: 'trajectory-view',   duration: 4000, click: false, label: '8-quarter signals' },
  { id: 'click-vocab',       duration: 1800, click: true,  label: 'Checking vocabulary...' },
  { id: 'vocab-view',        duration: 3500, click: false, label: 'Management word shifts' },
  { id: 'click-qa',          duration: 1800, click: true,  label: 'Analyzing Q&A split...' },
  { id: 'qa-view',           duration: 3500, click: false, label: 'Scripted vs Unscripted' },
  { id: 'click-sectors',     duration: 1800, click: true,  label: 'Switching to sectors...' },
  { id: 'sectors-page',      duration: 4000, click: false, label: 'Sector Intelligence' },
  { id: 'hover-cell',        duration: 2500, click: false, label: 'Benchmarking peers...' },
  { id: 'click-cell',        duration: 1800, click: true,  label: 'Opening from grid...' },
  { id: 'back-transcript',   duration: 2000, click: false, label: '' },
  { id: 'click-watchlist',   duration: 1800, click: true,  label: 'Adding to watchlist...' },
  { id: 'watchlist-open',    duration: 2500, click: false, label: 'Personal Dashboard' },
  { id: 'click-pdf',         duration: 1800, click: true,  label: 'Exporting report...' },
  { id: 'pdf-generating',    duration: 2500, click: false, label: 'Generating PDF...' },
];

const TOTAL_MS = SCENES.reduce((s, x) => s + x.duration, 0);

const getTarget = (sceneId, screenDims) => {
  const w = screenDims.w;
  const h = screenDims.h;
  const chrome = 40;

  const targets = {
    'landing':            { x: w * 0.93, y: chrome * 0.5 },
    'search-open':        { x: w * 0.50, y: chrome + (h - chrome) * 0.22 },
    'typing-hdfcbank':    { x: w * 0.50, y: chrome + (h - chrome) * 0.22 },
    'click-result':       { x: w * 0.50, y: chrome + (h - chrome) * 0.36 },
    'transcript-load':    { x: w * 0.55, y: chrome + (h - chrome) * 0.50 },
    'brief-typing':       { x: w * 0.55, y: chrome + (h - chrome) * 0.30 },
    'transcript-scroll':  { x: w * 0.55, y: chrome + (h - chrome) * 0.55 },
    'click-trajectory':   { x: w * 0.52, y: chrome + (h - chrome) * 0.08 },
    'trajectory-view':    { x: w * 0.60, y: chrome + (h - chrome) * 0.55 },
    'click-vocab':        { x: w * 0.60, y: chrome + (h - chrome) * 0.08 },
    'vocab-view':         { x: w * 0.40, y: chrome + (h - chrome) * 0.55 },
    'click-qa':           { x: w * 0.68, y: chrome + (h - chrome) * 0.08 },
    'qa-view':            { x: w * 0.55, y: chrome + (h - chrome) * 0.55 },
    'click-sectors':      { x: w * 0.85, y: chrome * 0.5 },
    'sectors-page':       { x: w * 0.50, y: chrome + (h - chrome) * 0.55 },
    'hover-cell':         { x: w * 0.38, y: chrome + (h - chrome) * 0.58 },
    'click-cell':         { x: w * 0.38, y: chrome + (h - chrome) * 0.58 },
    'back-transcript':    { x: w * 0.78, y: chrome + (h - chrome) * 0.08 },
    'click-watchlist':    { x: w * 0.74, y: chrome + (h - chrome) * 0.08 },
    'watchlist-open':     { x: w * 0.87, y: chrome + (h - chrome) * 0.40 },
    'click-pdf':          { x: w * 0.83, y: chrome + (h - chrome) * 0.08 },
    'pdf-generating':     { x: w * 0.83, y: chrome + (h - chrome) * 0.08 },
  };

  return targets[sceneId] || { x: w * 0.50, y: h * 0.50 };
};

const TRANSCRIPT_ROWS = [
  { type: 'positive', text: "I'm happy to highlight credit growth has been robust across all segments." },
  { type: 'neutral', text: 'The board has approved a dividend of ₹19.50 per share.' },
  { type: 'negative', text: 'We continue to see elevated credit costs in the retail segment.' },
  { type: 'positive', text: 'Our CASA ratio remains strong at 47.3%.' },
  { type: 'negative', text: 'Slippages remain elevated — we expect moderation in H2.' },
];

const TRAJECTORY_LINES = [
  { name: 'Revenue', color: '#059669', points: '20,55 80,52 140,50 200,48 260,46 320,44 380,42 440,40' },
  { name: 'Guidance', color: '#3B82F6', points: '20,70 80,68 140,66 200,65 260,64 320,63 380,62 440,60' },
  { name: 'Margins', color: '#C8922A', points: '20,90 80,88 140,95 200,120 260,100 320,85 380,75 440,70' },
];

// ─── MOCK UI COMPONENTS ───────────────────────────────────────────────────

function DemoBrowserChrome({ url, currentScene }) {
  const isSectorsHover = currentScene === 'click-sectors';
  const isLanding = currentScene === 'landing' || currentScene === 'search-open' || currentScene === 'typing-hdfcbank' || currentScene === 'click-result';

  return (
    <div style={{
      height: 40, background: '#F8FAFC', borderBottom: '1px solid #E4E7EE',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
      position: 'relative', zIndex: 10,
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
      </div>
      <div style={{
        flex: 1, maxWidth: 360, height: 24, background: '#FFFFFF',
        border: '1px solid #E4E7EE', borderRadius: 4, display: 'flex', alignItems: 'center',
        padding: '0 10px', fontSize: 11, color: '#6B7280', fontFamily: 'Space Mono, monospace',
      }}>
        {url}
      </div>
      <div style={{
        marginLeft: 'auto', display: 'flex', gap: 20, alignItems: 'center',
        fontSize: 11, fontFamily: 'Space Mono, monospace', fontWeight: 500,
      }}>
        <span style={{ 
          color: isSectorsHover ? '#C8922A' : '#9CA3AF',
          transition: 'color 150ms ease'
        }}>Sectors</span>
        <span style={{ color: '#9CA3AF' }}>GitHub</span>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: '#0C1628',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFFFFF', fontSize: 10,
        }}>P</div>
      </div>
    </div>
  );
}

function CompanySidebar({ highlightQ4 }) {
  return (
    <div style={{
      width: 140, flexShrink: 0, background: '#F8FAFC', borderRight: '1px solid #E4E7EE',
      height: '100%', padding: 12, boxSizing: 'border-box'
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0C1628' }}>HDFCBANK</div>
      <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>HDFC Bank Ltd.</div>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {['Q4 FY25', 'Q3 FY25', 'Q2 FY25', 'Q1 FY25'].map(q => (
          <div key={q} style={{
            padding: '8px', borderRadius: 4,
            background: q === 'Q4 FY25' && highlightQ4 ? '#FEF3C7' : 'transparent',
            borderLeft: q === 'Q4 FY25' && highlightQ4 ? '2px solid #C8922A' : '2px solid transparent',
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10,
          }}>
            <span style={{ color: '#0C1628' }}>{q}</span>
            <span style={{ color: '#9CA3AF', fontFamily: 'Space Mono' }}>0.76</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubTabs({ activeTab, currentScene }) {
  const tabs = ['Transcript', 'Trajectory', 'Vocab Delta', 'Q&A Split'];
  
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E4E7EE', background: '#FFFFFF' }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab;
        const isHovered = (tab === 'Trajectory' && currentScene === 'click-trajectory') ||
                          (tab === 'Vocab Delta' && currentScene === 'click-vocab') ||
                          (tab === 'Q&A Split' && currentScene === 'click-qa');
        
        return (
          <div key={tab} style={{
            padding: '10px 16px', fontSize: 11, cursor: 'pointer',
            color: isActive || isHovered ? '#C8922A' : '#9CA3AF',
            borderBottom: `2px solid ${isActive ? '#C8922A' : 'transparent'}`,
            background: isHovered ? 'rgba(200,146,42,0.06)' : 'transparent',
            transition: 'all 150ms ease',
            fontFamily: 'Inter, sans-serif',
            fontWeight: isActive ? 600 : 400,
          }}>
            {tab}
          </div>
        );
      })}
    </div>
  );
}

function ActionButtons({ currentScene }) {
  const isWatchlistHover = currentScene === 'click-watchlist';
  const isPDFHover = currentScene === 'click-pdf' || currentScene === 'pdf-generating';

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, border: `1px solid ${isWatchlistHover ? '#C8922A' : '#E4E7EE'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: isWatchlistHover ? '#C8922A' : '#9CA3AF',
        background: isWatchlistHover ? '#FEF3C7' : 'transparent',
      }}>★</div>
      <div style={{
        width: 28, height: 28, borderRadius: 6, border: `1px solid ${isPDFHover ? '#C8922A' : '#E4E7EE'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPDFHover ? '#C8922A' : '#9CA3AF',
        background: isPDFHover ? '#FEF3C7' : 'transparent',
      }}>
        {currentScene === 'pdf-generating' ? '...' : '↓'}
      </div>
    </div>
  );
}

// ─── SCENE RENDERERS ───────────────────────────────────────────────────────

function SceneLanding({ elapsed }) {
  return (
    <div style={{ display: 'flex', height: '100%', padding: 24, gap: 24, boxSizing: 'border-box' }}>
      <div style={{ width: 320, flexShrink: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: '#0C1628', lineHeight: 1.2 }}>What management says tells you what's coming.</div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 16, lineHeight: 1.6 }}>EarningLens reads every earnings call from 35 NSE companies and tracks management tone shifts.</div>
        <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
          <div style={{ height: 32, width: 100, background: '#0C1628', borderRadius: 6 }} />
          <div style={{ height: 32, width: 100, border: '1px solid #E4E7EE', borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ flex: 1, border: '1px solid #E4E7EE', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 32, background: '#F8FAFC', borderBottom: '1px solid #E4E7EE' }} />
        <div style={{ flex: 1, padding: 12 }}>
           <div style={{ height: 8, width: '40%', background: '#FEF3C7', borderRadius: 2, marginBottom: 12 }} />
           <div style={{ height: 12, width: '90%', background: '#F1F5F9', borderRadius: 2, marginBottom: 8 }} />
           <div style={{ height: 12, width: '80%', background: '#F1F5F9', borderRadius: 2, marginBottom: 8 }} />
           <div style={{ height: 12, width: '45%', background: '#F1F5F9', borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

function SearchOverlay({ elapsed, currentScene }) {
  const typed = 'HDFCBANK'.slice(0, Math.min(8, Math.floor(elapsed / 120)));
  const showResults = elapsed > 1200 || currentScene === 'click-result';
  const isResultHover = currentScene === 'click-result';

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,22,40,0.85)', display: 'flex', justifyContent: 'center', padding: '80px 24px', zIndex: 50 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{
          height: 44, background: '#FFFFFF', borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 16px',
          border: '1px solid #C8922A', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <span style={{ fontSize: 14, fontFamily: 'Space Mono' }}>{typed}</span>
          {elapsed % 1000 < 500 && <div style={{ width: 2, height: 18, background: '#C8922A', marginLeft: 2 }} />}
        </div>
        {showResults && (
          <div style={{ marginTop: 8, background: '#FFFFFF', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{
              padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
              background: isResultHover ? '#FEF3C7' : 'transparent', transition: 'background 150ms ease',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>HDFCBANK</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>HDFC Bank Limited</div>
              </div>
              <div style={{ fontSize: 9, color: '#C8922A', fontFamily: 'Space Mono' }}>BANKING</div>
            </div>
            <div style={{ padding: '12px 16px', opacity: 0.5, borderTop: '1px solid #F1F5F9' }}>TCS — Tata Consultancy Services</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SceneTranscript({ elapsed, currentScene, activeTab }) {
  const showLoading = currentScene === 'transcript-load';
  const briefText = "Management tone for HDFC Bank was constructive at 0.76, up from 0.73 last quarter. Revenue lead driven by retail loan growth, though margin language softened on credit costs.";
  const typedBrief = briefText.slice(0, Math.min(briefText.length, Math.floor(elapsed / 25)));
  
  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      <CompanySidebar highlightQ4={!showLoading} />
      <div style={{ flex: 1, background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Q4 FY2025</div>
          <ActionButtons currentScene={currentScene} />
        </div>
        <SubTabs activeTab={activeTab} currentScene={currentScene} />
        
        <div style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
          {showLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <div style={{ height: 60, width: '100%', background: '#F8FAFC', borderRadius: 6 }} />
               {[1,2,3,4].map(i => <div key={i} style={{ height: 32, width: '100%', background: '#F1F5F9', borderRadius: 4 }} />)}
            </div>
          ) : activeTab === 'Transcript' ? (
            <div>
              <div style={{ 
                background: '#FEF3C7', borderLeft: '3px solid #C8922A', padding: 14, borderRadius: '0 6px 6px 0',
                fontSize: 11, lineHeight: 1.6, marginBottom: 20, minHeight: 60,
              }}>
                <div style={{ fontSize: 9, color: '#C8922A', fontWeight: 700, marginBottom: 4 }}>ANALYST BRIEF</div>
                {typedBrief}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TRANSCRIPT_ROWS.map((r, i) => {
                  const isPos = r.type === 'positive';
                  const isNeg = r.type === 'negative';
                  return (
                    <div key={i} style={{ 
                      padding: '8px 12px', borderLeft: `3px solid ${isPos ? '#059669' : isNeg ? '#DC2626' : '#E4E7EE'}`,
                      background: isPos ? '#ECFDF5' : isNeg ? '#FEF2F2' : 'transparent',
                      fontSize: 10, color: '#374151', borderRadius: '0 4px 4px 0',
                    }}>{r.text}</div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'Trajectory' ? (
            <div style={{ animation: 'fadeIn 300ms ease' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Sentiment Trajectory</div>
              <svg viewBox="0 0 460 140" style={{ width: '100%', height: 160 }}>
                {TRAJECTORY_LINES.map(line => (
                  <polyline key={line.name} fill="none" stroke={line.color} strokeWidth="2.5" points={line.points} />
                ))}
              </svg>
            </div>
          ) : activeTab === 'Vocab Delta' ? (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                   <div style={{ fontSize: 9, color: '#059669', fontWeight: 700, marginBottom: 12 }}>▲ INCREASED</div>
                   {['robust', 'confident', 'optimistic', 'digital'].map(w => (
                     <div key={w} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: 11 }}>
                        <span style={{ fontFamily: 'Space Mono' }}>{w}</span>
                        <span style={{ color: '#059669' }}>+4×</span>
                     </div>
                   ))}
                </div>
                <div>
                   <div style={{ fontSize: 9, color: '#DC2626', fontWeight: 700, marginBottom: 12 }}>▼ DECREASED</div>
                   {['headwinds', 'cautious', 'legacy', 'drag'].map(w => (
                     <div key={w} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: 11 }}>
                        <span style={{ fontFamily: 'Space Mono' }}>{w}</span>
                        <span style={{ color: '#DC2626' }}>-3×</span>
                     </div>
                   ))}
                </div>
             </div>
          ) : activeTab === 'Q&A Split' ? (
            <div style={{ display: 'flex', gap: 20 }}>
               <div style={{ flex: 1, padding: 20, background: '#F8FAFC', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>PREPARED REMARKS</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#059669', margin: '8px 0' }}>0.82</div>
                  <div style={{ height: 4, background: '#E4E7EE', borderRadius: 2 }}>
                     <div style={{ width: '82%', height: '100%', background: '#059669' }} />
                  </div>
               </div>
               <div style={{ flex: 1, padding: 20, background: '#F8FAFC', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>Q&A SESSION</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#C8922A', margin: '8px 0' }}>0.64</div>
                  <div style={{ height: 4, background: '#E4E7EE', borderRadius: 2 }}>
                     <div style={{ width: '64%', height: '100%', background: '#C8922A' }} />
                  </div>
               </div>
            </div>
          ) : null}
        </div>

        {/* Watchlist Panel Overlay */}
        {currentScene === 'watchlist-open' && (
          <div style={{ 
            position: 'absolute', top: 40, right: 0, bottom: 0, width: 120, background: '#FFFFFF',
            borderLeft: '1px solid #E4E7EE', boxShadow: '-4px 0 12px rgba(0,0,0,0.05)',
            padding: 12, animation: 'slideInRight 300ms ease'
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', marginBottom: 12 }}>WATCHLIST</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#0C1628', background: '#F8FAFC', padding: 8, borderRadius: 4 }}>HDFCBANK</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', padding: 8 }}>RELIANCE</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SceneSectors({ currentScene }) {
  const isCellHover = currentScene === 'hover-cell' || currentScene === 'click-cell';
  
  return (
    <div style={{ height: '100%', padding: 24, background: '#FFFFFF' }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#0C1628', marginBottom: 20 }}>Banking Intelligence</div>
      <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(8, 1fr)', gap: 4 }}>
        <div />
        {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ fontSize: 8, color: '#9CA3AF', textAlign: 'center' }}>Q{i} FY24</div>)}
        
        {['HDFCBANK', 'ICICIBANK', 'SBIN'].map(t => (
          <React.Fragment key={t}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{t}</div>
            {[0.76, 0.78, 0.81, 0.74, 0.72, 0.84, 0.79, 0.80].map((s, i) => {
              const isTarget = t === 'ICICIBANK' && i === 2;
              return (
                <div key={i} style={{ 
                  height: 32, background: getHeatmapColor(s), borderRadius: 3,
                  border: isTarget && isCellHover ? '2px solid #C8922A' : 'none',
                  transform: isTarget && isCellHover ? 'scale(1.15)' : 'none',
                  zIndex: isTarget && isCellHover ? 2 : 1,
                  transition: 'all 200ms ease',
                }} />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

export default function CinematicWalkthrough() {
  const [loopMs, setLoopMs] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 400, y: 100 });
  const [screenDims, setScreenDims] = useState({ w: 848, h: 530 });
  const [ripple, setRipple] = useState(null);
  
  const screenRef = useRef(null);
  const cursorRef = useRef({ x: 400, y: 100 });
  const targetRef = useRef({ x: 400, y: 100 });
  const startRef = useRef(Date.now());
  const rafRef = useRef(null);

  // Scene Calculation
  let t = loopMs % TOTAL_MS;
  let sceneIndex = 0;
  let elapsedInScene = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (t < SCENES[i].duration) {
      sceneIndex = i;
      elapsedInScene = t;
      break;
    }
    t -= SCENES[i].duration;
  }
  const currentScene = SCENES[sceneIndex];
  const progressPct = ((loopMs % TOTAL_MS) / TOTAL_MS) * 100;

  // Initialize measurement
  useEffect(() => {
    if (screenRef.current) {
      const rect = screenRef.current.getBoundingClientRect();
      setScreenDims({ w: rect.width, h: rect.height });
    }
  }, []);

  // Update Target when scene changes
  useEffect(() => {
    targetRef.current = getTarget(currentScene.id, screenDims);
  }, [currentScene.id, screenDims]);

  // Click Ripple Logic
  useEffect(() => {
    if (currentScene.click) {
      const timer = setTimeout(() => {
        setRipple({ x: cursorPos.x, y: cursorPos.y, id: Date.now() });
        setTimeout(() => setRipple(null), 500);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentScene.id]);

  // Loop & Cursor Animation
  useEffect(() => {
    const tick = () => {
      setLoopMs(Date.now() - startRef.current);
      
      const pos = cursorRef.current;
      const target = targetRef.current;
      pos.x += (target.x - pos.x) * 0.07;
      pos.y += (target.y - pos.y) * 0.07;
      setCursorPos({ x: pos.x, y: pos.y });
      
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Map Scene to State
  const activeTab = (() => {
    if (['click-trajectory', 'trajectory-view'].includes(currentScene.id)) return 'Trajectory';
    if (['click-vocab', 'vocab-view'].includes(currentScene.id)) return 'Vocab Delta';
    if (['click-qa', 'qa-view'].includes(currentScene.id)) return 'Q&A Split';
    return 'Transcript';
  })();

  const url = currentScene.id.startsWith('search') || currentScene.id === 'landing' 
    ? 'earninglens.vercel.app' 
    : currentScene.id.includes('sector') 
      ? 'earninglens.vercel.app/sector/banking' 
      : 'earninglens.vercel.app/company/HDFCBANK/Q4_FY25';

  return (
    <div style={{
      maxWidth: 1000, margin: '0 auto', background: '#FFFFFF',
      border: '1px solid #E4E7EE', borderRadius: 14,
      boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.08)',
      overflow: 'hidden', position: 'relative', height: 560,
    }}>
      <style>{`
        @keyframes rippleExpand {
          0%   { width: 0px;  height: 0px;  opacity: 1; }
          100% { width: 44px; height: 44px; opacity: 0; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      <div ref={screenRef} style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        <DemoBrowserChrome url={url} currentScene={currentScene.id} />
        
        <div style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
          {/* SCENE CONTENT */}
          {currentScene.id === 'landing' && <SceneLanding elapsed={elapsedInScene} />}
          {(currentScene.id.startsWith('search') || currentScene.id.startsWith('typing') || currentScene.id === 'click-result') && (
            <>
              <SceneLanding elapsed={elapsedInScene} />
              <SearchOverlay elapsed={elapsedInScene} currentScene={currentScene.id} />
            </>
          )}
          {(currentScene.id.startsWith('transcript') || currentScene.id.startsWith('click-') || currentScene.id.startsWith('brief') || currentScene.id.startsWith('trajectory') || currentScene.id.startsWith('vocab') || currentScene.id.startsWith('qa') || currentScene.id.startsWith('watchlist') || currentScene.id.startsWith('pdf') || currentScene.id === 'back-transcript') && (
            <SceneTranscript elapsed={elapsedInScene} currentScene={currentScene.id} activeTab={activeTab} />
          )}
          {(currentScene.id.startsWith('sector') || currentScene.id === 'hover-cell' || currentScene.id === 'click-cell') && (
            <SceneSectors currentScene={currentScene.id} />
          )}

          {/* CURSOR & RIPPLE */}
          <div style={{
            position: 'absolute', left: cursorPos.x, top: cursorPos.y, zIndex: 100, pointerEvents: 'none',
          }}>
            <svg width="14" height="20" viewBox="0 0 12 18">
              <path d="M0 0L0 14L3.5 10.5L5.5 15L7 14.5L5 9.5L9 9.5Z" fill="#0C1628" stroke="#FFFFFF" strokeWidth="1" />
            </svg>
          </div>

          {ripple && (
            <div style={{
              position: 'absolute', left: ripple.x, top: ripple.y, width: 0, height: 0,
              borderRadius: '50%', border: '2px solid #C8922A', transform: 'translate(-50%, -50%)',
              pointerEvents: 'none', animation: 'rippleExpand 450ms ease-out forwards', zIndex: 90
            }} />
          )}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: '#F1F5F9', zIndex: 10,
      }}>
        <div style={{
          height: '100%', background: '#C8922A', width: `${progressPct}%`,
          transition: 'width 50ms linear',
        }} />
        {currentScene.label && (
          <span style={{
            position: 'absolute', right: 12, top: -18, fontSize: 10, color: '#9CA3AF',
            fontFamily: 'Space Mono, monospace', fontWeight: 500
          }}>{currentScene.label}</span>
        )}
      </div>
    </div>
  );
}
