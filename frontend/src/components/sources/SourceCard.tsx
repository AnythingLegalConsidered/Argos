/**
 * Source card component.
 * Displays a single source with actions (toggle, delete).
 */

import { useState } from 'react'
import type { Source } from '../../types/source'

interface SourceCardProps {
  source: Source
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

export function SourceCard({ source, onDelete, onToggle }: SourceCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDelete = () => {
    if (showConfirm) {
      onDelete(source.id)
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
    }
  }

  return (
    <div
      className={`
        bg-white rounded-tablet p-4 shadow-tablet
        hover:shadow-tablet-hover transition-shadow
        border-l-4 ${source.is_active ? 'border-olive' : 'border-gray-300'}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Source info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                px-2 py-0.5 text-xs font-medium rounded-full
                ${source.type === 'rss'
                  ? 'bg-terracotta-light text-terracotta-dark'
                  : 'bg-orange-100 text-orange-700'
                }
              `}
            >
              {source.type.toUpperCase()}
            </span>
            {!source.is_active && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                Paused
              </span>
            )}
          </div>

          <h3 className="font-serif text-lg text-charcoal truncate">
            {source.name}
          </h3>

          <p className="text-sm text-charcoal/60 truncate mt-1">
            {source.url}
          </p>

          <p className="text-xs text-charcoal/40 mt-2">
            Last fetched: {formatDate(source.last_fetched_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(source.id)}
            className={`
              p-2 rounded-lg transition-colors
              ${source.is_active
                ? 'text-olive hover:bg-olive/10'
                : 'text-gray-400 hover:bg-gray-100'
              }
            `}
            title={source.is_active ? 'Pause source' : 'Activate source'}
          >
            {source.is_active ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={handleDelete}
            onBlur={() => setShowConfirm(false)}
            className={`
              p-2 rounded-lg transition-colors
              ${showConfirm
                ? 'bg-red-100 text-red-600'
                : 'text-charcoal/40 hover:text-red-500 hover:bg-red-50'
              }
            `}
            title={showConfirm ? 'Click again to confirm' : 'Delete source'}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Simple inline icons
function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
