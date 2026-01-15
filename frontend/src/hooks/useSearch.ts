/**
 * Hook for full-text search across articles.
 * Handles debouncing, pagination, and loading states.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import type { SearchResultItem, SearchResponse } from '../types/article'

const API_BASE = 'http://localhost:8000'
const DEFAULT_LIMIT = 20
const DEBOUNCE_MS = 300

interface UseSearchReturn {
  results: SearchResultItem[]
  loading: boolean
  error: string | null
  hasMore: boolean
  query: string
  setQuery: (q: string) => void
  search: (q: string) => Promise<void>
  loadMore: () => Promise<void>
  clear: () => void
}

export function useSearch(): UseSearchReturn {
  const { session } = useAuth()
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [query, setQueryState] = useState('')
  const [offset, setOffset] = useState(0)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const executeSearch = useCallback(
    async (searchQuery: string, currentOffset: number, append: boolean = false) => {
      if (!session?.access_token) {
        setError('Not authenticated')
        return
      }

      if (!searchQuery.trim()) {
        setResults([])
        setHasMore(false)
        return
      }

      // Cancel previous request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      abortRef.current = new AbortController()

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          offset: currentOffset.toString(),
          limit: DEFAULT_LIMIT.toString(),
        })

        const response = await fetch(`${API_BASE}/api/articles/search?${params}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          signal: abortRef.current.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || `HTTP ${response.status}`)
        }

        const data: SearchResponse = await response.json()

        if (append) {
          setResults((prev) => [...prev, ...data.results])
        } else {
          setResults(data.results)
        }

        setHasMore(data.has_more)
        setOffset(currentOffset + data.results.length)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return // Ignore aborted requests
        }
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    },
    [session?.access_token]
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
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  return {
    results,
    loading,
    error,
    hasMore,
    query,
    setQuery,
    search,
    loadMore,
    clear,
  }
}
