import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'earninglens_watchlist'
const LAST_CHECKED_KEY = 'earninglens_last_checked'

export default function useWatchlist() {
  const [watchlist, setWatchlist] = useState([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setWatchlist(JSON.parse(stored))
    } catch {}
  }, [])

  const addToWatchlist = useCallback((companyId) => {
    setWatchlist(prev => {
      if (prev.includes(companyId)) return prev
      const updated = [...prev, companyId]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const removeFromWatchlist = useCallback((companyId) => {
    setWatchlist(prev => {
      const updated = prev.filter(id => id !== companyId)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const isWatched = useCallback((companyId) => {
    return watchlist.includes(companyId)
  }, [watchlist])

  const toggleWatchlist = useCallback((companyId) => {
    setWatchlist(prev => {
      const isIn = prev.includes(companyId)
      const updated = isIn
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  // Record when user last viewed the platform
  const markLastChecked = useCallback(() => {
    try {
      localStorage.setItem(LAST_CHECKED_KEY, new Date().toISOString())
    } catch {}
  }, [])

  const getLastChecked = useCallback(() => {
    try {
      return localStorage.getItem(LAST_CHECKED_KEY)
    } catch {
      return null
    }
  }, [])

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isWatched,
    toggleWatchlist,
    markLastChecked,
    getLastChecked,
    count: watchlist.length,
  }
}
