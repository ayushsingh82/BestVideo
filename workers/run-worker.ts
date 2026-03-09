/**
 * Run the video generation worker (Redis/BullMQ).
 * Usage: npm run worker  OR  npx tsx workers/run-worker.ts
 * Requires REDIS_URL or REDIS_HOST to be set.
 */

import { runWorker } from "./queue-redis";

console.log("Starting background workers...");
const { videoWorker, imageWorker } = runWorker();
console.log("Workers are running. Press Ctrl+C to stop.");

process.on("SIGTERM", async () => {
  await videoWorker.close();
  await imageWorker.close();
  process.exit(0);
});
