/**
 * Source types for the Argos veille platform.
 */

export type SourceType = 'rss' | 'reddit'

export interface Source {
  id: string
  user_id: string
  type: SourceType
  url: string
  name: string
  category: string | null
  created_at: string
  last_fetched_at: string | null
  is_active: boolean
}

export interface SourceCreate {
  type: SourceType
  url: string
  name: string
  category?: string
}

export interface SourceList {
  sources: Source[]
  total: number
}

export interface SuggestedSource {
  type: SourceType
  url: string
  name: string
  category: string
}

export interface SuggestedSourcesList {
  sources: SuggestedSource[]
}

// Predefined categories for sources
export const SOURCE_CATEGORIES = [
  'Tech',
  'Science',
  'News',
  'Finance',
  'Gaming',
  'Programming',
  'DevOps',
  'AI/ML',
  'Security',
  'Other',
] as const

export type SourceCategory = (typeof SOURCE_CATEGORIES)[number]
