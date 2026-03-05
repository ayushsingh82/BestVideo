import { Navbar } from "./components/Navbar";
import { HeroVideo } from "./components/HeroVideo";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans">
      <Navbar />

      {/* Hero: picks a random video from config/hero-videos.ts on each load */}
      <section className="relative min-h-[85vh] w-full overflow-hidden bg-neutral-950 sm:min-h-[90vh]">
        <div className="absolute inset-0">
          <HeroVideo />
          <div className="absolute inset-0 bg-neutral-950/35" />
        </div>
        <div className="relative z-10 flex min-h-[85vh] flex-col items-center justify-center px-4 pt-24 pb-12 text-center sm:min-h-[90vh] sm:px-6 sm:pt-28 md:pt-32">
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
      </section>

      {/* White section: black text + video in rounded frame with transparent border */}
      <section
        id="how"
        className="bg-white px-4 py-16 text-neutral-900 sm:px-6 sm:py-24 md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            From prompt to publish in minutes
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-neutral-600 sm:mt-4 sm:text-lg">
            Describe your concept in plain language. Our AI handles composition, motion, and style—you get broadcast-ready video without a single cut.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-neutral-500 sm:mt-6 sm:text-base">
            BestVideo uses advanced generative models to produce smooth, coherent footage from a single text prompt. 
            Product demos, social clips, ads, or creative shorts—all in standard formats, ready to download or share. 
            No cameras, crews, or editing timelines required.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-neutral-500 sm:mt-4 sm:text-base">
            Enter your idea, hit generate, and use your video wherever you need it.
          </p>

          {/* Video frame: rounded corners, transparent / subtle border (Luma-style) */}
          <div className="mt-10 flex flex-col items-center gap-8 sm:mt-16 sm:gap-12 md:flex-row md:justify-center md:gap-16">
            <div className="w-full max-w-xl px-0 sm:px-0">
              <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50/50 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
                <div className="aspect-video w-full">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  >
                    <source
                      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-medium text-neutral-700">
                Cinematic output, single prompt
              </p>
            </div>
            <div className="w-full max-w-xl">
              <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50/50 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
                <div className="aspect-video w-full">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  >
                    <source
                      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-medium text-neutral-700">
                Smooth motion, consistent look
              </p>
            </div>
          </div>

          {/* Single large frame option - Luma often has one big hero video in the white section too */}
          <div className="mt-16 sm:mt-24">
            <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.06)] sm:rounded-3xl">
              <div className="aspect-[16/9] w-full">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                >
                  <source
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                    type="video/mp4"
                  />
                </video>
              </div>
            </div>
            <p className="mt-5 text-center text-base text-neutral-600">
              One prompt. Full creative control.
            </p>
          </div>

          {/* More text: feature bullets */}
          <div id="features" className="mt-16 grid gap-6 sm:mt-24 sm:gap-8 sm:grid-cols-2 lg:gap-10 lg:grid-cols-3">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-neutral-900">Prompt to video</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Describe your concept in plain language. Our AI handles framing, motion, and visual style so you can focus on the idea.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-neutral-900">Ship in minutes</h3>
              <p className="mt-2 text-sm text-neutral-600">
                First video in minutes. Queue multiple generations and download or share as soon as each one is ready.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-neutral-900">Export everywhere</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Standard formats and shareable links. Use your videos on social, in ads, or embed in your own products.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — black background */}
      <section id="pricing" className="bg-neutral-950 px-4 py-16 text-white sm:px-6 sm:py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            Pricing that scales with you
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-neutral-400 sm:mt-4 sm:text-lg">
            Start free. Upgrade when you need more. No hidden fees or lock-in.
          </p>
          <div className="mt-10 grid gap-6 sm:mt-16 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-6">
            <div className="rounded-2xl border border-neutral-700/80 bg-neutral-900/50 p-6 backdrop-blur-sm transition hover:border-neutral-600 sm:p-8">
              <h3 className="text-lg font-semibold text-white">Starter</h3>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                Free
              </p>
              <p className="mt-2 text-sm text-neutral-400">5 videos per month</p>
              <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                <li>720p export</li>
                <li>Standard styles</li>
                <li>Community support</li>
              </ul>
              <a
                href="#create"
                className="mt-8 block w-full rounded-xl border border-neutral-600 py-3 text-center text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Start for free
              </a>
            </div>
            <div className="relative rounded-2xl border-2 border-white/20 bg-neutral-900 p-6 shadow-[0_0_40px_-12px_rgba(255,255,255,0.15)] sm:p-8">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 text-xs font-medium text-neutral-950">
                Most popular
              </span>
              <h3 className="text-lg font-semibold text-white">Pro</h3>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                $19<span className="text-base font-normal text-neutral-400">/mo</span>
              </p>
              <p className="mt-2 text-sm text-neutral-400">Unlimited videos</p>
              <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                <li>1080p export</li>
                <li>All styles + custom presets</li>
                <li>Priority support</li>
              </ul>
              <a
                href="#create"
                className="mt-8 block w-full rounded-xl bg-white py-3 text-center text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
              >
                Start free trial
              </a>
            </div>
            <div className="rounded-2xl border border-neutral-700/80 bg-neutral-900/50 p-6 backdrop-blur-sm transition hover:border-neutral-600 sm:p-8">
              <h3 className="text-lg font-semibold text-white">Team</h3>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                $49<span className="text-base font-normal text-neutral-400">/mo</span>
              </p>
              <p className="mt-2 text-sm text-neutral-400">For teams and brands</p>
              <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                <li>4K export</li>
                <li>Brand kits and API access</li>
                <li>Dedicated support</li>
              </ul>
              <a
                href="#create"
                className="mt-8 block w-full rounded-xl border border-neutral-600 py-3 text-center text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — Ready to create */}
      <section className="border-t border-neutral-100 bg-neutral-50/80 px-4 py-16 text-neutral-900 sm:px-6 sm:py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Ready to create?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-neutral-600 sm:mt-6 sm:text-lg md:text-xl">
            Start generating videos in minutes. No credit card required.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <a
              href="#create"
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-4 text-base font-medium text-white transition hover:bg-neutral-800 sm:px-8"
            >
              Get started
              <span className="transition group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href="#pricing"
              className="min-h-[44px] rounded-full border border-neutral-300 px-6 py-4 text-center text-base font-medium text-neutral-900 transition hover:bg-neutral-100 sm:px-8"
            >
              View pricing
            </a>
          </div>
          <p className="mt-6 text-sm text-neutral-500 sm:mt-8">
            Join thousands of creators already using BestVideo.
          </p>
        </div>
      </section>

      {/* Footer: black bg, white text, different tone */}
      <footer className="bg-neutral-950 px-4 py-12 text-white sm:px-6 sm:py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 sm:gap-12 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-xl font-semibold tracking-tight sm:text-2xl">BestVideo</span>
              <p className="mt-2 max-w-sm text-sm text-neutral-400 sm:mt-3">
                Professional video from a single prompt. We help teams and creators ship broadcast-ready content without the usual friction.
              </p>
            </div>
            <div className="flex flex-wrap gap-8 sm:gap-10 md:gap-16">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Product</h4>
                <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                  <li><a href="#how" className="block py-1 transition hover:text-white">How it works</a></li>
                  <li><a href="#features" className="block py-1 transition hover:text-white">Features</a></li>
                  <li><a href="#pricing" className="block py-1 transition hover:text-white">Pricing</a></li>
                  <li><a href="#create" className="block py-1 transition hover:text-white">Create video</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Company</h4>
                <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                  <li><a href="#" className="block py-1 transition hover:text-white">About</a></li>
                  <li><a href="#" className="block py-1 transition hover:text-white">Blog</a></li>
                  <li><a href="#" className="block py-1 transition hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Legal</h4>
                <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                  <li><a href="#" className="block py-1 transition hover:text-white">Privacy</a></li>
                  <li><a href="#" className="block py-1 transition hover:text-white">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-neutral-800 pt-6 text-center text-sm text-neutral-500 sm:mt-16 sm:pt-8">
            © {new Date().getFullYear()} BestVideo. AI-powered video for teams and creators.
          </div>
        </div>
      </footer>
    </div>
  );
}
