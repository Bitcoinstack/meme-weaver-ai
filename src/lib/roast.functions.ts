import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  analyzeWallet,
  generateNarration,
  generatePanelImage,
  SUPPORTED_CHAINS,
} from "./wallet.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const inputSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  chainId: z
    .number()
    .int()
    .refine((c) => c in SUPPORTED_CHAINS, "Unsupported chain")
    .optional()
    .default(1),
});

export const roastWallet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const address = data.address.toLowerCase();
    const chainId = data.chainId;

    const stats = await analyzeWallet(address, chainId);

    if (stats.totalTxs === 0) {
      return {
        ok: false as const,
        error: `This wallet has zero ${stats.chainName} activity. Try another chain or a wallet that's been onchain.`,
      };
    }

    const narration = await generateNarration(stats);

    // Generate panel images in parallel
    const panelImages = await Promise.all(
      narration.panels.map((p) =>
        generatePanelImage(p.imagePrompt).catch((e) => {
          console.error("Panel image failed:", e);
          return ""; // empty fallback so the rest still renders
        }),
      ),
    );

    const panels = narration.panels.map((p, i) => ({
      title: p.title,
      caption: p.caption,
      character: p.character,
      sticker: p.sticker ?? null,
      imageUrl: panelImages[i],
    }));

    let comicId: string | null = null;
    try {
      const { data: row } = await supabaseAdmin
        .from("comics")
        .insert([
          {
            wallet_address: address,
            vibe: narration.vibe,
            degen_score: stats.degenScore,
            verdict: narration.verdict,
            panels: panels as unknown as Record<string, unknown>[],
            stats: stats as unknown as Record<string, unknown>,
          },
        ])
        .select("id")
        .single();
      comicId = row?.id ?? null;
    } catch (e) {
      console.error("Failed to persist comic", e);
    }

    return {
      ok: true as const,
      comicId,
      vibe: narration.vibe,
      verdict: narration.verdict,
      degenScore: stats.degenScore,
      stats,
      panels,
    };
  });
