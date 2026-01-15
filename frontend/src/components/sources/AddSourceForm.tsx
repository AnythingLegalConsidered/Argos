/**
 * Add source form component.
 * Modal form for creating new RSS or Reddit sources.
 */

import { useState } from 'react'
import type { SourceCreate, SourceType } from '../../types/source'
import { SOURCE_CATEGORIES } from '../../types/source'

interface AddSourceFormProps {
  onSubmit: (source: SourceCreate) => Promise<void>
  onClose: () => void
}

export function AddSourceForm({ onSubmit, onClose }: AddSourceFormProps) {
  const [type, setType] = useState<SourceType>('rss')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await onSubmit({
        type,
        url: url.trim(),
        name: name.trim(),
        category: category || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add source')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center p-4 z-50">
      <div className="bg-sand rounded-tablet shadow-xl max-w-md w-full p-6">
        <h2 className="font-serif text-2xl text-charcoal mb-6">Add Source</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('rss')}
                className={`
                  flex-1 py-2 px-4 rounded-lg border-2 transition-colors
                  ${type === 'rss'
                    ? 'border-terracotta bg-terracotta/10 text-terracotta-dark'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                RSS Feed
              </button>
              <button
                type="button"
                onClick={() => setType('reddit')}
                className={`
                  flex-1 py-2 px-4 rounded-lg border-2 transition-colors
                  ${type === 'reddit'
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                Reddit
              </button>
            </div>
          </div>

          {/* URL input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-charcoal mb-2">
              {type === 'rss' ? 'Feed URL' : 'Subreddit'}
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={type === 'rss' ? 'https://example.com/feed.xml' : 'r/programming'}
              required
              className="
                w-full px-4 py-2 rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta
                bg-white
              "
            />
            {type === 'reddit' && (
              <p className="text-xs text-charcoal/50 mt-1">
                Enter subreddit name (e.g., programming, devops, selfhosted)
              </p>
            )}
          </div>

          {/* Name input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Source Name"
              required
              className="
                w-full px-4 py-2 rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta
                bg-white
              "
            />
          </div>

          {/* Category selector */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-charcoal mb-2">
              Category (optional)
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="
                w-full px-4 py-2 rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta
                bg-white
              "
            >
              <option value="">No category</option>
              {SOURCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 py-2 px-4 rounded-lg
                border border-gray-200 text-charcoal
                hover:bg-gray-50 transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="
                flex-1 py-2 px-4 rounded-lg
                bg-terracotta text-white font-medium
                hover:bg-terracotta-dark transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? 'Adding...' : 'Add Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
