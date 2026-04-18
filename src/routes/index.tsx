import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { HowItWorks } from "@/components/HowItWorks";
import { SampleComic } from "@/components/SampleComic";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Memco — Your Onchain Life, Roasted by AI" },
      {
        name: "description",
        content: "Memco scans your EVM wallet (ETH, Polygon, Arbitrum) and turns your trades into an AI meme comic. Degen score included.",
      },
      { property: "og:title", content: "Memco — Your Onchain Life, Roasted by AI" },
      { property: "og:description", content: "Connect your wallet and let AI roast your onchain history into a meme comic." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <SampleComic />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
