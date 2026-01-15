/**
 * Formatting utilities for display values.
 */

/**
 * Format large numbers to compact form (1K, 2.5M, etc.)
 */
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 10000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`
  if (num < 1000000) return `${Math.round(num / 1000)}K`
  if (num < 10000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  return `${Math.round(num / 1000000)}M`
}

/**
 * Format relative date in French
 */
export function formatRelativeDate(dateStr: string | null): string | null {
  if (!dateStr) return null

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "À l'instant"
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}
