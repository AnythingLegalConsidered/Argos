-- ============================================
-- Argos - Story 2.1: Schema DB Sources & Articles
-- Migration: 001_create_sources_articles
-- Date: 2026-01-15
-- ============================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: sources
-- Stores user's veille sources (RSS feeds, Reddit subreddits)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('rss', 'reddit')),
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_fetched_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,

    -- Prevent duplicate sources per user
    UNIQUE(user_id, url)
);

-- Index for user filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS sources_user_id_idx ON public.sources(user_id);
CREATE INDEX IF NOT EXISTS sources_type_idx ON public.sources(type);
CREATE INDEX IF NOT EXISTS sources_is_active_idx ON public.sources(is_active);

-- ============================================
-- TABLE: articles
-- Stores captured articles from sources
-- ============================================
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    author TEXT,
    published_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    -- Full-text search vector (French + English weighted)
    -- Title has weight A (highest), content has weight B
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('french', coalesce(content, '')), 'B')
    ) STORED,

    -- Prevent duplicate articles (same URL for same user)
    UNIQUE(user_id, url)
);

-- GIN index for full-text search (critical for performance)
CREATE INDEX IF NOT EXISTS articles_search_idx ON public.articles USING GIN (search_vector);

-- Standard indexes for common query patterns
CREATE INDEX IF NOT EXISTS articles_user_id_idx ON public.articles(user_id);
CREATE INDEX IF NOT EXISTS articles_source_id_idx ON public.articles(source_id);
CREATE INDEX IF NOT EXISTS articles_captured_at_idx ON public.articles(captured_at DESC);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles(published_at DESC);

-- GIN index for tags array queries
CREATE INDEX IF NOT EXISTS articles_tags_idx ON public.articles USING GIN (tags);

-- ============================================
-- TABLE: user_preferences
-- Stores user settings and preferences
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_categories TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{
        "fetch_interval_minutes": 60,
        "articles_per_page": 20,
        "theme": "light"
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation: users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- SOURCES policies
CREATE POLICY "Users can view their own sources"
    ON public.sources FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sources"
    ON public.sources FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources"
    ON public.sources FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sources"
    ON public.sources FOR DELETE
    USING (auth.uid() = user_id);

-- ARTICLES policies
CREATE POLICY "Users can view their own articles"
    ON public.articles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles"
    ON public.articles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
    ON public.articles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
    ON public.articles FOR DELETE
    USING (auth.uid() = user_id);

-- USER_PREFERENCES policies
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTION: Full-text search
-- ============================================
CREATE OR REPLACE FUNCTION search_articles(
    search_query TEXT,
    p_user_id UUID,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    url TEXT,
    author TEXT,
    published_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ,
    source_id UUID,
    tags TEXT[],
    rank REAL,
    headline TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.content,
        a.url,
        a.author,
        a.published_at,
        a.captured_at,
        a.source_id,
        a.tags,
        ts_rank(a.search_vector, websearch_to_tsquery('french', search_query)) AS rank,
        ts_headline('french', a.title || ' ' || coalesce(a.content, ''),
                    websearch_to_tsquery('french', search_query),
                    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25') AS headline
    FROM public.articles a
    WHERE a.user_id = p_user_id
      AND a.search_vector @@ websearch_to_tsquery('french', search_query)
    ORDER BY rank DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS for documentation
-- ============================================
COMMENT ON TABLE public.sources IS 'User veille sources (RSS feeds, Reddit subreddits)';
COMMENT ON TABLE public.articles IS 'Captured articles from sources with full-text search';
COMMENT ON TABLE public.user_preferences IS 'User settings and preferences';
COMMENT ON FUNCTION search_articles IS 'Full-text search with ranking and highlighting';
