import { useState, useRef } from 'react'
import { findRelevantSentences } from '../utils/transcriptSearch'

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://earninglens-backend.onrender.com'

const EXAMPLE_QUESTIONS = [
  'What did management say about margins?',
  'What concerns were raised about guidance?',
  'How did revenue perform this quarter?',
  'What is the outlook for the next quarter?',
  'What competitive pressures did management mention?',
]

export default function AskTranscript({
  sentences,
  companyName,
  quarterId,
  onHighlight,
}) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showExamples, setShowExamples] = useState(false)
  const inputRef = useRef(null)

  const handleAsk = async () => {
    const q = question.trim()
    if (!q || loading || !sentences?.length) return

    setLoading(true)
    setError(null)
    setAnswer(null)
    if (onHighlight) onHighlight([])

    try {
      // Step 1: Find relevant sentences using keyword scoring
      const relevant = findRelevantSentences(sentences, q, 15)

      if (relevant.length === 0) {
        setAnswer({
          text: 'No relevant sentences found for this question in the transcript.',
          indices: [],
          sentenceCount: 0,
        })
        setLoading(false)
        return
      }

      // Step 2: Build the Groq prompt
      const sentenceList = relevant
        .map((item, i) =>
          `[${i}] (index:${item.originalIndex}) "${item.sentence.text}"`
        )
        .join('\n')

      const prompt = `You are a senior equity research analyst reviewing an earnings call transcript for ${companyName} (${quarterId}).

An analyst has asked: "${q}"

Here are the most relevant sentences from the transcript (pre-selected by keyword relevance):
${sentenceList}

Instructions:
1. Answer the question concisely in 2-4 sentences based ONLY on what management said in these sentences.
2. Do not add external knowledge. Only use what is stated in the sentences above.
3. If the sentences do not contain enough information to answer the question, say so clearly.
4. Return your response as valid JSON only, with no extra text.

Return exactly this JSON format:
{
  "answer": "Your 2-4 sentence answer here.",
  "relevantIndices": [array of index numbers from the sentences above that directly support your answer],
  "confidence": "high" | "medium" | "low"
}`

      // Step 3: Call Groq API
      const response = await fetch(`${BACKEND_URL}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: q,
      sentences: relevant.map(r => r.sentence),
      company_name: companyName,
    quarter_id: quarterId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`)
  }

  const data = await response.json()

  let parsed
  try {
    parsed = JSON.parse(data.result)
  } catch {
    parsed = {
      answer: 'Could not parse response.',
      relevantIndices: [],
      confidence: 'low',
    }
  } 

      // Map local indices back to original transcript indices
      const highlightIndices = (parsed.relevantIndices || [])
        .filter(i => i >= 0 && i < relevant.length)
        .map(i => relevant[i].originalIndex)

      setAnswer({
        text: parsed.answer || 'Could not generate an answer.',
        indices: highlightIndices,
        sentenceCount: relevant.length,
        confidence: parsed.confidence || 'medium',
      })

      // Step 4: Highlight the relevant sentences in the transcript
      if (onHighlight) onHighlight(highlightIndices)

    } catch (err) {
      setError(
        err.message.includes('429')
          ? 'Rate limit reached. Please wait 30 seconds and try again.'
          : 'Could not generate answer. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (example) => {
    setQuestion(example)
    setShowExamples(false)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setQuestion('')
    setAnswer(null)
    setError(null)
    if (onHighlight) onHighlight([])
  }

  return (
    <div
      style={{
        padding: '16px 24px',
        background: '#FAFBFC',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 200ms ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            flexShrink: 0,
          }}
        >
          ?
        </div>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'Space Mono, monospace',
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          ASK THE TRANSCRIPT
        </span>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
            color: '#9CA3AF',
            marginLeft: 'auto',
          }}
        >
          {sentences?.length || 0} sentences indexed
        </span>
      </div>

      {/* Examples - Now in flow above the input */}
      {showExamples && !question && (
        <div
          style={{
            marginBottom: '12px',
            background: '#FFFFFF',
            border: '1px solid #E4E7EE',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            animation: 'slideUpExpand 200ms ease-out',
          }}
        >
          <div
            style={{
              padding: '8px 12px 6px',
              fontSize: '10px',
              color: '#9CA3AF',
              fontFamily: 'Space Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            Example questions
          </div>
          {EXAMPLE_QUESTIONS.map((ex, i) => (
            <div
              key={i}
              onMouseDown={() => handleExampleClick(ex)}
              style={{
                padding: '9px 14px',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                color: '#374151',
                cursor: 'pointer',
                borderBottom: i < EXAMPLE_QUESTIONS.length - 1
                  ? '1px solid #F9FAFB'
                  : 'none',
                transition: 'background 80ms ease',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = '#F8FAFC')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              {ex}
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#DC2626',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {error}
        </div>
      )}

      {/* Answer state - Now in flow above the input */}
      {answer && !loading && (
        <div
          style={{
            marginBottom: '14px',
            padding: '16px 18px',
            background: '#FFFFFF',
            border: '1px solid #E4E7EE',
            borderLeft: '3px solid #C8922A',
            borderRadius: '0 8px 8px 0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            animation: 'slideUpExpand 250ms ease-out',
          }}
        >
          {/* Answer header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'Space Mono, monospace',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              ANSWER
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {answer.indices.length > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'Space Mono, monospace',
                    color: '#C8922A',
                    background: '#FEF3C7',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    border: '1px solid #FCD34D',
                  }}
                >
                  {answer.indices.length} source
                  {answer.indices.length !== 1 ? 's' : ''} highlighted
                </span>
              )}
            </div>
          </div>

          {/* Answer text */}
          <p
            style={{
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: '#111827',
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            {answer.text}
          </p>
        </div>
      )}

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAsk()
              if (e.key === 'Escape') setShowExamples(false)
            }}
            onFocus={() => setShowExamples(true)}
            onBlur={() => setTimeout(() => setShowExamples(false), 200)}
            placeholder="Ask a question about this transcript..."
            style={{
              width: '100%',
              height: '40px',
              padding: '0 14px',
              background: '#FFFFFF',
              border: `1px solid ${question ? '#C8922A' : '#E4E7EE'}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: '#111827',
              outline: 'none',
              transition: 'all 150ms ease',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Ask button */}
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{
            height: '40px',
            padding: '0 18px',
            background: question.trim() ? '#0C1628' : '#F3F4F6',
            color: question.trim() ? '#FFFFFF' : '#9CA3AF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            cursor: question.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 150ms ease',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (question.trim() && !loading)
              e.currentTarget.style.background = '#1E2B3A'
          }}
          onMouseLeave={e => {
            if (question.trim() && !loading)
              e.currentTarget.style.background = '#0C1628'
          }}
        >
          {loading ? (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                style={{ animation: 'spin 0.7s linear infinite' }}
              >
                <circle
                  cx="6" cy="6" r="4.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                  strokeDasharray="14"
                  strokeDashoffset="7"
                />
              </svg>
              Searching...
            </>
          ) : (
            'Ask →'
          )}
        </button>

        {/* Clear button */}
        {(answer || question) && !loading && (
          <button
            onClick={handleClear}
            style={{
              height: '40px',
              width: '40px',
              background: 'transparent',
              border: '1px solid #E4E7EE',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#9CA3AF',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#CBD5E1'
              e.currentTarget.style.color = '#374151'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E4E7EE'
              e.currentTarget.style.color = '#9CA3AF'
            }}
            title="Clear question"
          >
            ×
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUpExpand {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
