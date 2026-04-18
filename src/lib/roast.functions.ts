import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  analyzeWallet,
  generateNarration,
  generatePanelImage,
} from "./wallet.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const addressSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export const roastWallet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => addressSchema.parse(input))
  .handler(async ({ data }) => {
    const address = data.address.toLowerCase();

    // 1. Analyze on-chain data
    const stats = await analyzeWallet(address);

    if (stats.totalTxs === 0) {
      return {
        ok: false as const,
        error:
          "This wallet has zero BNB Chain activity. Connect a wallet that's actually been onchain.",
      };
    }

    // 2. Generate narration via Gemini
    const narration = await generateNarration(stats);

    // 3. Generate 6 panel images in parallel
    const panelImages = await Promise.all(
      narration.panels.map((p) => generatePanelImage(p.imagePrompt)),
    );

    const panels = narration.panels.map((p, i) => ({
      title: p.title,
      caption: p.caption,
      sticker: p.sticker ?? null,
      imageUrl: panelImages[i],
    }));

    // 4. Persist (best-effort — don't block on failure)
    let comicId: string | null = null;
    try {
      const { data: row } = await supabaseAdmin
        .from("comics")
        .insert({
          wallet_address: address,
          vibe: narration.vibe,
          degen_score: stats.degenScore,
          verdict: narration.verdict,
          panels,
          stats,
        })
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
