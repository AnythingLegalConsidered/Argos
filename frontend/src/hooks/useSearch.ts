/**
 * Hook for full-text search across articles.
 * Handles debouncing, pagination, and loading states.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { api } from '../services/api'
import type { SearchResultItem, SearchResponse } from '../types/article'

const DEFAULT_LIMIT = 20
const DEBOUNCE_MS = 300

interface UseSearchReturn {
  results: SearchResultItem[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  query: string
  setQuery: (q: string) => void
  search: (q: string) => Promise<void>
  loadMore: () => Promise<void>
  clear: () => void
}

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [query, setQueryState] = useState('')
  const [offset, setOffset] = useState(0)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const requestIdRef = useRef(0)

  const executeSearch = useCallback(
    async (searchQuery: string, currentOffset: number, append: boolean = false) => {
      if (!searchQuery.trim()) {
        setResults([])
        setHasMore(false)
        setTotalCount(0)
        return
      }

      // Track request to ignore stale responses
      const requestId = ++requestIdRef.current

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          offset: currentOffset.toString(),
          limit: DEFAULT_LIMIT.toString(),
        })

        const data = await api.get<SearchResponse>(`/api/articles/search?${params}`)

        // Ignore if a newer request was made
        if (requestId !== requestIdRef.current) return

        if (append) {
          setResults((prev) => [...prev, ...data.results])
        } else {
          setResults(data.results)
        }

        setHasMore(data.has_more)
        setTotalCount(data.total_count)
        setOffset(currentOffset + data.results.length)
      } catch (err) {
        // Ignore if a newer request was made
        if (requestId !== requestIdRef.current) return
        setError(err instanceof Error ? err.message : 'Erreur de recherche')
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    []
  )

  const search = useCallback(
    async (q: string) => {
      setOffset(0)
      await executeSearch(q, 0, false)
    },
    [executeSearch]
  )

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q)

      // Debounce search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        search(q)
      }, DEBOUNCE_MS)
    },
    [search]
  )

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !query.trim()) return
    await executeSearch(query, offset, true)
  }, [loading, hasMore, query, offset, executeSearch])

  const clear = useCallback(() => {
    setQueryState('')
    setResults([])
    setHasMore(false)
    setOffset(0)
    setError(null)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    results,
    loading,
    error,
    hasMore,
    totalCount,
    query,
    setQuery,
    search,
    loadMore,
    clear,
  }
}
