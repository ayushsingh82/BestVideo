"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Background } from "@/app/components/ui/background";
import { Navbar } from "@/app/components/Navbar";

export default function CreateImagePage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Poll for job status
  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/job-image/${jobId}`);
        if (!res.ok) throw new Error("Failed to fetch job status");
        const data = await res.json();
        
        setJobStatus(data.status);
        if (data.status === "completed") {
          setImageUrl(data.imageUrl);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setError(data.errorMessage || "Generation failed");
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000); // Poll every 2s

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setJobId(null);
    setJobStatus(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspect_ratio: aspectRatio }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 && data.code === "INSUFFICIENT_CREDITS") {
          setError(`Insufficient credits. You need ${data.creditsRequired || 5} credits.`);
          // Optionally router.push('/buy-credits') here
        } else {
          throw new Error(data.error || "Failed to submit job");
        }
      } else {
        setJobId(data.jobId);
        setJobStatus(data.status);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white">
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">Create Image</h1>
          <p className="text-lg text-neutral-400">Describe what you want to see, and AI will generate it in seconds (Costs 5 credits).</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-semibold text-neutral-300 mb-2">Prompt</label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic city skyline at sunset in cyberpunk style..."
                    className="min-h-[140px] w-full resize-y rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white placeholder-neutral-500 focus:border-white/30 focus:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-white/30 transition-colors"
                    disabled={isSubmitting || jobStatus === "queued" || jobStatus === "processing"}
                  />
                </div>

                <div>
                  <label htmlFor="aspectRatio" className="block text-sm font-semibold text-neutral-300 mb-2">Aspect Ratio</label>
                  <select
                    id="aspectRatio"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    disabled={isSubmitting || jobStatus === "queued" || jobStatus === "processing"}
                    className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white focus:border-white/30 focus:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50 transition-colors cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                  >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait / Story)</option>
                    <option value="3:2">3:2 (Photography)</option>
                    <option value="2:3">2:3 (Poster)</option>
                    <option value="4:5">4:5 (Social Feed)</option>
                  </select>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!prompt.trim() || isSubmitting || jobStatus === "queued" || jobStatus === "processing"}
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-white px-4 py-4 text-sm font-semibold text-neutral-950 shadow-md transition-all hover:bg-neutral-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-md"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Submitting...</span>
                  ) : (jobStatus === "queued" || jobStatus === "processing") ? (
                    <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</span>
                  ) : "Generate Image"}
                </button>
              </form>
            </div>
            
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 hidden lg:block">
               <h3 className="text-sm font-semibold text-white mb-3">Tips for better prompts</h3>
               <ul className="text-sm text-neutral-400 space-y-2.5 list-disc pl-4 marker:text-neutral-500">
                 <li>Be specific about the subject and its surroundings.</li>
                 <li>Include style keywords like "cinematic", "cyberpunk", or "watercolor".</li>
                 <li>Mention lighting conditions (e.g., "golden hour", "neon lights").</li>
                 <li>State the camera angle or composition (e.g., "wide shot", "macro").</li>
               </ul>
            </div>
          </div>

          {/* Right Column: Preview Area */}
          <div className="lg:col-span-7 h-[500px] lg:h-[700px] flex flex-col">
            <div className="flex-1 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col p-4 sm:p-6 relative transition-all duration-300">
              
              {/* Header / Top actions */}
              <div className="w-full flex justify-between items-center mb-4 min-h-[40px] z-20 absolute top-4 left-0 px-6 sm:px-8">
                <span className="text-sm font-semibold text-neutral-400 uppercase tracking-widest bg-neutral-900/80 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-white/10">Preview</span>
                {imageUrl && (
                  <button
                    onClick={() => {
                      setPrompt("");
                      setJobId(null);
                      setJobStatus(null);
                      setImageUrl(null);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm border border-white/10 hover:bg-neutral-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reset
                  </button>
                )}
              </div>

              {/* Main Preview Box Content */}
              <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative mt-12 rounded-2xl overflow-hidden bg-neutral-950 border border-white/10 shadow-sm">
                
                {!jobStatus && !imageUrl && (
                  <div className="text-center p-8 max-w-sm flex flex-col items-center animate-in fade-in duration-500">
                    <div className="h-20 w-20 rounded-2xl bg-neutral-900 flex items-center justify-center mb-6 text-neutral-500 border border-white/5 shadow-sm">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Image Generated</h3>
                    <p className="text-base text-neutral-400 leading-relaxed">Enter a prompt and select an aspect ratio on the left to create your first image.</p>
                  </div>
                )}

                {(jobStatus === "queued" || jobStatus === "processing") && !imageUrl && (
                  <div className="flex flex-col items-center z-10 p-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="relative h-20 w-20 mb-8">
                       <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                       <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
                       {jobStatus === "processing" && (
                         <div className="absolute inset-0 flex items-center justify-center">
                           <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                         </div>
                       )}
                    </div>
                    <p className="text-white font-semibold text-2xl mb-2">
                       {jobStatus === "queued" ? "Waiting..." : "Generating Image"}
                    </p>
                    <p className="text-neutral-400 text-base max-w-[250px]">
                       {jobStatus === "queued" ? "Queued for processing" : "Running inference, usually takes 5-15 seconds"}
                    </p>
                  </div>
                )}

                {imageUrl && (
                  <div className="absolute inset-0 w-full h-full flex flex-col group animate-in fade-in zoom-in-95 duration-700 bg-[url('/noise.png')]">
                    {/* Background fallback */}
                    <div className="absolute inset-0 bg-neutral-900" />
                    
                    {/* The image (object-contain so it fits within no matter what ratio) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl} 
                      alt={prompt}
                      className="absolute inset-0 w-full h-full object-contain z-10 shadow-sm"
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center backdrop-blur-[2px]">
                      <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-neutral-900 shadow-xl hover:scale-105 transition-transform"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Image
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
