import { NextResponse } from "next/server";

/**
 * Build B-roll cues from a ZapCap transcript: pick keyword moments and find a
 * matching image for each via Openverse (keyless Creative-Commons image search).
 *
 * POST { transcriptUrl }  ->  { cues: [{ start, end, query, imageUrl, title }] }
 *
 * The frontend overlays each image on the top ~30% of the video while the
 * playhead is between `start` and `end`.
 */

export const runtime = "nodejs";

interface Word {
  start?: number;
  end?: number;
  start_time?: number;
  end_time?: number;
  text?: string;
  important?: boolean;
}

interface Cue {
  start: number;
  end: number;
  query: string;
  imageUrl: string;
  title?: string;
}

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "your", "with", "this", "that",
  "have", "has", "had", "was", "were", "they", "them", "from", "what", "when",
  "how", "why", "who", "will", "would", "can", "could", "should", "into", "out",
  "about", "just", "like", "get", "got", "its", "it's", "our", "their", "his",
  "her", "she", "him", "all", "any", "some", "one", "two", "now", "then", "than",
  "too", "very", "more", "most", "much", "many", "here", "there", "been", "being",
]);

function cleanWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9\s']/gi, "").trim();
}

/** Is this a usable image-search keyword (alphabetic, not a stopword/number)? */
function isKeyword(raw: string | undefined): raw is string {
  if (!raw) return false;
  const w = cleanWord(raw);
  if (w.length < 3) return false;
  if (/^\d+$/.test(w)) return false; // pure number / currency token
  if (STOPWORDS.has(w)) return false;
  return true;
}

function startOf(w: Word): number {
  return w.start ?? w.start_time ?? 0;
}
function endOf(w: Word): number {
  return w.end ?? w.end_time ?? startOf(w);
}

// How many photos to aim for across the clip, and how they're timed.
const TARGET_PHOTOS = 10;
const MIN_PHOTOS = 5;
// Space keywords ~2.5s apart so each photo gets a clean 2–3s slot (≈12 max in 30s).
const MIN_SPACING_S = 2.5;
// Each photo stays on screen this long (capped by the next photo / end of speech).
const PHOTO_DURATION_S = 3;

/**
 * Pick keyword moments spread across the clip: prefer ZapCap's `important`
 * words, then fall back to any keyword, aiming for ~TARGET_PHOTOS evenly.
 */
function pickKeywordWords(words: Word[]): Word[] {
  const important = words.filter((w) => w.important && isKeyword(w.text));
  const anyKeyword = words.filter((w) => isKeyword(w.text));
  // Start from important words; top up with other keywords if we have too few.
  let pool = important.length >= MIN_PHOTOS ? important : anyKeyword;
  if (pool.length === 0) return [];

  // Drop duplicate keywords up front so every photo is distinct.
  const seenWord = new Set<string>();
  pool = pool.filter((w) => {
    const k = cleanWord(w.text as string);
    if (seenWord.has(k)) return false;
    seenWord.add(k);
    return true;
  });

  // Evenly sample down to TARGET_PHOTOS while respecting a minimum spacing.
  const step = Math.max(1, Math.floor(pool.length / TARGET_PHOTOS));
  const sampled: Word[] = [];
  let lastStart = -Infinity;
  for (let i = 0; i < pool.length && sampled.length < TARGET_PHOTOS; i += step) {
    const w = pool[i];
    if (startOf(w) - lastStart >= MIN_SPACING_S) {
      sampled.push(w);
      lastStart = startOf(w);
    }
  }
  return sampled;
}

interface ImageHit {
  url: string;
  title?: string;
}

/** Pexels — high-quality stock photos. Requires PEXELS_API_KEY. */
async function searchPexels(query: string): Promise<ImageHit | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      photos?: { src?: { large?: string; medium?: string; landscape?: string }; alt?: string }[];
    };
    const p = data.photos?.[0];
    const url = p?.src?.large || p?.src?.landscape || p?.src?.medium;
    return url ? { url, title: p?.alt } : null;
  } catch {
    return null;
  }
}

/** Openverse — keyless Creative-Commons image search (fallback). */
async function searchOpenverse(query: string): Promise<ImageHit | null> {
  try {
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=3&mature=false`,
      { headers: { "User-Agent": "BestVideo/1.0 (b-roll demo)", Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { thumbnail?: string; url?: string; title?: string }[];
    };
    const hit = data.results?.find((r) => r.thumbnail || r.url);
    if (!hit) return null;
    return { url: (hit.thumbnail || hit.url) as string, title: hit.title };
  } catch {
    return null;
  }
}

/** Best available image for a query: Pexels first (quality), else Openverse. */
async function searchImage(query: string): Promise<ImageHit | null> {
  return (await searchPexels(query)) ?? (await searchOpenverse(query));
}

export async function POST(request: Request) {
  let body: { transcriptUrl?: string };
  try {
    body = (await request.json()) as { transcriptUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.transcriptUrl) {
    return NextResponse.json({ error: "transcriptUrl is required" }, { status: 400 });
  }

  // Fetch the transcript (ZapCap words.json).
  let words: Word[];
  try {
    const res = await fetch(body.transcriptUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch transcript (${res.status})` },
        { status: 502 }
      );
    }
    const json = await res.json();
    words = Array.isArray(json) ? (json as Word[]) : ((json.words ?? []) as Word[]);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (words.length === 0) {
    return NextResponse.json({ cues: [], note: "No speech detected in this video." });
  }

  const keywordWords = pickKeywordWords(words);
  const lastEnd = endOf(words[words.length - 1]);

  // Find an image for each keyword (in parallel), then build timed cues.
  const found = await Promise.all(
    keywordWords.map(async (w) => {
      const query = cleanWord(w.text as string);
      const img = await searchImage(query);
      return img ? { w, query, img } : null;
    })
  );

  const cues: Cue[] = [];
  const hits = found.filter(Boolean) as { w: Word; query: string; img: { url: string; title?: string } }[];
  for (let i = 0; i < hits.length; i++) {
    const start = startOf(hits[i].w);
    // Show each photo ~2–3s, but never past the next photo or the end of speech
    // (so nothing lingers over silence / when there's no text).
    const nextStart = hits[i + 1] ? startOf(hits[i + 1].w) : lastEnd;
    const end = Math.min(start + PHOTO_DURATION_S, nextStart, lastEnd);
    if (end - start < 0.8) continue; // drop slivers near the clip end
    cues.push({
      start,
      end,
      query: hits[i].query,
      imageUrl: hits[i].img.url,
      title: hits[i].img.title,
    });
  }

  return NextResponse.json({ cues });
}
