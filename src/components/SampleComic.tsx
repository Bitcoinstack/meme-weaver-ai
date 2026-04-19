import p1 from "@/assets/sample-panel-1.jpg";
import p2 from "@/assets/sample-panel-2.jpg";
import p3 from "@/assets/sample-panel-3.jpg";

const PANELS = [
  { img: p1, caption: "Day 1: aped into a meme coin. Instantly 5x'd. Felt like Buffett.", rotate: "-rotate-1" },
  { img: p2, caption: "Day 2: the chart did a thing. We don't talk about day 2.", rotate: "rotate-2" },
  { img: p3, caption: "Day 30: still bagholding. Still calling it 'long term conviction'.", rotate: "-rotate-2" },
];

export function SampleComic() {
  return (
    <section id="sample" className="relative overflow-hidden border-b-4 border-ink bg-secondary py-20 md:py-28">
      <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rotate-2 border-4 border-ink bg-primary px-3 py-1 font-display text-sm text-ink shadow-pop-sm">
            SAMPLE OUTPUT
          </span>
          <h2 className="font-display text-5xl text-ink md:text-7xl">
            A REAL DEGEN'S
            <br />
            STORY 📖
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {PANELS.map((p, i) => (
            <div
              key={i}
              className={`border-4 border-ink bg-cream p-3 shadow-pop-lg ${p.rotate} transition-transform hover:rotate-0`}
            >
              <img
                src={p.img}
                alt={`Sample comic panel ${i + 1}`}
                className="aspect-square w-full border-4 border-ink object-cover"
                loading="lazy"
                width={768}
                height={768}
              />
              <p className="mt-3 font-comic text-xl leading-tight text-ink">
                {p.caption}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <span className="inline-block border-4 border-ink bg-primary px-6 py-3 font-display text-2xl text-ink shadow-pop">
            DEGEN SCORE: 87 / 100 🔥
          </span>
        </div>
      </div>
    </section>
  );
}
