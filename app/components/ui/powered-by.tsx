"use client";

const tools = [
  { name: "Whisper", category: "Transcription" },
  { name: "Deepgram", category: "Speech-to-text" },
  { name: "Claude", category: "Edit planning" },
  { name: "Remotion", category: "Rendering" },
  { name: "Pexels", category: "B-roll" },
  { name: "FFmpeg", category: "Media" },
  { name: "Next.js", category: "Framework" },
  { name: "AWS S3", category: "Storage" },
  { name: "Stripe", category: "Billing" },
  { name: "Postgres", category: "Database" },
  { name: "Redis", category: "Queue" },
  { name: "Vercel", category: "Deployment" },
];

function Card({ name, category }: { name: string; category: string }) {
  return (
    <div className="group shrink-0 border border-neutral-200 px-8 py-6 transition-all duration-300 hover:border-neutral-400 hover:bg-neutral-50">
      <div className="text-lg font-medium transition-transform group-hover:translate-x-1">{name}</div>
      <div className="text-sm text-neutral-500">{category}</div>
    </div>
  );
}

export function PoweredBy() {
  return (
    <section id="powered-by" className="relative overflow-hidden bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center lg:mb-20">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">[Powered by]</span>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight lg:text-6xl">
            Built on the best
            <br />
            of AI.
          </h2>
          <p className="mt-6 text-xl text-neutral-500">
            Transcription, edit planning, and rendering — orchestrated into a single click.
          </p>
        </div>
      </div>

      <div className="mb-6 w-full">
        <div className="marquee flex w-max gap-6">
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className="flex shrink-0 gap-6">
              {tools.map((t) => (
                <Card key={`${t.name}-${setIndex}`} name={t.name} category={t.category} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full">
        <div className="marquee-reverse flex w-max gap-6">
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className="flex shrink-0 gap-6">
              {[...tools].reverse().map((t) => (
                <Card key={`${t.name}-r-${setIndex}`} name={t.name} category={t.category} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
