/**
 * Hook for fetching and managing articles.
 * Handles pagination, filtering, and loading states.
 */

import { useState, useCallback, useEffect } from 'react'
import { api } from '../services/api'
import type { ArticleListItem, ArticleListResponse, ArticleFilters } from '../types/article'

const DEFAULT_LIMIT = 20

interface UseArticlesReturn {
  articles: ArticleListItem[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useArticles(filters: ArticleFilters = {}): UseArticlesReturn {
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)

  const fetchArticles = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          offset: currentOffset.toString(),
          limit: DEFAULT_LIMIT.toString(),
        })

        if (filters.source_id) params.append('source_id', filters.source_id)
        if (filters.category) params.append('category', filters.category)
        if (filters.tag) params.append('tag', filters.tag)
        if (filters.from_date) params.append('from_date', filters.from_date)
        if (filters.to_date) params.append('to_date', filters.to_date)

        const data = await api.get<ArticleListResponse>(`/api/articles?${params}`)

        if (append) {
          setArticles((prev) => [...prev, ...data.articles])
        } else {
          setArticles(data.articles)
        }

        setHasMore(data.has_more)
        setTotalCount(data.total_count)
        setOffset(currentOffset + data.articles.length)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger les articles')
      } finally {
        setLoading(false)
      }
    },
    [filters.source_id, filters.category, filters.tag, filters.from_date, filters.to_date]
  )

  // Initial load
  useEffect(() => {
    setArticles([])
    setOffset(0)
    setHasMore(true)
    fetchArticles(0, false)
  }, [fetchArticles])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    await fetchArticles(offset, true)
  }, [loading, hasMore, offset, fetchArticles])

  const refresh = useCallback(async () => {
    setArticles([])
    setOffset(0)
    setHasMore(true)
    await fetchArticles(0, false)
  }, [fetchArticles])

  return {
    articles,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
  }
}
