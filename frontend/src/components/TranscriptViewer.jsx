import { useState } from 'react'
import { theme } from '../theme'

import AnalystBrief from './AnalystBrief'
import SentenceCard from './SentenceCard'
import LiveIndicator from './LiveIndicator'
import SentimentTrajectory from './SentimentTrajectory'
import VocabDelta from './VocabDelta'
import QASentimentSplit from './QASentimentSplit'
import WatchlistButton from './WatchlistButton'
import PDFExportButton from './PDFExportButton'
import AskTranscript from './AskTranscript'

function formatProcessedAt(processedAt) {
  if (!processedAt) {
    return 'unknown date'
  }

  const date = processedAt instanceof Date ? processedAt : new Date(processedAt)

  if (Number.isNaN(date.getTime())) {
    return 'unknown date'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatQuarterLabel(quarterId) {
  if (!quarterId) {
    return 'Unknown quarter'
  }

  return quarterId.replace(/_/g, ' ')
}

export default function TranscriptViewer({
  sentences = [],
  quarterData = null,
  companyName,
  companyId,
  quarterId,
  priorScore,
}) {
  const [activeTab, setActiveTab] = useState('Transcript')
  const [hoveredTab, setHoveredTab] = useState(null)
  const [highlightedIndices, setHighlightedIndices] = useState([])

  const isLoading = sentences.length === 0 && quarterData === null
  const hasQuarterData = quarterData !== null
  const transcriptPages = quarterData?.transcript_pages ?? quarterData?.pages ?? null
  const sentenceCount = quarterData?.total_sentences ?? sentences.length
  const processedAtLabel = formatProcessedAt(quarterData?.processed_at)
  const quarterLabel = formatQuarterLabel(quarterId)
  const tabs = ['Transcript', 'Trajectory', 'Vocab Delta', 'Q&A Split']

  function computePriorQuarter(quarterId) {
    if (!quarterId) return null
    const m = quarterId.match(/(\d{4})[_ \-]?Q([1-4])/i)
    if (!m) return null
    let year = parseInt(m[1], 10)
    let q = parseInt(m[2], 10)
    if (q > 1) {
      return `${year}_Q${q - 1}`
    }
    return `${year - 1}_Q4`
  }

  const priorQuarter = computePriorQuarter(quarterId)
  const vocabDelta = quarterData?.vocab_delta
  const increasedWords = Array.isArray(vocabDelta?.increased) ? vocabDelta.increased : []
  const decreasedWords = Array.isArray(vocabDelta?.decreased) ? vocabDelta.decreased : []
  const hasVocabShiftData = increasedWords.length > 0 || decreasedWords.length > 0
  const qaSplit = quarterData?.qa_split
  const boundaryFound = Boolean(qaSplit?.boundary_found)

  const tabButtonStyle = (tab) => {
    const isActive = activeTab === tab
    const isHovered = hoveredTab === tab
    return {
      padding: '6px 2px',
      border: 'none',
      borderBottom: isActive ? `2px solid ${theme.colors.amber}` : '2px solid transparent',
      backgroundColor: 'transparent',
      fontFamily: theme.fonts.body,
      fontSize: '12px',
      fontWeight: isActive ? 500 : 400,
      lineHeight: 1.2,
      color: isActive ? theme.colors.amber : isHovered ? theme.colors.textSecondary : theme.colors.textMuted,
      cursor: isActive ? 'default' : 'pointer',
      whiteSpace: 'nowrap',
      transition: 'color 140ms ease, border-color 140ms ease',
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: theme.colors.bgSurface,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* FIXED TOP */}
      <div
        style={{
          flexShrink: 0,
          padding: '24px 32px 16px 32px',
          borderBottom: '1px solid #E4E7EE',
          background: '#FFFFFF',
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            gap: '16px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: '15px',
                fontWeight: 600,
                color: theme.colors.navy,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {quarterLabel}
            </div>
            <div
              style={{
                marginTop: '3px',
                fontFamily: theme.fonts.mono,
                fontSize: '11px',
                color: theme.colors.textTertiary,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {sentenceCount}
              {' '}
              sentences ·
              {' '}
              {transcriptPages !== null ? transcriptPages : '--'}
              {' '}
              pages · processed
              {' '}
              {processedAtLabel}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <WatchlistButton companyId={companyId} companyName={companyName} />
            
            <PDFExportButton
              companyName={companyName}
              companyId={companyId}
              quarterId={quarterId}
              overallScore={quarterData?.overall_score}
              priorScore={priorScore}
              aspectScores={quarterData?.aspect_scores}
              analyticsBrief={quarterData?.analyst_brief}
              sentences={sentences}
              qaSplit={quarterData?.qa_split}
              vocabDelta={quarterData?.vocab_delta}
              sectorAverageScore={quarterData?.sector_average_score}
              peerRelativeScore={quarterData?.peer_relative_score}
              peerRelativeLabel={quarterData?.peer_relative_label}
            />

            <LiveIndicator companyId={companyId} quarterId={quarterId} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                rowGap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  onMouseEnter={() => setHoveredTab(tab)}
                  onMouseLeave={() => setHoveredTab(null)}
                  style={tabButtonStyle(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE MIDDLE */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          padding: '24px 32px',
        }}
      >
        <AnalystBrief
          brief={quarterData?.analyst_brief}
          companyName={companyName}
          quarterId={quarterId}
          overallScore={quarterData?.overall_score}
          priorScore={priorScore}
        />

        {activeTab === 'Transcript' ? (
          <div>
            <div
              style={{
                marginBottom: '8px',
                fontFamily: theme.fonts.mono,
                fontSize: '10px',
                color: theme.colors.textTertiary,
                letterSpacing: '0.08em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              Transcript
            </div>

            {isLoading ? (
              <div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '12px',
                    color: theme.colors.textMuted,
                    marginBottom: '10px',
                  }}
                >
                  Loading transcript...
                </div>

                <style>{`\n                @keyframes transcript-viewer-pulse {\n                  0% {\n                    opacity: 0.45;\n                  }\n                  50% {\n                    opacity: 0.9;\n                  }\n                  100% {\n                    opacity: 0.45;\n                  }\n                }\n              `}</style>

                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    style={{
                      height: '20px',
                      backgroundColor: theme.colors.bgElevated,
                      borderRadius: '3px',
                      marginBottom: '8px',
                      animation: 'transcript-viewer-pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            ) : hasQuarterData && sentences.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  fontFamily: theme.fonts.body,
                  fontSize: '13px',
                  color: theme.colors.textMuted,
                }}
              >
                No sentences found for this quarter.
              </div>
            ) : (
              <div>
                {sentences.map((sentence) => (
                  <SentenceCard
                    key={sentence.id || `${quarterId || 'quarter'}-${sentence.sentence_index}`}
                    sentence={sentence}
                    showAspect={true}
                    isHighlighted={highlightedIndices.includes(sentence.sentence_index)}
                  />
                  ))}
                  </div>
                  )}
                  </div>
                  ) : activeTab === 'Trajectory' ? (
          <div>
            <div
              style={{
                marginBottom: '8px',
                fontFamily: theme.fonts.mono,
                fontSize: '10px',
                color: theme.colors.textTertiary,
                letterSpacing: '0.08em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              Sentiment Trajectory
            </div>

            <SentimentTrajectory companyId={companyId} selectedQuarterId={quarterId} />
          </div>
        ) : activeTab === 'Vocab Delta' ? (
          <div>
            <div
              style={{
                marginBottom: '8px',
                fontFamily: theme.fonts.mono,
                fontSize: '10px',
                color: theme.colors.textTertiary,
                letterSpacing: '0.08em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              Vocab Delta
            </div>

            {hasQuarterData && !hasVocabShiftData ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '32px',
                    marginBottom: '12px',
                    opacity: 0.2,
                  }}
                >
                  δ
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: theme.colors.textMuted,
                    marginBottom: '6px',
                  }}
                >
                  No vocabulary comparison available
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.mono,
                    lineHeight: 1.6,
                    maxWidth: '320px',
                    margin: '0 auto',
                  }}
                >
                  Vocabulary delta requires two consecutive quarters of transcript data.
                  {' '}
                  Process {priorQuarter || 'the prior quarter'} to enable this feature.
                </div>
              </div>
            ) : (
              <VocabDelta
                vocabDelta={vocabDelta}
                currentQuarter={quarterId}
                priorQuarter={priorQuarter}
              />
            )}
          </div>
        ) : activeTab === 'Q&A Split' ? (
          <div>
            <div
              style={{
                marginBottom: '8px',
                fontFamily: theme.fonts.mono,
                fontSize: '10px',
                color: theme.colors.textTertiary,
                letterSpacing: '0.08em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              Q&A Split
            </div>

            {hasQuarterData && !boundaryFound ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '32px',
                    marginBottom: '12px',
                    opacity: 0.2,
                  }}
                >
                  ⇌
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: theme.colors.textMuted,
                    marginBottom: '6px',
                  }}
                >
                  Q&A boundary not detected
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.mono,
                    lineHeight: 1.6,
                    maxWidth: '360px',
                    margin: '0 auto',
                  }}
                >
                  The transcript does not contain a detectable Q&A boundary phrase.
                  {' '}
                  This occurs when the prepared remarks and analyst questions
                  {' '}
                  are not clearly separated in the filing.
                </div>
              </div>
            ) : (
              <QASentimentSplit qaSplit={qaSplit} />
            )}
          </div>
        ) : (
          <div
            style={{
              minHeight: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontFamily: theme.fonts.body,
              fontSize: '13px',
              color: theme.colors.textMuted,
            }}
          >
            Component coming soon
          </div>
        )}
      </div>

      {/* FIXED BOTTOM — PINNED ASK BAR */}
      {activeTab === 'Transcript' && (
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid #E4E7EE',
            background: '#FAFBFC',
          }}
        >
          <AskTranscript
            sentences={sentences}
            companyName={companyName}
            quarterId={quarterId}
            onHighlight={setHighlightedIndices}
          />
        </div>
      )}
    </div>
  )
}