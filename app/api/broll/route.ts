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

/** Pick keyword moments: prefer ZapCap's `important` words, else any keyword. */
function pickKeywordWords(words: Word[]): Word[] {
  const important = words.filter((w) => w.important && isKeyword(w.text));
  const pool = important.length > 0 ? important : words.filter((w) => isKeyword(w.text));

  // Thin out so photos don't change too fast: keep ~1 keyword per 2s.
  const chosen: Word[] = [];
  let lastStart = -Infinity;
  for (const w of pool) {
    if (startOf(w) - lastStart >= 2) {
      chosen.push(w);
      lastStart = startOf(w);
    }
  }
  return chosen.slice(0, 12); // cap requests to Openverse
}

/** Search Openverse for one image; returns a hotlinkable thumbnail URL. */
async function searchImage(query: string): Promise<{ url: string; title?: string } | null> {
  const endpoint = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
    query
  )}&page_size=3&mature=false`;
  try {
    const res = await fetch(endpoint, {
      headers: { "User-Agent": "BestVideo/1.0 (b-roll demo)", Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { thumbnail?: string; url?: string; title?: string }[];
    };
    const hit = data.results?.find((r) => r.thumbnail || r.url);
    if (!hit) return null;
    // Openverse's own thumbnail proxy is reliably hotlinkable.
    return { url: (hit.thumbnail || hit.url) as string, title: hit.title };
  } catch {
    return null;
  }
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
    // Show each photo until the next keyword's photo (or +3s / clip end).
    const next = hits[i + 1] ? startOf(hits[i + 1].w) : Math.min(start + 3, lastEnd);
    cues.push({
      start,
      end: Math.max(next, start + 1),
      query: hits[i].query,
      imageUrl: hits[i].img.url,
      title: hits[i].img.title,
    });
  }

  return NextResponse.json({ cues });
}
