// Supabase Edge Function: roast-wallet
// Mirrors the logic of src/lib/wallet.server.ts + roast.functions.ts so the
// wallet scan works identically on Lovable preview and on Vercel without
// requiring a server runtime on the frontend host.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SUPPORTED_CHAINS: Record<number, { name: string; symbol: string; explorer: string }> = {
  1: { name: "Ethereum", symbol: "ETH", explorer: "etherscan.io" },
  56: { name: "BNB Chain", symbol: "BNB", explorer: "bscscan.com" },
  137: { name: "Polygon", symbol: "MATIC", explorer: "polygonscan.com" },
  42161: { name: "Arbitrum", symbol: "ETH", explorer: "arbiscan.io" },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function explorerFetch<T>(chainId: number, params: Record<string, string>): Promise<T> {
  const apiKey = Deno.env.get("BSCSCAN_API_KEY");
  if (!apiKey) throw new Error("Explorer API key not configured");
  const qs = new URLSearchParams({
    chainid: String(chainId),
    ...params,
    apikey: apiKey,
  }).toString();
  const res = await fetch(`${ETHERSCAN_V2}?${qs}`);
  if (!res.ok) throw new Error(`Explorer ${res.status}`);
  const json = await res.json();
  if (json.status !== "1" && !Array.isArray(json.result)) return [] as unknown as T;
  return json.result as T;
}

async function analyzeWallet(address: string, chainId: number) {
  const lower = address.toLowerCase();
  const chainMeta = SUPPORTED_CHAINS[chainId];
  if (!chainMeta) throw new Error(`Unsupported chain ${chainId}`);

  const baseParams = (action: string, offset: string) => ({
    module: "account",
    action,
    address: lower,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset,
    sort: "asc",
  });

  const [txs, tokenTxs, nftTxs] = await Promise.all([
    explorerFetch<any[]>(chainId, baseParams("txlist", "1000")),
    explorerFetch<any[]>(chainId, baseParams("tokentx", "1000")),
    explorerFetch<any[]>(chainId, baseParams("tokennfttx", "200")),
  ]);

  const txArr = Array.isArray(txs) ? txs : [];
  const tokArr = Array.isArray(tokenTxs) ? tokenTxs : [];
  const nftArr = Array.isArray(nftTxs) ? nftTxs : [];

  const totalTxs = txArr.length;
  const firstTs = txArr[0] ? Number(txArr[0].timeStamp) * 1000 : null;
  const lastTs = txArr.at(-1) ? Number(txArr.at(-1).timeStamp) * 1000 : null;
  const walletAgeDays = firstTs
    ? Math.max(1, Math.floor((Date.now() - firstTs) / 86_400_000))
    : 0;

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

  const totalNftMints = nftArr.filter(
    (n) => n.from === "0x0000000000000000000000000000000000000000",
  ).length;

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

  const activityScore = Math.min(35, Math.log10(totalTxs + 1) * 10);
  const diversityScore = Math.min(25, uniqueTokens * 1.2);
  const nightScore = nightTradeRatio * 20;
  const failScore = failedTxRatio * 10;
  const nftScore = Math.min(10, totalNftMints * 0.5);
  const degenScore = Math.round(
    Math.min(100, activityScore + diversityScore + nightScore + failScore + nftScore),
  );

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

  const trunc = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");
  const feed: any[] = [];
  for (const t of txArr) {
    const ts = Number(t.timeStamp) * 1000;
    const d = new Date(ts);
    const isContract = t.input && t.input !== "0x";
    let type: string;
    if (t.isError === "1") type = "failed";
    else if (isContract) type = "contract";
    else if (t.from?.toLowerCase() === lower) type = "send";
    else type = "receive";
    const eth = Number(t.value) / 1e18;
    feed.push({
      ts,
      hash: t.hash,
      date: d.toISOString().slice(0, 10),
      time: d.toISOString().slice(11, 16),
      type,
      counterparty: trunc(t.from?.toLowerCase() === lower ? t.to : t.from),
      token: null,
      valueLabel: eth > 0 ? `${eth.toFixed(eth < 0.01 ? 5 : 4)} ${chainMeta.symbol}` : "—",
    });
  }
  for (const t of tokArr) {
    const ts = Number(t.timeStamp) * 1000;
    const d = new Date(ts);
    feed.push({
      ts,
      hash: t.hash,
      date: d.toISOString().slice(0, 10),
      time: d.toISOString().slice(11, 16),
      type: "swap",
      counterparty: trunc(t.from?.toLowerCase() === lower ? t.to : t.from),
      token: (t.tokenSymbol || "TOKEN").slice(0, 12),
      valueLabel: `$${(t.tokenSymbol || "TOKEN").slice(0, 12)}`,
    });
  }
  for (const t of nftArr) {
    const ts = Number(t.timeStamp) * 1000;
    const d = new Date(ts);
    const isMint = t.from === "0x0000000000000000000000000000000000000000";
    feed.push({
      ts,
      hash: t.hash,
      date: d.toISOString().slice(0, 10),
      time: d.toISOString().slice(11, 16),
      type: isMint ? "mint" : "swap",
      counterparty: trunc(isMint ? "mint" : t.from?.toLowerCase() === lower ? t.to : t.from),
      token: (t.tokenSymbol || "NFT").slice(0, 12),
      valueLabel: `NFT ${(t.tokenSymbol || "").slice(0, 8)}`.trim(),
    });
  }
  const seen = new Set<string>();
  const recentTxs = feed
    .sort((a, b) => b.ts - a.ts)
    .filter((f) => {
      if (seen.has(f.hash)) return false;
      seen.add(f.hash);
      return true;
    })
    .slice(0, 25)
    .map(({ ts: _ts, ...rest }) => rest);

  return {
    address,
    chainId,
    chainName: chainMeta.name,
    explorerBase: `https://${chainMeta.explorer}`,
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
    recentTxs,
  };
}

async function generateNarration(stats: any) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const sys = `You are Memco, a brutally funny AI that turns ${stats.chainName} wallet history into a meme comic strip.

TONE: auto-pick based on data:
- degenScore > 70 OR nightTradeRatio > 0.3 → "degen"
- totalTxs < 20 → "wholesome"
- mid-range with mixed signals → "mixed"
- otherwise → "roast"
Be specific about tokens and numbers from the data.

PANEL COUNT: 4-8 panels based on richness:
- < 30 txs → 4 panels
- 30-200 txs → 5-6 panels
- > 200 txs → 7-8 panels

CHARACTERS: each panel a DIFFERENT character (penguin, frog, dog, cat, raccoon, robot, alien, ghost, monkey, bear, bull, chad-guy, wojak, anon-with-hoodie, viking, samurai, astronaut, clown, baby chick, rocket).

IMAGE PROMPT: must start with "Comic book panel, thick black outlines, halftone shading, cel-shaded cartoon, cream background." Then describe character + scene + emotion. Under 60 words. Use $SYMBOL for tokens.

STICKER: short emoji+word like "REKT 💀", "WAGMI 🚀".
VERDICT: one closing line under 22 words.`;

  const user = `Wallet stats:
${JSON.stringify(stats, null, 2)}

Generate a meme comic. Each panel: title, 1-sentence caption (max 18 words), character, imagePrompt, sticker. Return via create_comic tool.`;

  const tool = {
    type: "function",
    function: {
      name: "create_comic",
      description: "Create a meme comic strip with 4-8 panels.",
      parameters: {
        type: "object",
        properties: {
          vibe: { type: "string", enum: ["roast", "wholesome", "degen", "mixed"] },
          verdict: { type: "string" },
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
                character: { type: "string" },
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
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
  return JSON.parse(call.function.arguments);
}

async function generatePanelImage(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Image gen rate limited.");
    if (res.status === 402) throw new Error("Credits exhausted.");
    throw new Error(`Image gen ${res.status}`);
  }

  const data = await res.json();
  const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("No image returned");
  return url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const address = String(body?.address || "").toLowerCase();
    const chainId = Number(body?.chainId || 1);

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid wallet address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!(chainId in SUPPORTED_CHAINS)) {
      return new Response(JSON.stringify({ ok: false, error: "Unsupported chain" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stats = await analyzeWallet(address, chainId);

    if (stats.totalTxs === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `This wallet has zero ${stats.chainName} activity. Try another chain or a wallet that's been onchain.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const narration = await generateNarration(stats);

    const panelImages = await Promise.all(
      narration.panels.map((p: any) =>
        generatePanelImage(p.imagePrompt).catch((e: any) => {
          console.error("Panel image failed:", e?.message || e);
          return "";
        }),
      ),
    );

    const panels = narration.panels.map((p: any, i: number) => ({
      title: p.title,
      caption: p.caption,
      character: p.character,
      sticker: p.sticker ?? null,
      imageUrl: panelImages[i],
    }));

    let comicId: string | null = null;
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: row } = await supabase
        .from("comics")
        .insert([
          {
            wallet_address: address,
            vibe: narration.vibe,
            degen_score: stats.degenScore,
            verdict: narration.verdict,
            panels: panels as any,
            stats: stats as any,
          },
        ])
        .select("id")
        .single();
      comicId = row?.id ?? null;
    } catch (e) {
      console.error("Failed to persist comic", e);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        comicId,
        vibe: narration.vibe,
        verdict: narration.verdict,
        degenScore: stats.degenScore,
        stats,
        panels,
        recentTxs: stats.recentTxs,
        explorerBase: stats.explorerBase,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("roast-wallet error:", e?.message || e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
