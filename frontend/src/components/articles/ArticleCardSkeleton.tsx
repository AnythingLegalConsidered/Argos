/**
 * Skeleton loader for article cards.
 * Displays animated placeholder while loading.
 */

export function ArticleCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-24 bg-muted rounded-full" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>

      {/* Title */}
      <div className="h-6 w-3/4 bg-muted rounded mb-2" />
      <div className="h-6 w-1/2 bg-muted rounded mb-3" />

      {/* Excerpt */}
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-2">
        <div className="h-5 w-12 bg-muted rounded-full" />
        <div className="h-5 w-12 bg-muted rounded-full" />
      </div>
    </div>
  )
}
