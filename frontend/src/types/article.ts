/**
 * Article types for the Argos veille platform.
 */

export interface ArticleListItem {
  id: string
  title: string
  url: string | null
  excerpt: string | null
  author: string | null
  published_at: string | null
  captured_at: string
  source_id: string | null
  source_name: string | null
  source_type: 'rss' | 'reddit' | null
  source_category: string | null
  tags: string[]
  metadata: Record<string, unknown>
}

export interface ArticleDetail extends ArticleListItem {
  content: string | null
}

export interface ArticleListResponse {
  articles: ArticleListItem[]
  total_count: number
  has_more: boolean
  offset: number
  limit: number
}

export interface ArticleFilters {
  source_id?: string
  category?: string
  tag?: string
  from_date?: string
  to_date?: string
}

export interface SearchResultItem {
  id: string
  title: string
  url: string | null
  author: string | null
  published_at: string | null
  captured_at: string
  source_id: string | null
  source_name: string | null
  source_type: 'rss' | 'reddit' | null
  tags: string[]
  rank: number
  headline: string // HTML with <mark> tags
}

export interface SearchResponse {
  results: SearchResultItem[]
  query: string
  total_count: number
  has_more: boolean
  offset: number
  limit: number
}
