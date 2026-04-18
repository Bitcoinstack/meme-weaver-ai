const ITEMS = [
  "ONCHAIN ROAST",
  "BNB CHAIN",
  "DEGEN MODE",
  "REKT OR RICH",
  "MEMCO",
  "WAGMI",
  "AI STORYTELLER",
  "DIAMOND HANDS",
];

export function Marquee() {
  const loop = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="border-y-4 border-ink bg-primary overflow-hidden py-4">
      <div className="flex animate-marquee whitespace-nowrap">
        {loop.map((item, i) => (
          <span
            key={i}
            className="mx-8 font-display text-2xl md:text-3xl text-ink uppercase tracking-wide"
          >
            ★ {item}
          </span>
        ))}
      </div>
    </div>
  );
}
