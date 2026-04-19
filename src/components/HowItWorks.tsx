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
    <section id="how" className="border-b-4 border-ink bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="mb-4 text-center font-display text-5xl text-ink md:text-7xl">
          HOW IT WORKS
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center font-sans text-lg text-ink/70">
          Three steps. Zero effort. Maximum embarrassment.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className={`border-4 border-ink ${s.bg} ${s.rotate} p-7 shadow-pop-lg transition-transform hover:rotate-0`}
            >
              <div className="mb-3 font-display text-6xl opacity-90">{s.n}</div>
              <h3 className="mb-3 font-display text-3xl">{s.title}</h3>
              <p className="font-sans text-base font-medium leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
