import Link from "next/link";
import { Navbar } from "./components/Navbar";
import { Reveal } from "./components/ui/reveal";
import { AnimatedWave } from "./components/ui/animated-wave";
import { MetricsSection } from "./components/ui/metrics-section";
import { PoweredBy } from "./components/ui/powered-by";

const steps = [
  {
    kicker: "First",
    title: "Upload raw footage",
    body: "Drop in a video of yourself talking. No setup, no timeline, no editor to learn.",
  },
  {
    kicker: "Then",
    title: "AI does the edit",
    body: "We transcribe, cut the silences, burn in captions, and place B-roll above your face automatically.",
  },
  {
    kicker: "Finally",
    title: "Download & ship",
    body: "Review the result, tweak if you want, and export a post-ready video in minutes.",
  },
];

const features = [
  {
    title: "Word-perfect captions",
    body: "Styled, animated subtitles burned in and timed to every word you say.",
  },
  {
    title: "Face-aware B-roll",
    body: "Relevant images and clips placed above and beside your face — never covering it.",
  },
  {
    title: "Silence & filler cuts",
    body: "Dead air, ums and stumbles removed so every second earns its place.",
  },
  {
    title: "Music & motion",
    body: "Background tracks and motion graphics that match the energy of your script. (Soon)",
  },
];

const useCases = [
  {
    title: "Creators",
    body: "Turn one take into scroll-stopping shorts. Captions and B-roll without the all-nighter.",
  },
  {
    title: "Founders",
    body: "Record a thought, post a polished clip. Build in public without a video team.",
  },
  {
    title: "Educators",
    body: "Make lessons clear and watchable — visuals appear exactly when you explain them.",
  },
];

const plans = [
  {
    name: "Starter",
    description: "For trying it out",
    price: "Free",
    per: "",
    cta: "Get started",
    popular: false,
    features: ["5 minutes of video / month", "Auto captions", "Silence & filler cuts", "720p export"],
  },
  {
    name: "Pro",
    description: "For regular creators",
    price: "$19",
    per: "/mo",
    cta: "Start free trial",
    popular: true,
    features: [
      "60 minutes of video / month",
      "Face-aware B-roll",
      "1080p export & re-edit",
      "Priority rendering",
    ],
  },
  {
    name: "Team",
    description: "For teams & brands",
    price: "$49",
    per: "/mo",
    cta: "Contact sales",
    popular: false,
    features: ["Everything in Pro", "Brand kits & presets", "Shared workspaces", "API access"],
  },
];

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-4 w-4 transition-transform group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans antialiased">
      <Navbar />

      {/* Hero — white */}
      <section className="relative overflow-hidden bg-white px-4 pt-44 pb-28 text-center text-neutral-950 sm:px-6 sm:pt-56 sm:pb-40">
        {/* Animated wave background — matches the footer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <AnimatedWave />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,rgba(0,0,0,0.05),transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-neutral-500">
              AI video editor
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-9 text-balance text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">
              Raw footage in,
              <br />
              <span className="font-serif font-normal italic">finished</span> video out.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-neutral-500 sm:text-xl">
              Upload yourself talking. BestVideo adds captions, B-roll, and clean cuts
              automatically — no timeline, no editing. Just upload and ship.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/create-video"
                className="min-h-[48px] w-full rounded-full bg-neutral-950 px-8 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 sm:w-auto"
              >
                Upload your first video
              </Link>
              <a
                href="#how"
                className="min-h-[48px] w-full rounded-full border border-neutral-300 px-8 py-4 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100 sm:w-auto"
              >
                See how it works
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works — white, square boxes, word headers */}
      <section id="how" className="bg-white px-4 pb-28 text-neutral-950 sm:px-6 sm:pb-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">How it works</p>
              <h2 className="mt-5 text-balance text-5xl font-semibold leading-[1.0] tracking-tight sm:text-6xl">
                Three steps, <span className="font-serif font-normal italic">zero</span> editing.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-16 grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.title} className="bg-white p-10 sm:p-12">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                    {step.kicker}
                  </p>
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-neutral-500">{step.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features — the single black section, square boxes */}
      <section id="features" className="bg-neutral-950 px-4 py-28 text-white sm:px-6 sm:py-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">Features</p>
              <h2 className="mt-5 text-balance text-5xl font-semibold leading-[1.0] tracking-tight sm:text-6xl">
                Everything an editor does, <span className="font-serif font-normal italic">automatically</span>.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-16 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="bg-neutral-950 p-10 sm:p-12">
                  <h3 className="text-2xl font-semibold tracking-tight text-white">{f.title}</h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-neutral-400">{f.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <MetricsSection />

      <PoweredBy />

      {/* Use cases — light, square boxes */}
      <section className="bg-neutral-50 px-4 py-28 text-neutral-950 sm:px-6 sm:py-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">Who it’s for</p>
              <h2 className="mt-5 text-balance text-5xl font-semibold leading-[1.0] tracking-tight sm:text-6xl">
                Built for people who <span className="font-serif font-normal italic">talk</span> to camera.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-16 grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
              {useCases.map((u) => (
                <div key={u.title} className="bg-white p-10 sm:p-12">
                  <h3 className="text-3xl font-semibold tracking-tight">{u.title}</h3>
                  <p className="mt-5 text-[0.95rem] leading-relaxed text-neutral-500">{u.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pricing — Warden-style square boxes */}
      <section id="pricing" className="bg-white px-4 py-28 text-neutral-950 sm:px-6 sm:py-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">Pricing</p>
              <h2 className="mt-5 text-balance text-5xl font-semibold leading-[1.0] tracking-tight sm:text-6xl">
                Start free, scale by the <span className="font-serif font-normal italic">minute</span>.
              </h2>
              <p className="mt-6 max-w-xl text-lg text-neutral-500">
                No hidden fees, no lock-in. Pay only for what you render.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-16 grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-3">
              {plans.map((plan, idx) => (
                <div
                  key={plan.name}
                  className={`relative bg-white p-8 lg:p-12 ${
                    plan.popular ? "border-2 border-neutral-950 md:-my-4 md:py-12 lg:py-16" : ""
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-8 bg-neutral-950 px-3 py-1 font-mono text-xs uppercase tracking-widest text-white">
                      Most popular
                    </span>
                  )}

                  <div className="mb-8">
                    <span className="font-mono text-xs text-neutral-400">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 text-3xl font-semibold tracking-tight">{plan.name}</h3>
                    <p className="mt-2 text-sm text-neutral-500">{plan.description}</p>
                  </div>

                  <div className="mb-8 border-b border-neutral-200 pb-8">
                    <span className="text-5xl font-semibold tracking-tight lg:text-6xl">{plan.price}</span>
                    {plan.per && <span className="ml-1 text-xl font-medium text-neutral-400">{plan.per}</span>}
                  </div>

                  <ul className="mb-10 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-sm text-neutral-500">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/create-video"
                    className={`group flex w-full items-center justify-center gap-2 py-4 text-sm font-medium transition-all ${
                      plan.popular
                        ? "bg-neutral-950 text-white hover:bg-neutral-800"
                        : "border border-neutral-300 text-neutral-950 hover:border-neutral-950 hover:bg-neutral-50"
                    }`}
                  >
                    {plan.cta}
                    <ArrowIcon />
                  </Link>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA — white, square */}
      <section className="bg-white px-4 pb-28 text-neutral-950 sm:px-6 sm:pb-40">
        <Reveal className="mx-auto max-w-5xl">
          <div className="border border-neutral-200 bg-neutral-50 px-6 py-20 text-center sm:px-12 sm:py-28">
            <h2 className="text-balance text-5xl font-semibold leading-[1.0] tracking-tight sm:text-6xl md:text-7xl">
              Stop editing. <span className="font-serif font-normal italic">Start</span> shipping.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg text-neutral-500">
              Upload your first video and watch it turn into something post-ready.
            </p>
            <Link
              href="/create-video"
              className="mt-10 inline-block rounded-full bg-neutral-950 px-9 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Upload your first video
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer — light, animated wave background */}
      <footer className="relative overflow-hidden border-t border-neutral-200 bg-white text-neutral-950">
        <div className="pointer-events-none absolute inset-0 h-64 overflow-hidden opacity-20">
          <AnimatedWave />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 md:px-10">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
            <div className="max-w-xs">
              <Link href="/" className="text-xl font-semibold tracking-tight">
                BestVideo
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                Upload raw footage. Get a finished video — captions, B-roll, and cuts, done for you.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-12 gap-y-8 sm:gap-x-14" aria-label="Footer">
              <div>
                <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">Product</h4>
                <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
                  <li><a href="#how" className="transition hover:text-neutral-950">How it works</a></li>
                  <li><a href="#features" className="transition hover:text-neutral-950">Features</a></li>
                  <li><a href="#pricing" className="transition hover:text-neutral-950">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">Company</h4>
                <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
                  <li><a href="#" className="transition hover:text-neutral-950">About</a></li>
                  <li><a href="#" className="transition hover:text-neutral-950">Blog</a></li>
                  <li><a href="#" className="transition hover:text-neutral-950">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">Legal</h4>
                <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
                  <li><a href="#" className="transition hover:text-neutral-950">Privacy</a></li>
                  <li><a href="#" className="transition hover:text-neutral-950">Terms</a></li>
                </ul>
              </div>
            </nav>
          </div>
          <div className="mt-14 border-t border-neutral-200 pt-7 text-center text-xs text-neutral-400">
            © {new Date().getFullYear()} BestVideo. Raw footage in, finished video out.
          </div>
        </div>
      </footer>
    </div>
  );
}
