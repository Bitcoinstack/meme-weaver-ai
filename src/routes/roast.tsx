import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WalletPicker } from "@/components/WalletPicker";
import { useAccount } from "wagmi";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import penguin from "@/assets/penguin-hero.png";

export const Route = createFileRoute("/roast")({
  component: RoastPage,
  head: () => ({
    meta: [
      { title: "Roast My Wallet — Memco" },
      {
        name: "description",
        content:
          "Connect your EVM wallet and let Memco AI generate your personal meme comic from your onchain activity.",
      },
    ],
  }),
});

type Panel = {
  title: string;
  caption: string;
  character: string;
  sticker: string | null;
  imageUrl: string;
};

type RecentTx = {
  hash: string;
  date: string;
  time: string;
  type: "send" | "receive" | "contract" | "swap" | "mint" | "failed";
  counterparty: string;
  token: string | null;
  valueLabel: string;
};

type ComicResult = {
  comicId: string | null;
  vibe: string;
  verdict: string;
  degenScore: number;
  panels: Panel[];
  recentTxs: RecentTx[];
  explorerBase: string;
  stats: {
    totalTxs: number;
    walletAgeDays: number;
    uniqueTokens: number;
    biggestSwapToken: string | null;
    chainName: string;
    contractsInteracted: number;
    totalNftMints: number;
  };
};

const TX_TYPE_STYLE: Record<RecentTx["type"], { bg: string; label: string }> = {
  send: { bg: "bg-roast text-cream", label: "SEND" },
  receive: { bg: "bg-primary text-ink", label: "RECV" },
  contract: { bg: "bg-secondary text-ink", label: "CALL" },
  swap: { bg: "bg-primary text-ink", label: "SWAP" },
  mint: { bg: "bg-roast text-cream", label: "MINT" },
  failed: { bg: "bg-ink text-cream", label: "FAIL" },
};

const SCAN_QUIPS = [
  "Counting your rugs…",
  "Reading your 3am trades…",
  "Judging your bags…",
  "Asking the AI to be gentle (it won't)…",
  "Quantifying the cope…",
  "Cross-referencing with the rekt list…",
  "Inventing characters for your story…",
  "Drawing panels…",
];

const CHAINS = [
  { id: 1, label: "Ethereum", short: "ETH" },
  { id: 56, label: "BNB Chain", short: "BNB" },
  { id: 137, label: "Polygon", short: "POLY" },
  { id: 42161, label: "Arbitrum", short: "ARB" },
];

function RoastPage() {
  const { address, isConnected } = useAccount();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chainId, setChainId] = useState(1);
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [comic, setComic] = useState<ComicResult | null>(null);
  const [quipIdx, setQuipIdx] = useState(0);
  const comicRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const lastScanKey = useRef<string | null>(null);

  const runScan = (addr: string, cId: number) => {
    const key = `${addr}-${cId}`;
    lastScanKey.current = key;
    setStatus("scanning");
    setError(null);
    setComic(null);

    supabase.functions
      .invoke("roast-wallet", { body: { address: addr, chainId: cId } })
      .then(({ data, error: invokeErr }) => {
        if (invokeErr) {
          setError(invokeErr.message || "Scan failed");
          setStatus("error");
          return;
        }
        if (!data?.ok) {
          setError(data?.error || "Scan failed");
          setStatus("error");
          return;
        }
        setComic(data as ComicResult);
        setStatus("done");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setStatus("error");
      });
  };

  // Auto-trigger scan when wallet connects (first time or chain change)
  useEffect(() => {
    if (!isConnected || !address) return;
    const key = `${address}-${chainId}`;
    if (lastScanKey.current === key) return;
    runScan(address, chainId);
  }, [isConnected, address, chainId]);

  useEffect(() => {
    if (status !== "scanning") return;
    const id = setInterval(() => setQuipIdx((i) => (i + 1) % SCAN_QUIPS.length), 1800);
    return () => clearInterval(id);
  }, [status]);

  const handleConnect = () => setPickerOpen(true);

  const handleDownload = async () => {
    if (!comicRef.current) return;
    try {
      const dataUrl = await toPng(comicRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fdfbf4",
      });
      const link = document.createElement("a");
      link.download = `memco-roast-${address?.slice(0, 6)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadReel = async () => {
    if (!reelRef.current) return;
    try {
      const dataUrl = await toPng(reelRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fdfbf4",
      });
      const link = document.createElement("a");
      link.download = `memco-reel-${address?.slice(0, 6)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    const text = `My ${comic?.stats.chainName} wallet just got roasted by Memco 🐧🔥\n\nDegen Score: ${comic?.degenScore}/100\nVerdict: "${comic?.verdict}"\n\nGet yours:`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          {/* CONNECT */}
          {!isConnected && (
            <div className="text-center max-w-xl mx-auto">
              <div className="animate-float-bob inline-block mb-6">
                <img src={penguin} alt="" className="w-48 mx-auto" />
              </div>
              <h1 className="font-display text-5xl md:text-7xl text-ink mb-4 leading-[0.95]">
                READY TO GET<br />
                <span className="text-roast">ROASTED?</span>
              </h1>
              <p className="font-sans text-lg text-ink/80 mb-8">
                Connect your wallet. Memco only reads public data — no signatures, no approvals, no funds touched.
              </p>
              <button
                onClick={handleConnect}
                className="border-4 border-ink bg-primary px-8 py-4 font-display text-2xl text-ink shadow-pop hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
              >
                CONNECT WALLET 🔌
              </button>
              <p className="mt-4 font-sans text-sm text-ink/60">
                MetaMask, Coinbase, Rabby and other browser wallets supported
              </p>
              <div className="mt-6">
                <Link to="/" className="font-sans font-semibold text-ink underline underline-offset-4 hover:text-roast">
                  ← Back home
                </Link>
              </div>
            </div>
          )}

          {/* Connected — chain selector + status */}
          {isConnected && (
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              <span className="font-sans font-semibold text-ink/70 text-sm">SCAN ON:</span>
              {CHAINS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChainId(c.id)}
                  disabled={status === "scanning"}
                  className={`border-4 border-ink px-3 py-1 font-display text-sm shadow-pop-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 ${
                    chainId === c.id ? "bg-primary text-ink" : "bg-cream text-ink"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* SCANNING */}
          {status === "scanning" && (
            <div className="text-center max-w-xl mx-auto py-12">
              <div className="animate-float-bob inline-block mb-6">
                <img src={penguin} alt="" className="w-40 mx-auto drop-shadow-[6px_6px_0_rgba(0,0,0,0.9)]" />
              </div>
              <h2 className="font-display text-4xl md:text-6xl text-ink mb-4">SCANNING…</h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={quipIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-comic text-2xl text-roast"
                >
                  {SCAN_QUIPS[quipIdx]}
                </motion.p>
              </AnimatePresence>
              <p className="mt-8 font-sans text-sm text-ink/60">
                Reading on-chain history + drawing custom characters. ~30-60 seconds.
              </p>
            </div>
          )}

          {/* ERROR */}
          {status === "error" && (
            <div className="text-center max-w-xl mx-auto py-12">
              <h2 className="font-display text-4xl text-ink mb-4">OOPS 💀</h2>
              <p className="font-sans text-lg text-ink/80 mb-8">{error}</p>
              <button
                onClick={() => address && runScan(address, chainId)}
                className="border-4 border-ink bg-primary px-6 py-3 font-display text-xl text-ink shadow-pop hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {/* COMIC */}
          {status === "done" && comic && (
            <div>
              <div className="text-center mb-10">
                <span className="inline-block border-4 border-ink bg-primary px-4 py-2 font-display text-sm md:text-base text-ink shadow-pop-sm -rotate-2 mb-4 uppercase">
                  {comic.stats.chainName} · vibe: {comic.vibe}
                </span>
                <h2 className="font-display text-4xl md:text-6xl text-ink leading-[0.95]">
                  YOUR ONCHAIN<br />
                  <span className="text-roast">STORY 📖</span>
                </h2>
              </div>

              <div ref={comicRef} className="bg-cream p-4 md:p-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comic.panels.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.15, duration: 0.5 }}
                      className={`border-4 border-ink bg-cream p-3 shadow-pop-lg ${
                        i % 2 === 0 ? "-rotate-1" : "rotate-1"
                      } hover:rotate-0 transition-transform relative`}
                    >
                      <div className="relative">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-full aspect-square object-cover border-4 border-ink"
                          />
                        ) : (
                          <div className="w-full aspect-square border-4 border-ink bg-secondary flex items-center justify-center font-display text-2xl text-ink p-4 text-center">
                            {p.character}
                          </div>
                        )}
                        {p.sticker && (
                          <span className="absolute top-2 right-2 border-4 border-ink bg-roast text-cream px-2 py-1 font-display text-sm shadow-pop-sm rotate-6">
                            {p.sticker}
                          </span>
                        )}
                        <span className="absolute top-2 left-2 border-4 border-ink bg-primary px-2 py-1 font-display text-sm shadow-pop-sm">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-xl text-ink">{p.title}</h3>
                      <p className="mt-1 font-comic text-lg text-ink leading-tight">{p.caption}</p>
                      <p className="mt-1 font-sans text-xs text-ink/50 italic">★ {p.character}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <div className="inline-block border-4 border-ink bg-primary px-6 py-4 font-display text-3xl md:text-4xl text-ink shadow-pop">
                    DEGEN SCORE: {comic.degenScore} / 100 🔥
                  </div>
                  <p className="mt-6 max-w-2xl mx-auto font-comic text-2xl md:text-3xl text-ink leading-tight px-4">
                    "{comic.verdict}"
                  </p>
                  <p className="mt-4 font-sans text-sm text-ink/60">
                    {comic.stats.totalTxs} txs · {comic.stats.walletAgeDays}d old · {comic.stats.uniqueTokens} tokens · {comic.stats.contractsInteracted} contracts · {comic.stats.totalNftMints} NFT mints
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <button
                  onClick={handleShare}
                  className="border-4 border-ink bg-roast text-cream px-6 py-3 font-display text-xl shadow-pop hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                  SHARE ON 𝕏
                </button>
                <button
                  onClick={handleDownload}
                  className="border-4 border-ink bg-primary text-ink px-6 py-3 font-display text-xl shadow-pop hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                  DOWNLOAD PNG
                </button>
                <button
                  onClick={handleDownloadReel}
                  className="border-4 border-ink bg-secondary text-ink px-6 py-3 font-display text-xl shadow-pop hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                  DOWNLOAD REEL 📱
                </button>
                <Link
                  to="/"
                  className="border-4 border-ink bg-cream text-ink px-6 py-3 font-display text-xl shadow-pop hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                  ← HOME
                </Link>
              </div>

              {/* TX HISTORY */}
              {comic.recentTxs && comic.recentTxs.length > 0 && (
                <div className="mt-16">
                  <div className="text-center mb-6">
                    <span className="inline-block border-4 border-ink bg-roast text-cream px-4 py-2 font-display text-sm md:text-base shadow-pop-sm rotate-1 mb-3 uppercase">
                      Receipts 🧾
                    </span>
                    <h3 className="font-display text-3xl md:text-5xl text-ink leading-[0.95]">
                      THE EVIDENCE
                    </h3>
                    <p className="mt-2 font-sans text-sm text-ink/60">
                      Last {comic.recentTxs.length} on-chain actions on {comic.stats.chainName}. Every panel above was generated from this.
                    </p>
                  </div>
                  <div className="border-4 border-ink bg-cream shadow-pop overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-ink text-cream font-display text-xs uppercase tracking-wide">
                      <div className="col-span-2">Date</div>
                      <div className="col-span-1">Type</div>
                      <div className="col-span-3">Counterparty</div>
                      <div className="col-span-3">Value</div>
                      <div className="col-span-3 text-right">Tx</div>
                    </div>
                    <ul className="divide-y-2 divide-ink/20">
                      {comic.recentTxs.map((tx) => {
                        const style = TX_TYPE_STYLE[tx.type];
                        return (
                          <li
                            key={tx.hash}
                            className="grid grid-cols-12 gap-2 items-center px-4 py-2 font-sans text-sm hover:bg-secondary/40 transition-colors"
                          >
                            <div className="col-span-2 text-ink/80 font-mono text-xs">
                              <div>{tx.date}</div>
                              <div className="text-ink/50">{tx.time}Z</div>
                            </div>
                            <div className="col-span-1">
                              <span className={`inline-block border-2 border-ink ${style.bg} px-1.5 py-0.5 font-display text-[10px] tracking-wide`}>
                                {style.label}
                              </span>
                            </div>
                            <div className="col-span-3 font-mono text-xs text-ink/70">{tx.counterparty}</div>
                            <div className="col-span-3 font-mono text-xs text-ink">{tx.valueLabel}</div>
                            <div className="col-span-3 text-right">
                              <a
                                href={`${comic.explorerBase}/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-display text-xs underline underline-offset-2 hover:text-roast"
                              >
                                {tx.hash.slice(0, 8)}…↗
                              </a>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="px-4 py-3 bg-secondary/40 border-t-2 border-ink text-center">
                      <a
                        href={`${comic.explorerBase}/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display text-sm text-ink underline underline-offset-4 hover:text-roast"
                      >
                        View full wallet on {comic.stats.chainName} explorer ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* OFF-SCREEN REEL TEMPLATE (9:16, 1080x1920) — exported via html-to-image */}
              <div
                style={{ position: "absolute", left: "-9999px", top: 0, width: "1080px" }}
                aria-hidden
              >
                <div
                  ref={reelRef}
                  style={{ width: "1080px", height: "1920px" }}
                  className="bg-cream relative overflow-hidden flex flex-col"
                >
                  <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />
                  <div className="relative px-12 pt-12 pb-6 text-center">
                    <div className="inline-block border-4 border-ink bg-primary px-4 py-2 font-display text-base text-ink shadow-pop-sm -rotate-2 mb-3 uppercase">
                      Memco · {comic.stats.chainName}
                    </div>
                    <h2 className="font-display text-6xl text-ink leading-[0.95]">
                      ONCHAIN STORY
                    </h2>
                    <p className="mt-2 font-sans text-base text-ink/70 font-mono">
                      {address?.slice(0, 6)}…{address?.slice(-4)}
                    </p>
                  </div>
                  <div className="relative flex-1 px-10 grid grid-cols-2 gap-5 content-start">
                    {comic.panels.slice(0, 6).map((p, i) => (
                      <div
                        key={i}
                        className={`border-4 border-ink bg-cream p-2 shadow-pop-lg ${
                          i % 2 === 0 ? "-rotate-1" : "rotate-1"
                        }`}
                      >
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt=""
                            crossOrigin="anonymous"
                            className="w-full aspect-square object-cover border-2 border-ink"
                          />
                        ) : (
                          <div className="w-full aspect-square border-2 border-ink bg-secondary" />
                        )}
                        <p className="mt-1 font-comic text-base text-ink leading-tight line-clamp-2">
                          {p.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="relative px-10 pb-10 pt-6 text-center">
                    <div className="inline-block border-4 border-ink bg-primary px-6 py-3 font-display text-3xl text-ink shadow-pop mb-4">
                      DEGEN SCORE: {comic.degenScore}/100 🔥
                    </div>
                    <p className="font-comic text-2xl text-ink leading-tight px-4 mb-4">
                      "{comic.verdict}"
                    </p>
                    <p className="font-sans text-sm text-ink/60">
                      {comic.stats.totalTxs} txs · {comic.stats.walletAgeDays}d · {comic.stats.uniqueTokens} tokens · {comic.recentTxs.length} receipts on {comic.stats.chainName}
                    </p>
                    <div className="mt-4 inline-block border-4 border-ink bg-roast text-cream px-4 py-2 font-display text-base shadow-pop-sm rotate-1">
                      memco.app · roast your wallet
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WalletPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
