/**
 * Skeleton loader for search results.
 * Displays animated placeholder while loading.
 */

export function SearchResultSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-28 bg-muted rounded-full" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>

      {/* Title */}
      <div className="h-6 w-4/5 bg-muted rounded mb-2" />
      <div className="h-6 w-2/3 bg-muted rounded mb-4" />

      {/* Excerpt/snippet with highlight placeholder */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mt-4 pt-2">
        <div className="h-5 w-14 bg-muted rounded-full" />
        <div className="h-5 w-16 bg-muted rounded-full" />
      </div>
    </div>
  )
}
