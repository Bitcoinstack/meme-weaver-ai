// Server-only helpers for wallet analysis + AI comic generation.
// Never import this from client code.

const BSCSCAN_BASE = "https://api.bscscan.com/api";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type WalletStats = {
  address: string;
  totalTxs: number;
  walletAgeDays: number;
  uniqueTokens: number;
  topTokens: string[];
  biggestSwapToken: string | null;
  totalSwaps: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
  nightTradeRatio: number; // 0..1 fraction of txs between 0-5 UTC
  degenScore: number; // 0..100
};

type BscTx = {
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  isError: string;
};

type BscTokenTx = {
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenName: string;
  contractAddress: string;
};

async function bscFetch<T>(params: Record<string, string>): Promise<T> {
  const apiKey = process.env.BSCSCAN_API_KEY;
  if (!apiKey) throw new Error("BSCSCAN_API_KEY not configured");
  const qs = new URLSearchParams({ ...params, apikey: apiKey }).toString();
  const res = await fetch(`${BSCSCAN_BASE}?${qs}`);
  if (!res.ok) throw new Error(`BscScan ${res.status}`);
  const json = (await res.json()) as { status: string; message: string; result: T };
  // BscScan returns "0" for "no txns" — that's not an error
  if (json.status !== "1" && !Array.isArray(json.result)) {
    return [] as unknown as T;
  }
  return json.result;
}

export async function analyzeWallet(address: string): Promise<WalletStats> {
  const lower = address.toLowerCase();

  const [txs, tokenTxs] = await Promise.all([
    bscFetch<BscTx[]>({
      module: "account",
      action: "txlist",
      address: lower,
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: "1000",
      sort: "asc",
    }),
    bscFetch<BscTokenTx[]>({
      module: "account",
      action: "tokentx",
      address: lower,
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: "1000",
      sort: "asc",
    }),
  ]);

  const txArr = Array.isArray(txs) ? txs : [];
  const tokArr = Array.isArray(tokenTxs) ? tokenTxs : [];

  const totalTxs = txArr.length;
  const firstTs = txArr[0] ? Number(txArr[0].timeStamp) * 1000 : null;
  const lastTs = txArr[txArr.length - 1]
    ? Number(txArr[txArr.length - 1].timeStamp) * 1000
    : null;
  const walletAgeDays = firstTs ? Math.max(1, Math.floor((Date.now() - firstTs) / 86_400_000)) : 0;

  // Token stats
  const tokenCounts = new Map<string, number>();
  for (const t of tokArr) {
    const sym = t.tokenSymbol || "UNKNOWN";
    tokenCounts.set(sym, (tokenCounts.get(sym) || 0) + 1);
  }
  const sortedTokens = [...tokenCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topTokens = sortedTokens.slice(0, 5).map(([s]) => s);
  const uniqueTokens = tokenCounts.size;
  const biggestSwapToken = sortedTokens[0]?.[0] ?? null;
  const totalSwaps = tokArr.length;

  // Night degen ratio
  let nightTrades = 0;
  for (const t of txArr) {
    const h = new Date(Number(t.timeStamp) * 1000).getUTCHours();
    if (h >= 0 && h < 5) nightTrades++;
  }
  const nightTradeRatio = totalTxs > 0 ? nightTrades / totalTxs : 0;

  // Degen score: weighted mix of activity, diversity, night trading
  const activityScore = Math.min(40, Math.log10(totalTxs + 1) * 12);
  const diversityScore = Math.min(30, uniqueTokens * 1.5);
  const nightScore = nightTradeRatio * 30;
  const degenScore = Math.round(Math.min(100, activityScore + diversityScore + nightScore));

  return {
    address,
    totalTxs,
    walletAgeDays,
    uniqueTokens,
    topTokens,
    biggestSwapToken,
    totalSwaps,
    firstTxDate: firstTs ? new Date(firstTs).toISOString().slice(0, 10) : null,
    lastTxDate: lastTs ? new Date(lastTs).toISOString().slice(0, 10) : null,
    nightTradeRatio,
    degenScore,
  };
}

type NarrationPanel = {
  title: string;
  caption: string;
  imagePrompt: string;
  sticker?: string;
};

type Narration = {
  vibe: "roast" | "wholesome" | "degen";
  verdict: string;
  panels: NarrationPanel[];
};

export async function generateNarration(stats: WalletStats): Promise<Narration> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const sys = `You are Memco, a brutally funny AI that turns BNB Chain wallet history into a 6-panel meme comic.
You auto-pick the tone based on the data:
- If degenScore > 70 OR nightTradeRatio > 0.3 → "degen" (chaotic, crypto slang, "ser", "ngmi", "wagmi")
- If totalTxs < 20 → "wholesome" (gentle, encouraging, baby penguin energy)
- Else → "roast" (savage but playful, like a crypto twitter reply guy)
Mix all three flavors when it fits. Be specific about tokens and numbers.
Each panel needs a short title, a 1-sentence caption (max 18 words), and a vivid image prompt for an illustrator.
Image prompts must include: "comic book style, thick black outlines, halftone shading, cute cartoon penguin character" so panels look consistent.
Do NOT include token contract addresses. Use $SYMBOL format.
Verdict = one savage closing line under 22 words.`;

  const user = `Wallet stats:
${JSON.stringify(stats, null, 2)}

Generate exactly 6 panels narrating this wallet's story:
1. Origin — the wallet's first day onchain
2. First taste — early trading
3. The peak — most-held / biggest token moment
4. The fumble — degen moment / night trading / chasing tokens
5. The cope — current bag situation
6. Verdict — final judgment with vibe-appropriate sticker

Return via the create_comic tool.`;

  const tool = {
    type: "function",
    function: {
      name: "create_comic",
      description: "Create the 6-panel meme comic.",
      parameters: {
        type: "object",
        properties: {
          vibe: { type: "string", enum: ["roast", "wholesome", "degen"] },
          verdict: { type: "string", description: "One closing line under 22 words." },
          panels: {
            type: "array",
            minItems: 6,
            maxItems: 6,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                caption: { type: "string" },
                imagePrompt: { type: "string" },
                sticker: { type: "string", description: "Short emoji+word like 'REKT 💀' or 'WAGMI 🚀'" },
              },
              required: ["title", "caption", "imagePrompt"],
              additionalProperties: false,
            },
          },
        },
        required: ["vibe", "verdict", "panels"],
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
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
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
  return url; // data:image/png;base64,...
}
