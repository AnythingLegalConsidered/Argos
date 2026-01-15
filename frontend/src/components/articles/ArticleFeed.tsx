/**
 * Article feed component.
 * Displays a list of articles with pagination and loading states.
 */

import { ArticleCard } from './ArticleCard'
import { ArticleCardSkeleton } from './ArticleCardSkeleton'
import type { ArticleListItem } from '../../types/article'

interface ArticleFeedProps {
  articles: ArticleListItem[]
  loading: boolean
  error: string | null
  hasMore: boolean
  onLoadMore: () => void
}

export function ArticleFeed({
  articles,
  loading,
  error,
  hasMore,
  onLoadMore,
}: ArticleFeedProps) {
  // Initial loading state
  if (loading && articles.length === 0) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Error state
  if (error && articles.length === 0) {
    return (
      <div className="card p-8 text-center">
        <svg
          className="w-12 h-12 text-terracotta/40 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="font-display text-lg text-charcoal mb-2">
          Erreur de chargement
        </h3>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    )
  }

  // Empty state
  if (!loading && articles.length === 0) {
    return (
      <div className="card p-12 text-center">
        <svg
          className="w-16 h-16 text-bronze/30 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <h3 className="font-display text-xl text-charcoal mb-2">
          Aucun article
        </h3>
        <p className="text-muted-foreground mb-6">
          Votre feed est vide. Ajoutez des sources pour commencer votre veille.
        </p>
        <a
          href="/sources"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter des sources
        </a>
      </div>
    )
  }

  return (
    <div>
      {/* Article list */}
      <div className="grid gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="btn btn-ghost px-6 py-3 text-bronze hover:text-terracotta disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Chargement...
              </span>
            ) : (
              'Charger plus'
            )}
          </button>
        </div>
      )}

      {/* Error during load more */}
      {error && articles.length > 0 && (
        <div className="mt-4 p-3 bg-terracotta/10 text-terracotta text-sm rounded-lg text-center">
          {error}
        </div>
      )}
    </div>
  )
}
