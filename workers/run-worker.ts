/**
 * Run the video generation worker (Redis/BullMQ).
 * Usage: npm run worker  OR  npx tsx workers/run-worker.ts
 * Requires REDIS_URL or REDIS_HOST to be set.
 */

import { runWorker } from "./queue-redis";

console.log("Starting video generation worker...");
const worker = runWorker();
console.log("Worker is running. Press Ctrl+C to stop.");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
