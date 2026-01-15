/**
 * Article card component.
 * Displays an article summary in the feed.
 */

import { Link } from 'react-router-dom'
import { ChevronUp, MessageCircle } from 'lucide-react'
import { SourceIcon } from '../icons'
import { formatNumber, formatRelativeDate } from '../../utils/format'
import type { ArticleListItem } from '../../types/article'

interface ArticleCardProps {
  article: ArticleListItem
}

export function ArticleCard({ article }: ArticleCardProps) {
  // Reddit-specific metadata
  const redditMeta = article.source_type === 'reddit' && article.metadata
    ? {
        score: article.metadata.score as number | undefined,
        numComments: article.metadata.num_comments as number | undefined,
        subreddit: article.metadata.subreddit as string | undefined,
      }
    : null

  return (
    <Link
      to={`/articles/${article.id}`}
      className="card block p-5 hover:shadow-card-hover group"
    >
      {/* Source and date */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              ${article.source_type === 'reddit'
                ? 'bg-orange-50 text-orange-600'
                : 'bg-terracotta/10 text-terracotta'
              }
            `}
          >
            <SourceIcon type={article.source_type || 'rss'} className="w-4 h-4" />
            {article.source_name || 'Unknown'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(article.published_at || article.captured_at)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-lg text-charcoal mb-2 group-hover:text-terracotta transition-colors line-clamp-2">
        {article.title}
      </h3>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
          {article.excerpt}
        </p>
      )}

      {/* Footer: tags + reddit meta */}
      <div className="flex items-center justify-between mt-auto pt-2">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {article.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="badge text-xs">
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="badge text-xs">+{article.tags.length - 3}</span>
          )}
        </div>

        {/* Reddit metadata with formatted numbers */}
        {redditMeta && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {redditMeta.score !== undefined && (
              <span className="flex items-center gap-1">
                <ChevronUp className="w-3.5 h-3.5" />
                {formatNumber(redditMeta.score)}
              </span>
            )}
            {redditMeta.numComments !== undefined && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {formatNumber(redditMeta.numComments)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
