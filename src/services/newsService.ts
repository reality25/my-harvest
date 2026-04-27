/**
 * News Service — verified agricultural news
 * ──────────────────────────────────────────────────────────────────
 * Calls the secure Supabase Edge Function `ai-gateway/news` which
 * aggregates RSS feeds from trusted sources (FAO, CGIAR, UN News,
 * Nation Seeds of Gold, The East African, Farmers Review Africa).
 *
 * Hierarchical resolution: county/location → country → east-africa →
 * global is performed inside the Edge Function. This client layer:
 *   • caches successful responses for 1 hour (fresh)
 *   • on network/Edge failure, serves the most recent cache (stale)
 *     so the UI never falls back to fabricated/empty data
 *   • exposes a `fetchedAt` timestamp so the UI can show freshness
 *
 * NO API keys are used or stored client-side. NO hardcoded articles.
 */

import { supabase } from "@/services/supabaseClient";

export interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  summary: string;
  scope: "kenya" | "east-africa" | "global";
}

export interface NewsQuery {
  location?: string;
  country?: string;
  query?: string;
  limit?: number;
}

export interface NewsResult {
  articles:  NewsArticle[];
  fetchedAt: number;
  source:    "fresh" | "stale" | "empty";
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour fresh window

// We keep one cache slot per query-key so different scopes don't overwrite
// each other; on stale-fallback we serve whatever key matches first.
const CACHE_PREFIX = "harvest_news_v2_";

interface CacheEntry {
  key: string;
  articles: NewsArticle[];
  fetchedAt: number;
  expiresAt: number;
}

function buildCacheKey(q: NewsQuery): string {
  return `${q.location ?? ""}|${q.country ?? ""}|${q.query ?? ""}|${q.limit ?? 10}`.toLowerCase();
}

function readCache(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function readAnyCache(): CacheEntry | null {
  try {
    let newest: CacheEntry | null = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(CACHE_PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const e = JSON.parse(raw) as CacheEntry;
        if (!newest || e.fetchedAt > newest.fetchedAt) newest = e;
      } catch { /* ignore */ }
    }
    return newest;
  } catch { return null; }
}

function writeCache(key: string, articles: NewsArticle[]): void {
  try {
    const now = Date.now();
    const entry: CacheEntry = { key, articles, fetchedAt: now, expiresAt: now + CACHE_TTL };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* quota — non-fatal */
  }
}

/**
 * Fetch verified agricultural news with freshness metadata.
 * Falls back to stale cache on failure rather than returning nothing.
 */
export async function fetchAgriNewsWithMeta(query: NewsQuery = {}): Promise<NewsResult> {
  const key    = buildCacheKey(query);
  const cached = readCache(key);

  // Fresh cache — return immediately
  if (cached && Date.now() <= cached.expiresAt) {
    return { articles: cached.articles, fetchedAt: cached.fetchedAt, source: "fresh" };
  }

  // Try the network
  try {
    const { data, error } = await supabase.functions.invoke("ai-gateway/news", {
      body: {
        location: query.location,
        country:  query.country ?? "Kenya",
        query:    query.query,
        limit:    query.limit ?? 10,
      },
    });

    if (!error && Array.isArray(data?.articles) && data.articles.length > 0) {
      const articles = data.articles as NewsArticle[];
      writeCache(key, articles);
      return { articles, fetchedAt: Date.now(), source: "fresh" };
    }
    if (error) {
      console.warn("[newsService] gateway error:", error.message);
    } else if (data?.error) {
      console.warn("[newsService] no articles:", data.error);
    }
  } catch (err) {
    console.warn("[newsService] fetch failed:", (err as Error).message);
  }

  // Network failed — serve stale (this query first, then any cached query)
  const staleSelf = cached;
  if (staleSelf?.articles.length) {
    return { articles: staleSelf.articles, fetchedAt: staleSelf.fetchedAt, source: "stale" };
  }
  const staleAny = readAnyCache();
  if (staleAny?.articles.length) {
    return { articles: staleAny.articles, fetchedAt: staleAny.fetchedAt, source: "stale" };
  }

  return { articles: [], fetchedAt: 0, source: "empty" };
}

/**
 * Backwards-compatible articles-only fetch used by aiService.
 * Returns [] only when neither network nor any cache is available.
 */
export async function fetchAgriNews(query: NewsQuery = {}): Promise<NewsArticle[]> {
  const r = await fetchAgriNewsWithMeta(query);
  return r.articles;
}

/** Format top headlines as a concise prompt-ready string for AI context. */
export function newsToPromptString(articles: NewsArticle[], max = 3): string {
  if (!articles.length) return "";
  const lines = articles.slice(0, max).map((a) =>
    `- ${a.title} (${a.source})`
  );
  return `Recent agricultural headlines:\n${lines.join("\n")}`;
}

/** Clear cached news (useful after location change). */
export function clearNewsCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* noop */ }
}
