/**
 * Suggested sources component.
 * Displays curated quality sources that users can add with one click.
 */

import { useState, useEffect } from 'react'
import { Check, Plus, Sparkles, Rss } from 'lucide-react'
import { toast } from 'sonner'
import { sourcesApi } from '../../services/sources'
import type { SuggestedSource } from '../../types/source'

interface SuggestedSourcesProps {
  onSourcesAdded: () => void
}

export function SuggestedSources({ onSourcesAdded }: SuggestedSourcesProps) {
  const [suggestions, setSuggestions] = useState<SuggestedSource[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const data = await sourcesApi.getSuggested()
        setSuggestions(data.sources)
      } catch (err) {
        console.error('Failed to load suggestions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSuggestions()
  }, [])

  const toggleSelect = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        next.add(url)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(suggestions.map((s) => s.url)))
  }

  const handleAddSelected = async () => {
    if (selected.size === 0) return

    setAdding(true)
    try {
      const result = await sourcesApi.addSuggested(Array.from(selected))
      toast.success(`${result.total} source${result.total > 1 ? 's' : ''} ajoutée${result.total > 1 ? 's' : ''}`)
      setSelected(new Set())
      // Refresh suggestions list
      const data = await sourcesApi.getSuggested()
      setSuggestions(data.sources)
      onSourcesAdded()
    } catch (err) {
      toast.error("Impossible d'ajouter les sources")
    } finally {
      setAdding(false)
    }
  }

  // Don't show if no suggestions available
  if (!loading && suggestions.length === 0) {
    return null
  }

  // Group by category
  const byCategory = suggestions.reduce<Record<string, SuggestedSource[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="mb-8 p-6 bg-gradient-to-br from-terracotta/5 to-olive/5 border border-terracotta/20 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-terracotta" />
        <h2 className="font-serif text-lg text-charcoal">Sources suggérées</h2>
        <span className="text-sm text-charcoal/50">
          ({suggestions.length} disponible{suggestions.length > 1 ? 's' : ''})
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-terracotta" />
        </div>
      ) : (
        <>
          <p className="text-sm text-charcoal/60 mb-4">
            Sélectionnez des sources de qualité pour commencer votre veille.
          </p>

          {/* Categories */}
          <div className="space-y-4 mb-6">
            {Object.entries(byCategory).map(([category, sources]) => (
              <div key={category}>
                <h3 className="text-xs font-medium text-charcoal/50 uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <button
                      key={source.url}
                      onClick={() => toggleSelect(source.url)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                        border transition-all
                        ${
                          selected.has(source.url)
                            ? 'bg-terracotta text-white border-terracotta'
                            : 'bg-white text-charcoal border-gray-200 hover:border-terracotta/50'
                        }
                      `}
                    >
                      {selected.has(source.url) ? (
                        <Check className="w-4 h-4" />
                      ) : source.type === 'reddit' ? (
                        <span className="text-orange-500 font-bold text-xs">r/</span>
                      ) : (
                        <Rss className="w-4 h-4 text-terracotta" />
                      )}
                      {source.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddSelected}
              disabled={selected.size === 0 || adding}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                transition-colors
                ${
                  selected.size === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-terracotta text-white hover:bg-terracotta-dark'
                }
              `}
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Ajouter {selected.size > 0 ? `(${selected.size})` : ''}
                </>
              )}
            </button>

            {suggestions.length > 1 && selected.size < suggestions.length && (
              <button
                onClick={selectAll}
                className="text-sm text-terracotta hover:underline"
              >
                Tout sélectionner
              </button>
            )}

            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-charcoal/50 hover:text-charcoal"
              >
                Désélectionner
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
