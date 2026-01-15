/**
 * API client for backend communication.
 * Handles authentication headers and error handling.
 */

import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ApiErrorResponse {
  detail: string
}

/**
 * Map HTTP status codes to user-friendly error messages (French)
 */
function getErrorMessage(status: number, detail?: string): string {
  if (detail) return detail

  switch (status) {
    case 400:
      return 'Requête invalide. Vérifiez les données saisies.'
    case 401:
      return 'Session expirée. Veuillez vous reconnecter.'
    case 403:
      return "Vous n'avez pas les droits pour effectuer cette action."
    case 404:
      return 'Ressource introuvable.'
    case 409:
      return 'Cette ressource existe déjà.'
    case 422:
      return 'Données invalides. Vérifiez le format.'
    case 429:
      return 'Trop de requêtes. Veuillez patienter.'
    case 500:
      return 'Erreur serveur. Veuillez réessayer plus tard.'
    case 502:
    case 503:
    case 504:
      return 'Service temporairement indisponible.'
    default:
      return `Erreur inattendue (${status})`
  }
}

class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let detail: string | undefined

      try {
        const error: ApiErrorResponse = await response.json()
        detail = error.detail
      } catch {
        // JSON parsing failed, use status-based message
      }

      throw new Error(getErrorMessage(response.status, detail))
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    })

    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }

  async delete(endpoint: string): Promise<void> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      let detail: string | undefined

      try {
        const error: ApiErrorResponse = await response.json()
        detail = error.detail
      } catch {
        // JSON parsing failed
      }

      throw new Error(getErrorMessage(response.status, detail))
    }
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }
}

export const api = new ApiClient()
