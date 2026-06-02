import { useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import PDFReport from './PDFReport'

export default function PDFExportButton({
  companyName,
  companyId,
  quarterId,
  overallScore,
  priorScore,
  aspectScores,
  analyticsBrief,
  sentences,
  qaSplit,
  vocabDelta,
  sectorAverageScore,
  peerRelativeScore,
  peerRelativeLabel,
}) {
  const reportRef = useRef(null)
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (loading) return
    setLoading(true)

    try {
      const element = reportRef.current
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = pdfHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()

      // Add additional pages if report is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }

      pdf.save(`${companyId}_${quarterId}_EarningLens.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Hidden report element */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <PDFReport
          ref={reportRef}
          companyName={companyName}
          companyId={companyId}
          quarterId={quarterId}
          overallScore={overallScore}
          priorScore={priorScore}
          aspectScores={aspectScores}
          analyticsBrief={analyticsBrief}
          sentences={sentences}
          qaSplit={qaSplit}
          vocabDelta={vocabDelta}
          sectorAverageScore={sectorAverageScore}
          peerRelativeScore={peerRelativeScore}
          peerRelativeLabel={peerRelativeLabel}
        />
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          background: loading ? '#F3F4F6' : 'transparent',
          border: '1px solid #E4E7EE',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          color: loading ? '#9CA3AF' : '#374151',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!loading) {
            e.currentTarget.style.borderColor = '#CBD5E1'
            e.currentTarget.style.color = '#0C1628'
          }
        }}
        onMouseLeave={e => {
          if (!loading) {
            e.currentTarget.style.borderColor = '#E4E7EE'
            e.currentTarget.style.color = '#374151'
          }
        }}
      >
        {loading ? (
          <>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              style={{ animation: 'spin 0.8s linear infinite' }}
            >
              <circle
                cx="6" cy="6" r="5"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
                strokeDasharray="20"
                strokeDashoffset="10"
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 1v8M3.5 6l3 3 3-3M1 10v1.5a.5.5 0 00.5.5h10a.5.5 0 00.5-.5V10" />
            </svg>
            Export PDF
          </>
        )}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
