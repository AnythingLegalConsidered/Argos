/**
 * Search page with full-text search capabilities.
 * Displays search results with highlighted snippets.
 */

import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Search } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { SearchResultCard } from '../components/search/SearchResultCard'
import { SearchResultSkeleton } from '../components/search/SearchResultSkeleton'
import { useSearch } from '../hooks/useSearch'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const { results, loading, error, hasMore, totalCount, query, setQuery, loadMore } = useSearch()

  // Initialize with URL query param
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery)
    }
  }, [initialQuery, query, setQuery])

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query })
    } else {
      setSearchParams({})
    }
  }, [query, setSearchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  return (
    <div className="min-h-screen bg-sand">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-charcoal mb-4">
            Recherche
          </h1>

          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Rechercher dans vos articles..."
              className="w-full pl-12 pr-4 py-3 bg-marble border border-border rounded-lg focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors text-charcoal placeholder:text-muted-foreground"
              autoFocus
            />
            {loading && query.trim() && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="w-5 h-5 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="card bg-red-50 border-red-200 text-red-700 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && query.trim() && results.length === 0 && (
          <div className="space-y-4">
            <SearchResultSkeleton />
            <SearchResultSkeleton />
            <SearchResultSkeleton />
          </div>
        )}

        {/* No results */}
        {query.trim() && !loading && results.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-charcoal mb-2">
              Aucun résultat
            </h3>
            <p className="text-muted-foreground">
              Aucun article ne correspond à "{query}". Essayez d'autres termes.
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {totalCount} résultat{totalCount > 1 ? 's' : ''} pour "{query}"
              {results.length < totalCount && ` (${results.length} affichés)`}
            </p>

            <div className="space-y-4">
              {results.map((result) => (
                <SearchResultCard key={result.id} result={result} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Chargement...' : 'Charger plus'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Initial state */}
        {!query.trim() && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-terracotta/10 flex items-center justify-center">
              <Search className="w-8 h-8 text-terracotta" />
            </div>
            <h3 className="font-display text-lg font-semibold text-charcoal mb-2">
              Recherchez dans vos articles
            </h3>
            <p className="text-muted-foreground">
              Tapez un mot-clé pour trouver des articles correspondants.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
