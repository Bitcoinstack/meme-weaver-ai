const ITEMS = [
  {
    q: "Is this safe? Does it touch my funds?",
    a: "No. Memco only reads your public wallet address from BscScan. No transactions, no signatures, no approvals. Ever.",
  },
  {
    q: "What chains do you support?",
    a: "BNB Chain only for the hackathon. Multi-chain coming next.",
  },
  {
    q: "What does the AI actually look at?",
    a: "Public swap history, biggest wins, worst losses, token diversity, wallet age, and how often you trade at 3am. The good stuff.",
  },
  {
    q: "Can I share my comic?",
    a: "Yes. Download as PNG or share to X with one click. Make your friends suffer too.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="bg-cream border-b-4 border-ink py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <h2 className="font-display text-5xl md:text-7xl text-ink text-center mb-14">
          QUESTIONS?
        </h2>
        <div className="space-y-5">
          {ITEMS.map((it, i) => (
            <details
              key={i}
              className="group border-4 border-ink bg-cream p-5 shadow-pop-sm cursor-pointer hover:shadow-pop transition-shadow"
            >
              <summary className="flex items-center justify-between font-display text-xl md:text-2xl text-ink list-none">
                <span>{it.q}</span>
                <span className="text-roast group-open:rotate-45 transition-transform text-3xl leading-none">+</span>
              </summary>
              <p className="mt-3 font-sans text-base text-ink/80 leading-relaxed">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
