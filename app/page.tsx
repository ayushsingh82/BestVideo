import { Navbar } from "./components/Navbar";
import { ConnectSection } from "./components/ConnectSection";
import { Background } from "./components/ui/background";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans">
      <Navbar />

      {/* Hero: Background video + headline, CTAs */}
      <section className="relative min-h-[95vh] w-full overflow-hidden bg-neutral-950 sm:min-h-[100vh]">
        <div className="absolute inset-0">
          <Background
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4"
            placeholder="/alt-placeholder.png"
          />
          <div className="absolute inset-0 z-10 flex min-h-[95vh] flex-col items-center justify-center px-4 pt-40 pb-24 text-center sm:min-h-[100vh] sm:px-6 sm:pt-44 sm:pb-28 md:pt-48 md:pb-32">
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              AI-powered video in minutes, not days
            </h1>
            <p className="mt-4 max-w-xl text-base text-neutral-300 sm:mt-6 sm:text-lg md:text-xl">
              Turn ideas into polished video with a single prompt. No cameras, no editing—just describe it and ship it.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
              <a
                href="#create"
                className="min-h-[44px] rounded-full bg-white px-6 py-3.5 text-center text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 sm:py-3"
              >
                Create your first video
              </a>
              <a
                href="#how"
                className="min-h-[44px] rounded-full border border-white/30 px-6 py-3.5 text-center text-sm font-medium text-white transition hover:bg-white/10 sm:py-3"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-black py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 relative z-10">
          <div className="grid grid-cols-2 gap-y-12 gap-x-8 sm:grid-cols-4 lg:gap-x-16">
            <div className="text-center group">
              <p className="text-5xl font-extrabold tracking-tight md:text-6xl bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent group-hover:from-white group-hover:to-white/80 transition-all">10k+</p>
              <p className="mt-3 text-sm font-medium uppercase tracking-widest text-neutral-500">Generations</p>
            </div>
            <div className="text-center group">
              <p className="text-5xl font-extrabold tracking-tight md:text-6xl bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent group-hover:from-white group-hover:to-white/80 transition-all">4.9</p>
              <p className="mt-3 text-sm font-medium uppercase tracking-widest text-neutral-500">User Rating</p>
            </div>
            <div className="text-center group">
              <p className="text-5xl font-extrabold tracking-tight md:text-6xl bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent group-hover:from-white group-hover:to-white/80 transition-all">50+</p>
              <p className="mt-3 text-sm font-medium uppercase tracking-widest text-neutral-500">Countries</p>
            </div>
            <div className="text-center group">
              <p className="text-5xl font-extrabold tracking-tight md:text-6xl bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent group-hover:from-white group-hover:to-white/80 transition-all">&lt;10s</p>
              <p className="mt-3 text-sm font-medium uppercase tracking-widest text-neutral-500">Avg. Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Connect on Instagram — draggable images + VariableProximity */}
      <ConnectSection />

      {/* White section: From prompt to publish in minutes */}
      <section
        id="how"
        className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 sm:py-32 md:px-10 lg:py-40 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-neutral-950 to-neutral-950"></div>
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
              From prompt to publish<br/>in minutes
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400 sm:text-xl leading-relaxed">
              Describe your concept in plain language. Our AI handles composition, motion, and style—you get broadcast-ready visuals without a single cut.
            </p>
          </div>

          {/* Video frame layout - Luma-inspired */}
          <div className="mt-20 grid gap-8 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 transition-all hover:border-white/20">
              <div className="aspect-[4/3] w-full relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                >
                  <source
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute bottom-0 left-0 p-8 z-20">
                  <p className="text-sm font-medium uppercase tracking-wider text-neutral-300">Cinematic output</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Single prompt generation</p>
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 transition-all hover:border-white/20">
              <div className="aspect-[4/3] w-full relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                >
                  <source
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute bottom-0 left-0 p-8 z-20">
                  <p className="text-sm font-medium uppercase tracking-wider text-neutral-300">Smooth motion</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Consistent aesthetics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Video scale option */}
          <div className="mt-12 group relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl transition-all hover:border-white/20">
            <div className="aspect-[21/9] w-full relative">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              >
                <source
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  type="video/mp4"
                />
              </video>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-2xl font-bold text-white tracking-widest uppercase">One prompt. Full control.</p>
              </div>
            </div>
          </div>

          {/* Feature bullets */}
          <div id="features" className="mt-24 grid gap-8 sm:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-8 transition hover:bg-white/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">Prompt to visuals</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                Type your idea in plain language. Our AI handles composition, motion, and style.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-8 transition hover:bg-white/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">Ship in minutes</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                Run multiple generations in parallel and download or share each one instantly.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-8 transition hover:bg-white/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">Export everywhere</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                Standard formats and one-click links for social, ads, or embedding anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-neutral-950 px-4 py-24 sm:px-6 sm:py-32 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Built for how you work
            </h2>
            <p className="mt-6 text-xl text-neutral-400">
              Marketers, creators, and teams use BestVideo to ship creative content without the usual friction.
            </p>
          </div>
          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            <div className="group rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-10 transition-all hover:bg-white/[0.05] hover:border-white/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-white">Marketers</h3>
              <p className="mt-4 text-base leading-relaxed text-neutral-400">Launch ads and social campaigns in minutes. A/B test creatives without waiting on production.</p>
            </div>
            <div className="group rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-10 transition-all hover:bg-white/[0.05] hover:border-white/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-white">Creators</h3>
              <p className="mt-4 text-base leading-relaxed text-neutral-400">Turn ideas into shorts and posts fast. One prompt, multiple formats—ready for any platform.</p>
            </div>
            <div className="group rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-10 transition-all hover:bg-white/[0.05] hover:border-white/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-white">Teams</h3>
              <p className="mt-4 text-base leading-relaxed text-neutral-400">Keep brand and style consistent. Scale creatives across campaigns with shared presets and templates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — black background */}
      <section id="pricing" className="bg-neutral-950 px-4 py-24 text-white sm:px-6 sm:py-32 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Pricing that scales with you
            </h2>
            <p className="mt-6 text-xl text-neutral-400">
              Start free. Upgrade when you need more. No hidden fees or lock-in.
            </p>
          </div>
          <div className="mt-20 grid gap-8 lg:grid-cols-3 lg:gap-8 items-center">
            
            <div className="rounded-3xl border border-white/5 bg-neutral-900 p-8 xl:p-10 transition hover:border-white/10">
              <h3 className="text-xl font-medium text-white">Starter</h3>
              <p className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tight text-white">
                Free
              </p>
              <p className="mt-2 text-sm text-neutral-400">5 generations per month</p>
              <a
                href="/create-image"
                className="mt-8 block w-full rounded-full border border-white/10 bg-white/5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Start for free
              </a>
              <ul className="mt-10 space-y-4 text-base text-neutral-300">
                <li className="flex gap-3 text-neutral-400"><svg className="h-6 w-6 flex-none text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Basic exports</li>
                <li className="flex gap-3 text-neutral-400"><svg className="h-6 w-6 flex-none text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Standard styles</li>
                <li className="flex gap-3 text-neutral-400"><svg className="h-6 w-6 flex-none text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Community support</li>
              </ul>
            </div>

            <div className="relative rounded-3xl border border-blue-500/30 bg-neutral-900 p-8 xl:p-10 shadow-[0_0_80px_-15px_rgba(59,130,246,0.2)] lg:scale-105 z-10 hidden md:block lg:block">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg">
                Most popular
              </span>
              <h3 className="text-xl font-medium text-white">Pro</h3>
              <p className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tight text-white">
                $19<span className="ml-1 text-xl font-medium text-neutral-400">/mo</span>
              </p>
              <p className="mt-2 text-sm text-neutral-400">Unlimited generations</p>
              <a
                href="/create-image"
                className="mt-8 block w-full rounded-full bg-white py-4 text-center text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Start free trial
              </a>
              <ul className="mt-10 space-y-4 text-base text-neutral-300">
                <li className="flex gap-3 text-white"><svg className="h-6 w-6 flex-none text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Highest quality export</li>
                <li className="flex gap-3 text-white"><svg className="h-6 w-6 flex-none text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> All styles + custom presets</li>
                <li className="flex gap-3 text-white"><svg className="h-6 w-6 flex-none text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Priority support</li>
              </ul>
            </div>
            
            {/* Fallback for mobile (scale causes overlap issues on very small screens sometimes so we don't scale) */}
            <div className="relative rounded-3xl border border-blue-500/30 bg-neutral-900 p-8 xl:p-10 shadow-[0_0_80px_-15px_rgba(59,130,246,0.2)] md:hidden">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg">
                Most popular
              </span>
              <h3 className="text-xl font-medium text-white">Pro</h3>
              <p className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tight text-white">
                $19<span className="ml-1 text-xl font-medium text-neutral-400">/mo</span>
              </p>
              <p className="mt-2 text-sm text-neutral-400">Unlimited generations</p>
              <a
                href="/create-image"
                className="mt-8 block w-full rounded-full bg-white py-4 text-center text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Start free trial
              </a>
              <ul className="mt-10 space-y-4 text-base text-neutral-300">
                <li className="flex gap-3 text-white"><svg className="h-6 w-6 flex-none text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Highest quality export</li>
                <li className="flex gap-3 text-white"><svg className="h-6 w-6 flex-none text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> All styles + custom presets</li>
                <li className="flex gap-3 text-white"><svg className="h-6 w-6 flex-none text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Priority support</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/5 bg-neutral-900 p-8 xl:p-10 transition hover:border-white/10">
              <h3 className="text-xl font-medium text-white">Team</h3>
              <p className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tight text-white">
                $49<span className="ml-1 text-xl font-medium text-neutral-400">/mo</span>
              </p>
              <p className="mt-2 text-sm text-neutral-400">For teams and brands</p>
              <a
                href="/create-image"
                className="mt-8 block w-full rounded-full border border-white/10 bg-white/5 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Contact sales
              </a>
              <ul className="mt-10 space-y-4 text-base text-neutral-300">
                <li className="flex gap-3 text-neutral-400"><svg className="h-6 w-6 flex-none text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Team workspaces</li>
                <li className="flex gap-3 text-neutral-400"><svg className="h-6 w-6 flex-none text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Brand kits and API access</li>
                <li className="flex gap-3 text-neutral-400"><svg className="h-6 w-6 flex-none text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Dedicated support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 md:px-10">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
            <div className="max-w-xs">
              <a href="/" className="text-lg font-semibold tracking-tight sm:text-xl">BestVideo</a>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Turn text into video. No cameras, no editing—just describe it and ship it.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-12 gap-y-8 sm:gap-x-14" aria-label="Footer">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Product</h4>
                <ul className="mt-3 space-y-2 text-sm text-neutral-400">
                  <li><a href="#how" className="transition hover:text-white">How it works</a></li>
                  <li><a href="#features" className="transition hover:text-white">Features</a></li>
                  <li><a href="#pricing" className="transition hover:text-white">Pricing</a></li>
                  <li><a href="#create" className="transition hover:text-white">Create video</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Company</h4>
                <ul className="mt-3 space-y-2 text-sm text-neutral-400">
                  <li><a href="#" className="transition hover:text-white">About</a></li>
                  <li><a href="#" className="transition hover:text-white">Blog</a></li>
                  <li><a href="#" className="transition hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Legal</h4>
                <ul className="mt-3 space-y-2 text-sm text-neutral-400">
                  <li><a href="#" className="transition hover:text-white">Privacy</a></li>
                  <li><a href="#" className="transition hover:text-white">Terms</a></li>
                </ul>
              </div>
            </nav>
          </div>
          <div className="mt-10 border-t border-neutral-800 pt-6 text-center text-xs text-neutral-500 sm:mt-12 sm:pt-6">
            © {new Date().getFullYear()} BestVideo. AI-powered video from text.
          </div>
        </div>
      </footer>
    </div>
  );
}
