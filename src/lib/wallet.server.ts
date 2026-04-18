// Server-only helpers for wallet analysis + AI comic generation.
// Never import this from client code.

const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Etherscan v2 unified API — one key works across all chains, free tier.
export const SUPPORTED_CHAINS = {
  1: { name: "Ethereum", symbol: "ETH", explorer: "etherscan.io" },
  56: { name: "BNB Chain", symbol: "BNB", explorer: "bscscan.com" },
  137: { name: "Polygon", symbol: "MATIC", explorer: "polygonscan.com" },
  42161: { name: "Arbitrum", symbol: "ETH", explorer: "arbiscan.io" },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;

export type WalletStats = {
  address: string;
  chainId: number;
  chainName: string;
  totalTxs: number;
  walletAgeDays: number;
  uniqueTokens: number;
  topTokens: string[];
  biggestSwapToken: string | null;
  totalSwaps: number;
  totalNftMints: number;
  contractsInteracted: number;
  failedTxRatio: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
  nightTradeRatio: number; // 0..1 fraction of txs between 0-5 UTC
  weekendRatio: number;
  degenScore: number; // 0..100
  vibeHints: string[]; // human-readable signals to feed the AI
};

type EvmTx = {
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  isError: string;
  contractAddress?: string;
  input?: string;
};

type TokenTx = {
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenName: string;
  contractAddress: string;
};

async function explorerFetch<T>(
  chainId: number,
  params: Record<string, string>,
): Promise<T> {
  const apiKey = process.env.BSCSCAN_API_KEY; // works as Etherscan v2 unified key
  if (!apiKey) throw new Error("Explorer API key not configured");
  const qs = new URLSearchParams({
    chainid: String(chainId),
    ...params,
    apikey: apiKey,
  }).toString();
  const res = await fetch(`${ETHERSCAN_V2}?${qs}`);
  if (!res.ok) throw new Error(`Explorer ${res.status}`);
  const json = (await res.json()) as { status: string; message: string; result: T };
  if (json.status !== "1" && !Array.isArray(json.result)) {
    return [] as unknown as T;
  }
  return json.result;
}

export async function analyzeWallet(
  address: string,
  chainId: number,
): Promise<WalletStats> {
  const lower = address.toLowerCase();
  const chainMeta = SUPPORTED_CHAINS[chainId as ChainId];
  if (!chainMeta) throw new Error(`Unsupported chain ${chainId}`);

  const [txs, tokenTxs, nftTxs] = await Promise.all([
    explorerFetch<EvmTx[]>(chainId, {
      module: "account",
      action: "txlist",
      address: lower,
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: "1000",
      sort: "asc",
    }),
    explorerFetch<TokenTx[]>(chainId, {
      module: "account",
      action: "tokentx",
      address: lower,
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: "1000",
      sort: "asc",
    }),
    explorerFetch<TokenTx[]>(chainId, {
      module: "account",
      action: "tokennfttx",
      address: lower,
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: "200",
      sort: "asc",
    }),
  ]);

  const txArr = Array.isArray(txs) ? txs : [];
  const tokArr = Array.isArray(tokenTxs) ? tokenTxs : [];
  const nftArr = Array.isArray(nftTxs) ? nftTxs : [];

  const totalTxs = txArr.length;
  const firstTs = txArr[0] ? Number(txArr[0].timeStamp) * 1000 : null;
  const lastTs = txArr[txArr.length - 1]
    ? Number(txArr[txArr.length - 1].timeStamp) * 1000
    : null;
  const walletAgeDays = firstTs
    ? Math.max(1, Math.floor((Date.now() - firstTs) / 86_400_000))
    : 0;

  // Token stats
  const tokenCounts = new Map<string, number>();
  for (const t of tokArr) {
    const sym = (t.tokenSymbol || "UNKNOWN").slice(0, 12);
    tokenCounts.set(sym, (tokenCounts.get(sym) || 0) + 1);
  }
  const sortedTokens = [...tokenCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topTokens = sortedTokens.slice(0, 5).map(([s]) => s);
  const uniqueTokens = tokenCounts.size;
  const biggestSwapToken = sortedTokens[0]?.[0] ?? null;
  const totalSwaps = tokArr.length;

  // NFT mints (received from 0x0)
  const totalNftMints = nftArr.filter(
    (n) => n.from === "0x0000000000000000000000000000000000000000",
  ).length;

  // Contracts interacted with (unique `to` addresses for txs with input data)
  const contractSet = new Set<string>();
  let failed = 0;
  let nightTrades = 0;
  let weekendTrades = 0;
  for (const t of txArr) {
    if (t.input && t.input !== "0x" && t.to) contractSet.add(t.to.toLowerCase());
    if (t.isError === "1") failed++;
    const d = new Date(Number(t.timeStamp) * 1000);
    const h = d.getUTCHours();
    if (h >= 0 && h < 5) nightTrades++;
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) weekendTrades++;
  }
  const failedTxRatio = totalTxs > 0 ? failed / totalTxs : 0;
  const nightTradeRatio = totalTxs > 0 ? nightTrades / totalTxs : 0;
  const weekendRatio = totalTxs > 0 ? weekendTrades / totalTxs : 0;
  const contractsInteracted = contractSet.size;

  // Degen score (0-100): activity + diversity + chaos signals
  const activityScore = Math.min(35, Math.log10(totalTxs + 1) * 10);
  const diversityScore = Math.min(25, uniqueTokens * 1.2);
  const nightScore = nightTradeRatio * 20;
  const failScore = failedTxRatio * 10;
  const nftScore = Math.min(10, totalNftMints * 0.5);
  const degenScore = Math.round(
    Math.min(100, activityScore + diversityScore + nightScore + failScore + nftScore),
  );

  // Build vibe hints for the AI
  const hints: string[] = [];
  if (totalTxs < 10) hints.push("brand new wallet, baby onchain energy");
  else if (totalTxs > 500) hints.push("seasoned veteran, lots of history");
  if (nightTradeRatio > 0.25) hints.push("trades at 3am — nocturnal degen");
  if (failedTxRatio > 0.1) hints.push("many failed txs — gas-fee speedrunner");
  if (totalNftMints > 10) hints.push("NFT minter, JPEG enjoyer");
  if (uniqueTokens > 30) hints.push("collects shitcoins like trading cards");
  if (uniqueTokens < 5 && totalSwaps > 20) hints.push("loyalist, holds the same bags forever");
  if (walletAgeDays > 1500) hints.push("OG since 2021 or earlier");
  if (weekendRatio > 0.4) hints.push("weekend warrior trader");

  return {
    address,
    chainId,
    chainName: chainMeta.name,
    totalTxs,
    walletAgeDays,
    uniqueTokens,
    topTokens,
    biggestSwapToken,
    totalSwaps,
    totalNftMints,
    contractsInteracted,
    failedTxRatio: Math.round(failedTxRatio * 100) / 100,
    firstTxDate: firstTs ? new Date(firstTs).toISOString().slice(0, 10) : null,
    lastTxDate: lastTs ? new Date(lastTs).toISOString().slice(0, 10) : null,
    nightTradeRatio: Math.round(nightTradeRatio * 100) / 100,
    weekendRatio: Math.round(weekendRatio * 100) / 100,
    degenScore,
    vibeHints: hints,
  };
}

type NarrationPanel = {
  title: string;
  caption: string;
  character: string; // describes the character for THIS panel
  imagePrompt: string;
  sticker?: string;
};

type Narration = {
  vibe: "roast" | "wholesome" | "degen" | "mixed";
  verdict: string;
  panelCount: number;
  panels: NarrationPanel[];
};

export async function generateNarration(stats: WalletStats): Promise<Narration> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const sys = `You are Memco, a brutally funny AI that turns ${stats.chainName} wallet history into a meme comic strip.

TONE: auto-pick based on data:
- degenScore > 70 OR nightTradeRatio > 0.3 → "degen" (chaotic crypto slang, "ser", "ngmi", "wagmi")
- totalTxs < 20 → "wholesome" (gentle, encouraging, baby energy)
- mid-range with mixed signals → "mixed" (alternates roast/wholesome/degen)
- otherwise → "roast" (savage but playful, like a crypto twitter reply guy)
Be specific about tokens and numbers from the data.

PANEL COUNT: choose 4-8 panels based on richness of data:
- < 30 txs → 4 panels (short story)
- 30-200 txs → 5-6 panels
- > 200 txs → 7-8 panels (rich history deserves more)

CHARACTERS: each panel has a DIFFERENT character that fits the moment. Pick imaginatively from:
cartoon penguin, frog (pepe-vibe), dog, cat, raccoon, robot, alien, ghost, monkey, bear, bull, chad-guy, wojak, anon-with-hoodie, viking, samurai, astronaut, clown, baby chick, rocket. Mix them up — different character per panel keeps it fresh.

IMAGE PROMPT RULES: each prompt MUST start with "Comic book panel, thick black outlines, halftone shading, cel-shaded cartoon, cream background." Then describe the character + scene + emotion. Keep prompts under 60 words. Do NOT mention real token contract addresses. Use $SYMBOL format for tokens.

STICKER: short emoji+word like "REKT 💀", "WAGMI 🚀", "GM ☀️", "PUMP 📈", "RUG 🪤", "BASED 🗿".

VERDICT: one closing line under 22 words.`;

  const user = `Wallet stats:
${JSON.stringify(stats, null, 2)}

Generate a meme comic narrating this wallet's onchain story. Each panel: title, 1-sentence caption (max 18 words), character description for that panel, imagePrompt for the artist, sticker.

Return via the create_comic tool.`;

  const tool = {
    type: "function",
    function: {
      name: "create_comic",
      description: "Create a meme comic strip with 4-8 panels.",
      parameters: {
        type: "object",
        properties: {
          vibe: { type: "string", enum: ["roast", "wholesome", "degen", "mixed"] },
          verdict: { type: "string", description: "One closing line under 22 words." },
          panelCount: { type: "integer", minimum: 4, maximum: 8 },
          panels: {
            type: "array",
            minItems: 4,
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                caption: { type: "string" },
                character: {
                  type: "string",
                  description: "Short description of the character in this panel, e.g. 'cartoon penguin in lab coat' or 'frog wojak crying'",
                },
                imagePrompt: { type: "string" },
                sticker: { type: "string" },
              },
              required: ["title", "caption", "character", "imagePrompt"],
              additionalProperties: false,
            },
          },
        },
        required: ["vibe", "verdict", "panelCount", "panels"],
        additionalProperties: false,
      },
    },
  };

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "create_comic" } },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limited — try again in a minute.");
    if (res.status === 402) throw new Error("AI credits exhausted — top up Lovable AI in Settings.");
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("AI did not return a comic");
  const args = JSON.parse(call.function.arguments);
  return args as Narration;
}

export async function generatePanelImage(prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Image gen rate limited — try again.");
    if (res.status === 402) throw new Error("Credits exhausted.");
    throw new Error(`Image gen ${res.status}`);
  }

  const data = await res.json();
  const images = data?.choices?.[0]?.message?.images;
  const url = images?.[0]?.image_url?.url;
  if (!url) throw new Error("No image returned");
  return url;
}
