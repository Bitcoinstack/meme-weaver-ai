import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import penguin from "@/assets/penguin-hero.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ice-gradient border-b-4 border-ink">
      {/* halftone overlay */}
      <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block border-4 border-ink bg-cream px-3 py-1 font-display text-sm md:text-base text-ink mb-6 shadow-pop-sm -rotate-2">
            ⚡ AI-POWERED · ETH · POLYGON · ARBITRUM
          </span>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-ink leading-[0.95] tracking-tight">
            YOUR ONCHAIN<br />
            LIFE,<br />
            <span className="text-roast">ROASTED.</span>
          </h1>
          <p className="mt-6 max-w-md font-sans text-lg md:text-xl text-ink/80 font-medium">
            Memco scans your wallet and turns your trades, rugs and big wins into a meme comic. AI-narrated. Custom characters per panel. Brutally honest.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/roast"
              className="border-4 border-ink bg-primary px-6 py-4 font-display text-xl md:text-2xl text-ink shadow-pop hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
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
        </motion.div>

        {/* Right: floating penguin */}
        <div className="relative flex justify-center items-center min-h-[400px]">
          <motion.div
            className="absolute -top-4 left-4 md:left-12 border-4 border-ink bg-cream px-3 py-2 font-comic text-xl text-ink shadow-pop-sm rotate-[-8deg] z-10"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            you bought the top again? 💀
          </motion.div>
          <motion.div
            className="absolute bottom-8 right-2 md:right-8 border-4 border-ink bg-roast text-cream px-3 py-2 font-comic text-xl shadow-pop-sm rotate-[6deg] z-10"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, type: "spring" }}
          >
            REKT!
          </motion.div>
          <div className="animate-float-bob">
            <img
              src={penguin}
              alt="Memco mascot holding a coin"
              className="w-72 md:w-96 lg:w-[480px] drop-shadow-[8px_8px_0_rgba(0,0,0,0.9)]"
              width={480}
              height={480}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
