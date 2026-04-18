import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/roast")({
  component: RoastPage,
  head: () => ({
    meta: [{ title: "Roast My Wallet — Memco" }],
  }),
});

function RoastPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-xl text-center">
          <h1 className="font-display text-5xl md:text-6xl text-ink mb-4">
            ALMOST READY 🐧
          </h1>
          <p className="font-sans text-lg text-ink/80 mb-8">
            Wallet connect + AI scan are coming online next. Once enabled you'll connect MetaMask, the AI scans your BNB activity and generates your personal 6-panel roast comic.
          </p>
          <Link
            to="/"
            className="inline-block border-4 border-ink bg-primary px-6 py-3 font-display text-xl text-ink shadow-pop hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
          >
            ← BACK HOME
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
