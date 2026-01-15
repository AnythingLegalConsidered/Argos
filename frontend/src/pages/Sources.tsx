/**
 * Sources management page.
 * Displays user sources grouped by category with add/delete functionality.
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Rss } from 'lucide-react'
import { toast } from 'sonner'
import { SourceCard, AddSourceForm, SuggestedSources } from '../components/sources'
import { sourcesApi } from '../services/sources'
import type { Source, SourceCreate } from '../types/source'

export function Sources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchSources = useCallback(async () => {
    try {
      setError(null)
      const data = await sourcesApi.list()
      setSources(data.sources)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les sources'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const handleAddSource = async (sourceData: SourceCreate) => {
    try {
      const newSource = await sourcesApi.create(sourceData)
      setSources((prev) => [newSource, ...prev])
      toast.success(`Source "${newSource.name}" ajoutée`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter la source"
      toast.error(message)
      throw err
    }
  }

  const handleDeleteSource = async (id: string) => {
    const source = sources.find((s) => s.id === id)
    try {
      await sourcesApi.delete(id)
      setSources((prev) => prev.filter((s) => s.id !== id))
      toast.success(`Source "${source?.name}" supprimée`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de supprimer la source'
      toast.error(message)
    }
  }

  const handleToggleSource = async (id: string) => {
    const source = sources.find((s) => s.id === id)
    try {
      const updated = await sourcesApi.toggle(id)
      setSources((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      )
      toast.success(`Source "${source?.name}" ${updated.is_active ? 'activée' : 'désactivée'}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de modifier la source'
      toast.error(message)
    }
  }

  // Group sources by category
  const groupedSources = sources.reduce<Record<string, Source[]>>(
    (acc, source) => {
      const category = source.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(source)
      return acc
    },
    {}
  )

  // Sort categories alphabetically, but put Uncategorized at the end
  const sortedCategories = Object.keys(groupedSources).sort((a, b) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-charcoal/60 hover:text-charcoal">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-serif text-2xl text-charcoal">Sources</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-terracotta text-white font-medium
              hover:bg-terracotta-dark transition-colors
            "
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-tablet text-red-700">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
          </div>
        )}

        {/* Suggested sources - show when user has few sources */}
        {!loading && sources.length < 5 && (
          <SuggestedSources onSourcesAdded={fetchSources} />
        )}

        {/* Empty state */}
        {!loading && sources.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-terracotta/10 rounded-full flex items-center justify-center">
              <Rss className="w-8 h-8 text-terracotta" />
            </div>
            <h2 className="font-serif text-xl text-charcoal mb-2">Aucune source</h2>
            <p className="text-charcoal/60 mb-6">
              Sélectionnez des sources suggérées ci-dessus ou ajoutez vos propres sources.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="
                inline-flex items-center gap-2 px-6 py-3 rounded-lg
                bg-terracotta text-white font-medium
                hover:bg-terracotta-dark transition-colors
              "
            >
              <Plus className="w-5 h-5" />
              Ajouter manuellement
            </button>
          </div>
        )}

        {/* Sources grouped by category */}
        {!loading && sources.length > 0 && (
          <div className="space-y-8">
            {sortedCategories.map((category) => (
              <section key={category}>
                <h2 className="font-serif text-lg text-charcoal mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-olive"></span>
                  {category}
                  <span className="text-sm font-sans text-charcoal/40">
                    ({groupedSources[category].length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {groupedSources[category].map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onDelete={handleDeleteSource}
                      onToggle={handleToggleSource}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Stats footer */}
        {!loading && sources.length > 0 && (
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-charcoal/50">
            {sources.length} source{sources.length !== 1 ? 's' : ''} configurée{sources.length !== 1 ? 's' : ''}
            {' • '}
            {sources.filter((s) => s.is_active).length} active{sources.filter((s) => s.is_active).length !== 1 ? 's' : ''}
          </div>
        )}
      </main>

      {/* Add source modal */}
      {showAddForm && (
        <AddSourceForm
          onSubmit={handleAddSource}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
