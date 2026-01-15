/**
 * Article detail page.
 * Displays the full content of an article.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Navbar } from '../components/layout/Navbar'
import { api } from '../services/api'
import type { ArticleDetail } from '../types/article'

export function ArticlePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) {
        setError('ID article manquant')
        setLoading(false)
        return
      }

      try {
        const data = await api.get<ArticleDetail>(`/api/articles/${id}`)
        setArticle(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger l\'article')
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [id])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Reddit-specific metadata
  const redditMeta = article?.source_type === 'reddit' && article.metadata
    ? {
        score: article.metadata.score as number | undefined,
        numComments: article.metadata.num_comments as number | undefined,
        subreddit: article.metadata.subreddit as string | undefined,
        permalink: article.metadata.permalink as string | undefined,
      }
    : null

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="page-container">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="h-4 w-24 bg-muted rounded mb-6" />
            <div className="h-10 w-3/4 bg-muted rounded mb-4" />
            <div className="h-10 w-1/2 bg-muted rounded mb-8" />
            <div className="flex gap-4 mb-8">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-6 w-32 bg-muted rounded" />
            </div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 w-full bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="page-container">
          <div className="max-w-3xl mx-auto text-center py-12">
            <svg
              className="w-16 h-16 text-terracotta/40 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="font-display text-2xl text-charcoal mb-2">
              {error || 'Article non trouvé'}
            </h2>
            <p className="text-muted-foreground mb-6">
              Cet article n'existe pas ou vous n'avez pas la permission de le voir.
            </p>
            <Link to="/" className="btn btn-primary">
              Retour au feed
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="page-container">
        <article className="max-w-3xl mx-auto">
          {/* Back navigation */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-terracotta transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>

          {/* Article header */}
          <header className="mb-8">
            {/* Source badge */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  ${article.source_type === 'reddit'
                    ? 'bg-orange-50 text-orange-600'
                    : 'bg-terracotta/10 text-terracotta'
                  }
                `}
              >
                {article.source_type === 'reddit' ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                )}
                {article.source_name || 'Unknown'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl leading-tight mb-4">
              {article.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {article.author && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {article.author}
                </span>
              )}
              {(article.published_at || article.captured_at) && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(article.published_at || article.captured_at)}
                </span>
              )}
            </div>

            {/* Reddit metadata */}
            {redditMeta && (
              <div className="flex items-center gap-4 mt-4 text-sm">
                {redditMeta.subreddit && (
                  <span className="badge badge-secondary">
                    r/{redditMeta.subreddit}
                  </span>
                )}
                {redditMeta.score !== undefined && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {redditMeta.score} points
                  </span>
                )}
                {redditMeta.numComments !== undefined && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {redditMeta.numComments} commentaires
                  </span>
                )}
              </div>
            )}

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags.map((tag) => (
                  <span key={tag} className="badge">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Article content - sanitized to prevent XSS */}
          <div className="prose-article">
            {article.content ? (
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(article.content, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre'],
                    ALLOWED_ATTR: ['href', 'target', 'rel'],
                  })
                }}
              />
            ) : (
              <p className="text-muted-foreground italic">
                Aucun contenu disponible pour cet article.
              </p>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="btn btn-ghost text-muted-foreground"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour au feed
              </button>

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Voir l'original
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </footer>
        </article>
      </main>
    </div>
  )
}
