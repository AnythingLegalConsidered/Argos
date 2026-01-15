#!/usr/bin/env python3
"""
Seed initial RSS sources into Supabase.
Run after creating the sources table.
"""

import os
from supabase import create_client

SOURCES = [
    # Tech
    {"name": "Hacker News", "url": "https://news.ycombinator.com", "rss_url": "https://news.ycombinator.com/rss", "category": "tech"},
    {"name": "The Verge", "url": "https://www.theverge.com", "rss_url": "https://www.theverge.com/rss/index.xml", "category": "tech"},
    {"name": "Ars Technica", "url": "https://arstechnica.com", "rss_url": "https://feeds.arstechnica.com/arstechnica/index", "category": "tech"},
    {"name": "TechCrunch", "url": "https://techcrunch.com", "rss_url": "https://techcrunch.com/feed/", "category": "tech"},
    {"name": "Wired", "url": "https://www.wired.com", "rss_url": "https://www.wired.com/feed/rss", "category": "tech"},
    {"name": "MIT Tech Review", "url": "https://www.technologyreview.com", "rss_url": "https://www.technologyreview.com/feed/", "category": "tech"},

    # Science
    {"name": "Nature News", "url": "https://www.nature.com", "rss_url": "https://www.nature.com/nature.rss", "category": "science"},
    {"name": "Science Daily", "url": "https://www.sciencedaily.com", "rss_url": "https://www.sciencedaily.com/rss/all.xml", "category": "science"},
    {"name": "Phys.org", "url": "https://phys.org", "rss_url": "https://phys.org/rss-feed/", "category": "science"},
    {"name": "Quanta Magazine", "url": "https://www.quantamagazine.org", "rss_url": "https://api.quantamagazine.org/feed/", "category": "science"},
    {"name": "New Scientist", "url": "https://www.newscientist.com", "rss_url": "https://www.newscientist.com/feed/home/", "category": "science"},

    # Health
    {"name": "STAT News", "url": "https://www.statnews.com", "rss_url": "https://www.statnews.com/feed/", "category": "health"},
    {"name": "BBC Health", "url": "https://www.bbc.com/news/health", "rss_url": "https://feeds.bbci.co.uk/news/health/rss.xml", "category": "health"},
    {"name": "Medical News Today", "url": "https://www.medicalnewstoday.com", "rss_url": "https://www.medicalnewstoday.com/rss", "category": "health"},
    {"name": "NIH News", "url": "https://www.nih.gov", "rss_url": "https://www.nih.gov/news-events/news-releases/feed", "category": "health"},
    {"name": "WebMD", "url": "https://www.webmd.com", "rss_url": "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC", "category": "health"},

    # Business
    {"name": "Bloomberg", "url": "https://www.bloomberg.com", "rss_url": "https://feeds.bloomberg.com/markets/news.rss", "category": "business"},
    {"name": "The Economist", "url": "https://www.economist.com", "rss_url": "https://www.economist.com/rss", "category": "business"},
    {"name": "Harvard Business Review", "url": "https://hbr.org", "rss_url": "https://hbr.org/feed", "category": "business"},
    {"name": "Forbes", "url": "https://www.forbes.com", "rss_url": "https://www.forbes.com/real-time/feed2/", "category": "business"},
    {"name": "Financial Times", "url": "https://www.ft.com", "rss_url": "https://www.ft.com/rss/home", "category": "business"},

    # Politics
    {"name": "BBC News", "url": "https://www.bbc.com/news", "rss_url": "https://feeds.bbci.co.uk/news/rss.xml", "category": "politics"},
    {"name": "Le Monde", "url": "https://www.lemonde.fr", "rss_url": "https://www.lemonde.fr/rss/une.xml", "category": "politics"},
    {"name": "The Guardian", "url": "https://www.theguardian.com", "rss_url": "https://www.theguardian.com/world/rss", "category": "politics"},
    {"name": "Reuters", "url": "https://www.reuters.com", "rss_url": "https://www.reutersagency.com/feed/", "category": "politics"},
    {"name": "NPR", "url": "https://www.npr.org", "rss_url": "https://feeds.npr.org/1001/rss.xml", "category": "politics"},
]


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set")
        return

    supabase = create_client(url, key)

    for source in SOURCES:
        source["is_validated"] = True
        source["is_active"] = True

    result = supabase.table("sources").upsert(SOURCES, on_conflict="url").execute()

    print(f"Seeded {len(SOURCES)} sources successfully!")
    print(f"Result: {len(result.data)} rows affected")


if __name__ == "__main__":
    main()
