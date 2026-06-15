import { useEffect, useState } from "react"
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "../firebase"

const CACHE_VERSION = "v1"

function getCacheKey(type, companyId, quarterId) {
  return `el_${CACHE_VERSION}_${type}_${companyId}_${quarterId}`
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage full — clear old cache entries and try once more
    clearOldCache()
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      // Still full — ignore silently
    }
  }
}

function clearOldCache() {
  // Remove oldest EarningLens cache entries if storage is full
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("el_")) {
      keysToRemove.push(key)
    }
  }
  // Remove first half of cached entries (oldest first approximately)
  keysToRemove.slice(0, Math.floor(keysToRemove.length / 2)).forEach(k => {
    localStorage.removeItem(k)
  })
}

export default function useTranscript(companyId, quarterId) {
  const [quarterData, setQuarterData] = useState(null)
  const [sentences, setSentences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!companyId || !quarterId) {
      setQuarterData(null)
      setSentences([])
      setError(null)
      setLoading(false)
      return
    }

    let isActive = true

    async function loadTranscriptData() {
      setLoading(true)
      setError(null)

      const quarterCacheKey = getCacheKey("quarter", companyId, quarterId)
      const sentencesCacheKey = getCacheKey("sentences", companyId, quarterId)

      // ── Try cache first for quarter data ──
      const cachedQuarter = readCache(quarterCacheKey)
      if (cachedQuarter) {
        if (isActive) setQuarterData(cachedQuarter)
      }

      // ── Try cache first for sentences ──
      const cachedSentences = readCache(sentencesCacheKey)
      if (cachedSentences) {
        if (isActive) {
          setSentences(cachedSentences)
          // If both are cached, we are done — no Firestore reads needed
          if (cachedQuarter) {
            setLoading(false)
            return
          }
        }
      }

      // ── Fetch quarter from Firestore if not cached ──
      try {
        const quarterRef = doc(db, "companies", companyId, "quarters", quarterId)
        const quarterSnap = await getDoc(quarterRef)

        if (!isActive) return

        const quarterResult = quarterSnap.exists()
          ? { id: quarterSnap.id, ...quarterSnap.data() }
          : null

        setQuarterData(quarterResult)

        if (quarterResult) {
          writeCache(quarterCacheKey, quarterResult)
        }
      } catch (err) {
        if (!isActive) return
        if (!cachedQuarter) {
          setError(err.message || "Failed to load quarter data")
        }
        // If we have cached data, silently ignore the error
      }

      // ── Fetch sentences from Firestore if not cached ──
      if (!cachedSentences) {
        try {
          const sentencesRef = collection(
            db,
            "companies",
            companyId,
            "quarters",
            quarterId,
            "sentences"
          )
          const sentencesQuery = query(sentencesRef, orderBy("sentence_index", "asc"))
          const sentencesSnap = await getDocs(sentencesQuery)

          if (!isActive) return

          const sentencesResult = sentencesSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
          }))

          setSentences(sentencesResult)
          writeCache(sentencesCacheKey, sentencesResult)
        } catch (err) {
          if (!isActive) return
          setError(err.message || "Failed to load sentences")
        }
      }

      if (isActive) setLoading(false)
    }

    loadTranscriptData()

    return () => {
      isActive = false
    }
  }, [companyId, quarterId])

  return { quarterData, sentences, loading, error }
}