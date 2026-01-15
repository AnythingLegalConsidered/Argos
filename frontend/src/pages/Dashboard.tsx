/**
 * Dashboard page - main authenticated view.
 * Displays the article feed with filtering options.
 * Design: Argos "Ancient Greece meets Modern Tech"
 */

import { Navbar } from '../components/layout/Navbar'
import { ArticleFeed } from '../components/articles/ArticleFeed'
import { useArticles } from '../hooks/useArticles'

export function Dashboard() {
  // TODO: Add filter UI when needed (source, category, date range)
  const { articles, loading, error, hasMore, totalCount, loadMore, refresh } = useArticles()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-charcoal mb-1">Votre Feed</h1>
            {totalCount > 0 && (
              <p className="text-muted-foreground text-sm">
                {totalCount} article{totalCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="btn btn-ghost text-muted-foreground hover:text-terracotta"
            title="Rafraichir"
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Article Feed */}
        <ArticleFeed
          articles={articles}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </main>
    </div>
  )
}
