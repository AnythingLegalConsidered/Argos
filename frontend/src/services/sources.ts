/**
 * Sources API service.
 * Handles all source-related API calls.
 */

import { api } from './api'
import type { Source, SourceCreate, SourceList, SuggestedSourcesList } from '../types/source'

export const sourcesApi = {
  /**
   * Get all sources for the current user.
   */
  async list(filters?: {
    category?: string
    type?: string
    is_active?: boolean
  }): Promise<SourceList> {
    const params = new URLSearchParams()

    if (filters?.category) params.set('category', filters.category)
    if (filters?.type) params.set('type', filters.type)
    if (filters?.is_active !== undefined) {
      params.set('is_active', String(filters.is_active))
    }

    const query = params.toString()
    const endpoint = `/api/sources${query ? `?${query}` : ''}`

    return api.get<SourceList>(endpoint)
  },

  /**
   * Get a single source by ID.
   */
  async get(id: string): Promise<Source> {
    return api.get<Source>(`/api/sources/${id}`)
  },

  /**
   * Create a new source.
   */
  async create(source: SourceCreate): Promise<Source> {
    return api.post<Source>('/api/sources', source)
  },

  /**
   * Delete a source by ID.
   */
  async delete(id: string): Promise<void> {
    return api.delete(`/api/sources/${id}`)
  },

  /**
   * Toggle source active status.
   */
  async toggle(id: string): Promise<Source> {
    return api.patch<Source>(`/api/sources/${id}/toggle`)
  },

  /**
   * Get suggested quality sources.
   */
  async getSuggested(): Promise<SuggestedSourcesList> {
    return api.get<SuggestedSourcesList>('/api/sources/suggested')
  },

  /**
   * Add selected suggested sources.
   */
  async addSuggested(urls: string[]): Promise<SourceList> {
    return api.post<SourceList>('/api/sources/suggested', { urls })
  },
}
