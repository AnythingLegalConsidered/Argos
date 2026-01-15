/**
 * Search result card with highlighted snippet.
 * Displays article info and headline with <mark> highlighting.
 */

import { Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import type { SearchResultItem } from '../../types/article'

interface SearchResultCardProps {
  result: SearchResultItem
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const formattedDate = result.captured_at
    ? new Date(result.captured_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <Link
      to={`/articles/${result.id}`}
      className="card block group hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-display text-lg font-semibold text-charcoal group-hover:text-terracotta transition-colors line-clamp-2">
          {result.title}
        </h3>
        {result.source_type && (
          <span className="badge badge-muted shrink-0">
            {result.source_type === 'reddit' ? 'Reddit' : 'RSS'}
          </span>
        )}
      </div>

      {/* Highlighted headline - sanitized, only allow <mark> for highlighting */}
      <div
        className="text-muted-foreground text-sm mb-3 line-clamp-3 search-headline"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(result.headline, {
            ALLOWED_TAGS: ['mark'],
            ALLOWED_ATTR: [],
          })
        }}
      />

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {result.source_name && (
          <>
            <span className="font-medium">{result.source_name}</span>
            <span className="text-border">•</span>
          </>
        )}
        {formattedDate && <span>{formattedDate}</span>}
        {result.author && (
          <>
            <span className="text-border">•</span>
            <span>{result.author}</span>
          </>
        )}
      </div>

      {/* Tags */}
      {result.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="badge badge-secondary">
              {tag}
            </span>
          ))}
          {result.tags.length > 3 && (
            <span className="badge badge-muted">+{result.tags.length - 3}</span>
          )}
        </div>
      )}
    </Link>
  )
}
