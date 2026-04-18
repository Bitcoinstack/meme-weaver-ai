import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "CONNECT",
    body: "Plug in your MetaMask or WalletConnect on BNB Chain. We only read public data.",
    rotate: "-rotate-2",
    bg: "bg-primary",
  },
  {
    n: "02",
    title: "AI SCANS",
    body: "Our AI digs through your swaps, biggest wins, worst rugs and degen patterns.",
    rotate: "rotate-1",
    bg: "bg-secondary",
  },
  {
    n: "03",
    title: "GET ROASTED",
    body: "A 6-panel meme comic appears with captions, a Degen Score and a final verdict.",
    rotate: "-rotate-1",
    bg: "bg-accent text-cream",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-cream border-b-4 border-ink py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="font-display text-5xl md:text-7xl text-ink text-center mb-4">
          HOW IT WORKS
        </h2>
        <p className="text-center font-sans text-lg text-ink/70 mb-14 max-w-xl mx-auto">
          Three steps. Zero effort. Maximum embarrassment.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className={`border-4 border-ink ${s.bg} p-7 shadow-pop-lg ${s.rotate} hover:rotate-0 transition-transform`}
            >
              <div className="font-display text-6xl mb-3 opacity-90">{s.n}</div>
              <h3 className="font-display text-3xl mb-3">{s.title}</h3>
              <p className="font-sans font-medium text-base leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
