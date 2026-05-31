/**
 * demo1: caption a video end-to-end with ZapCap — no DB, auth, or credits.
 *
 * Setup:
 *   1. Sign up free at https://zapcap.ai (3 free minutes, no card) and copy your API key.
 *   2. export ZAPCAP_API_KEY=...     (or add it to .env.local)
 *   3. Optionally: export ZAPCAP_TEMPLATE_ID=...  (else the first template is used)
 *
 * Run:
 *   npx tsx scripts/demo-caption.ts <video-url>
 *   # or with no arg to use the sample clip below
 */

import { captionVideo, listTemplates } from "@/services/captioning";

// Any publicly-fetchable MP4 works. For a meaningful caption demo, pass a
// talking-head / spoken-audio clip as the CLI arg — this sample has no speech,
// so it only verifies the upload→render pipeline end to end.
const SAMPLE_VIDEO = "https://download.samplelib.com/mp4/sample-5s.mp4";

async function main() {
  if (!process.env.ZAPCAP_API_KEY) {
    console.error("ZAPCAP_API_KEY is not set. Get a free key at https://zapcap.ai");
    process.exit(1);
  }

  const videoUrl = process.argv[2] ?? SAMPLE_VIDEO;

  console.log("Available caption templates:");
  try {
    const templates = await listTemplates();
    for (const t of templates.slice(0, 10)) {
      console.log(`  ${t.id}  ${t.name ?? ""}`);
    }
  } catch (e) {
    console.warn("  (could not list templates)", e instanceof Error ? e.message : e);
  }

  console.log(`\nCaptioning: ${videoUrl}`);
  console.log("This uploads, transcribes, and renders — usually 1-3 min for a short clip...\n");

  const result = await captionVideo({ videoUrl });

  if (result.success) {
    console.log("✅ Done!");
    console.log("  Captioned video:", result.videoUrl);
    if (result.transcriptUrl) console.log("  Transcript:", result.transcriptUrl);
  } else {
    console.error("❌ Failed:", result.error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
