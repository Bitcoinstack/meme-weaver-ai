# Memco — Your Wallet, As A Comic

Memco turns any EVM wallet's on-chain history into a personalised, AI-generated meme comic strip. Connect a wallet (or paste any public address), and Memco scans your transactions, tokens, NFT mints and trading patterns to produce a 4–8 panel comic with a custom cast of characters, a "Degen Score" out of 100, and a one-line verdict roasting (or celebrating) your on-chain life.

---

## The Problem

The crypto space has a storytelling gap.

- Wallets contain rich, public, deeply personal histories — every late-night swap, every regretful mint, every diamond-handed bag — but the data lives in block explorers as walls of hex and timestamps that nobody actually reads.
- Existing portfolio dashboards (Zerion, DeBank, Etherscan) answer **what** you own. They never answer **who you are** on-chain.
- New users arrive into Web3 and are immediately drowned in jargon — "ngmi", "rekt", "wagmi", "ape", "rug" — with no entry point to the culture.
- Crypto-native users have no fun, low-effort way to share their on-chain identity socially. A screenshot of Etherscan is not a flex.

There is no product that turns the *narrative* hidden inside on-chain data into something a normal human would actually want to look at, laugh at, and share.

## The Solution

Memco is a wallet roaster + meme comic generator.

1. **Connect a wallet** (MetaMask, Coinbase Wallet, Rabby, or any EIP-6963 browser wallet). No signatures, no approvals, no funds moved — Memco only reads the public chain.
2. **Pick a chain** (Ethereum, BNB Chain, Polygon or Arbitrum).
3. **Memco scans** the wallet's full history: total transactions, wallet age, unique tokens held, NFT mints, contracts touched, failed-tx ratio, night-trading ratio, weekend-trading ratio.
4. **An AI narrator** (large language model with structured tool-calling) reads the stats, picks a tone — `roast`, `wholesome`, `degen` or `mixed` — and writes a 4–8 panel story tailored to *that specific wallet*.
5. **Each panel is illustrated** by an AI image model with a unique cartoon character (penguin, frog, robot, alien, samurai, wojak, astronaut, …) drawn in a consistent comic-book style with thick black outlines, halftone shading and a cream background.
6. **A Degen Score (0–100)** and a closing one-line verdict are stamped at the end.
7. **Share or download** the finished comic as a PNG, post it to X, or keep it as a permalink.

The whole experience runs in 30–60 seconds from "Connect" to "comic ready to share".

## Goals

| # | Goal | Why it matters |
|---|------|----------------|
| 1 | Make on-chain identity **legible to humans** | A 6-panel comic communicates a wallet's personality faster than any dashboard ever could. |
| 2 | Make crypto **culturally onboardable** | Newcomers learn the slang and the archetypes through the joke, not the whitepaper. |
| 3 | Give users a **shareable artefact** | A meme comic is naturally viral; a portfolio screenshot is not. |
| 4 | Stay **non-custodial and read-only** | No signature requests, no token approvals, no risk of drained wallets — trust is built through *not* asking for permissions. |
| 5 | Be **multi-chain by default** | A wallet's story spans chains; the product should too. |
| 6 | Keep the **time-to-comic under 60 seconds** | Long enough to feel like real analysis, short enough that nobody bounces. |
| 7 | Build a **library of generated comics** | Each generated comic is cached, creating a dataset of on-chain personas over time. |

## How It Works (System Overview)

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────────┐
│   Browser    │       │  Server function  │       │ Block Explorer   │
│   wallet     │ ───►  │  /roast (POST)    │ ───►  │ (Etherscan v2,   │
│ (MetaMask…)  │       │                   │       │  multi-chain)    │
└──────────────┘       └─────────┬─────────┘       └──────────────────┘
                                 │
                                 │  raw txs, token transfers, NFT mints
                                 ▼
                       ┌───────────────────┐
                       │   Wallet stats    │
                       │   + degen score   │
                       │   + vibe hints    │
                       └─────────┬─────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │   LLM narrator    │
                       │  (tool-calling →  │
                       │   4–8 panels +    │
                       │   per-panel       │
                       │   image prompts)  │
                       └─────────┬─────────┘
                                 │
                                 ▼  (parallel)
                       ┌───────────────────┐
                       │  Image generator  │
                       │  one image per    │
                       │  panel, unique    │
                       │  character each   │
                       └─────────┬─────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │  Comic cached in  │
                       │  database, sent   │
                       │  back to client,  │
                       │  rendered + PNG   │
                       │  exportable       │
                       └───────────────────┘
```

## Degen Score Formula

The Degen Score is a 0–100 composite signal built from the raw on-chain stats:

```
activityScore   = min(35,  log10(totalTxs + 1) × 10)
diversityScore  = min(25,  uniqueTokens × 1.2)
nightScore      = nightTradeRatio × 20      // % of txs between 00:00–05:00 UTC
failScore       = failedTxRatio × 10        // % of txs that reverted
nftScore        = min(10,  totalNftMints × 0.5)

degenScore      = round( min(100, activityScore + diversityScore
                                  + nightScore + failScore + nftScore) )
```

Reading the bands:

| Score | Archetype |
|-------|-----------|
| 0–19  | Tourist — barely on-chain, baby energy |
| 20–39 | Casual — knows what gas is, holds a few bags |
| 40–59 | Active — multiple chains, regular swaps |
| 60–79 | Degen — chases narratives, mints things at 3am |
| 80–100 | Full Degenerate — lives on a DEX, sleeps when ETH is bridged |

## Tone Selection

The narrator's tone is auto-selected from the wallet's stats — the user never picks a vibe:

| Condition | Tone |
|-----------|------|
| `degenScore > 70` or `nightTradeRatio > 0.30` | **degen** — chaotic crypto-Twitter slang |
| `totalTxs < 20` | **wholesome** — gentle, encouraging, "gm" energy |
| Mixed signals in the middle band | **mixed** — alternates roast / wholesome / degen panels |
| Otherwise | **roast** — savage but playful |

## Panel Count Heuristic

| Total transactions | Panels generated |
|--------------------|------------------|
| `< 30`             | 4 |
| `30 – 200`         | 5–6 |
| `> 200`            | 7–8 |

Richer histories get longer comics.

## Supported Chains

| Chain | ID | Symbol |
|-------|----|--------|
| Ethereum | 1 | ETH |
| BNB Chain | 56 | BNB |
| Polygon | 137 | MATIC |
| Arbitrum One | 42161 | ETH |

All chains share a single unified explorer-API key, so adding more EVM chains is a one-line config change.

## Tech Stack

- **Framework**: TanStack Start (React 19 + Vite 7, SSR + server functions)
- **Styling**: Tailwind CSS v4, custom neo-brutalist design tokens (cream background, thick black borders, drop-shadow "pop" buttons, comic display fonts)
- **Animation**: Framer Motion
- **Wallet layer**: wagmi v2 + viem, with EIP-6963 multi-injected discovery (every installed browser wallet shows up as its own option) plus explicit MetaMask and Coinbase Wallet connectors
- **Data layer**: Postgres database with RLS, used to cache every generated comic for permalinks and analytics
- **PNG export**: `html-to-image` for client-side download
- **Sharing**: X (Twitter) intent links

## What Makes Memco Different

- **Not a portfolio tracker.** Memco does not show you balances, P&L, or charts. It shows you *yourself*, as a character.
- **Not just an AI image generator.** Every panel is grounded in real numbers from your wallet — the AI is given your actual stats and writes a story that references them.
- **Not a chatbot.** The output is a finished, frame-by-frame comic, ready to download and post.
- **Not custodial.** Memco never asks for a signature. It only reads the public chain.

## Roadmap

- [ ] Shareable comic permalinks (`/r/<id>`) so anyone can view a comic without re-running the AI
- [ ] "Hall of Fame" page — auto-roast famous public wallets (Vitalik, CZ, well-known whales)
- [ ] ENS / basenames resolution at the input step (paste `vitalik.eth`)
- [ ] Cross-chain unified scan (one comic from a wallet's full multi-chain history)
- [ ] More chains (Base, Optimism, Avalanche, zkSync, Linea)
- [ ] Comic-as-NFT mint (opt-in, on-chain provenance for the generated artwork)
- [ ] Leaderboard of highest Degen Scores per week
- [ ] Memco Pro: longer comics, higher-res panels, custom art styles (manga, pixel-art, noir)

## Privacy & Safety

- **Read-only**: Memco only calls public block-explorer endpoints and never requests signatures, approvals or fund movements.
- **No private keys** ever touch the server.
- **Wallet addresses** are stored alongside generated comics so they can be re-served as permalinks; no further personal data is collected.
- **Open chains only**: Memco reads what is already publicly viewable on any block explorer.

## License

MIT.
