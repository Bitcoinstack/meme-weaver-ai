import { Link } from "@tanstack/react-router";
import penguin from "@/assets/penguin-hero.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ice-gradient border-b-4 border-ink">
      <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div>
          <span className="mb-6 inline-block -rotate-2 border-4 border-ink bg-cream px-3 py-1 font-display text-sm text-ink shadow-pop-sm md:text-base">
            ⚡ AI-POWERED · ETH · POLYGON · ARBITRUM
          </span>
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-ink md:text-7xl lg:text-8xl">
            YOUR ONCHAIN
            <br />
            LIFE,
            <br />
            <span className="text-roast">ROASTED.</span>
          </h1>
          <p className="mt-6 max-w-md font-sans text-lg font-medium text-ink/80 md:text-xl">
            Memco scans your wallet and turns your trades, rugs and big wins into a meme comic. AI-narrated. Custom characters per panel. Brutally honest.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/roast"
              className="border-4 border-ink bg-primary px-6 py-4 font-display text-xl text-ink shadow-pop transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none md:text-2xl"
            >
              ROAST MY WALLET →
            </Link>
            <a
              href="#sample"
              className="font-sans font-semibold text-ink underline underline-offset-4 hover:text-roast"
            >
              See a sample
            </a>
          </div>
        </div>

        <div className="relative flex min-h-[400px] items-center justify-center">
          <div className="absolute left-4 top-0 z-10 -rotate-[8deg] border-4 border-ink bg-cream px-3 py-2 font-comic text-xl text-ink shadow-pop-sm md:left-12">
            you bought the top again? 💀
          </div>
          <div className="absolute bottom-8 right-2 z-10 rotate-[6deg] border-4 border-ink bg-roast px-3 py-2 font-comic text-xl text-cream shadow-pop-sm md:right-8">
            REKT!
          </div>
          <div className="animate-float-bob">
            <img
              src={penguin}
              alt="Memco mascot holding a coin"
              className="w-72 drop-shadow-[8px_8px_0_rgba(0,0,0,0.9)] md:w-96 lg:w-[480px]"
              width={480}
              height={480}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
