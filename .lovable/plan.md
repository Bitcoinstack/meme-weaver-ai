

## The real problem

Your build is a **Cloudflare Worker bundle** (`dist/server/index.js`), but Vercel doesn't know how to run Cloudflare Workers. The `outputDirectory: "dist"` in `vercel.json` makes Vercel look for static files there — it finds none, so every URL → 404. The wallet SDK has nothing to do with it.

TanStack Start needs a **Vercel-specific build target** to emit Vercel Functions instead of a Worker.

## Two clean options (pick one)

### Option A — Static SPA on Vercel (fastest, recommended for now)

Treat the site as a client-only SPA. The homepage, navbar, hero, FAQ all render in the browser. The `/roast` wallet scan currently uses a TanStack server function — we convert it to call a **Supabase Edge Function** instead (already runs on Lovable Cloud, no Vercel Functions needed).

Pros: deploys in 2 min, zero Vercel config quirks, wallet scan still works (via Lovable Cloud edge function).
Cons: lose SSR (fine for this site — it's interactive, not SEO-critical).

Changes:
1. Add a `vite.config.ts` override that disables the Cloudflare plugin in production builds and outputs a plain SPA to `dist/client` with `index.html`.
2. Move `roastWallet` logic from `src/lib/roast.functions.ts` into a new Supabase Edge Function `supabase/functions/roast-wallet/index.ts` (uses your existing `BSCSCAN_API_KEY` + `LOVABLE_API_KEY` secrets).
3. Update `src/routes/roast.tsx` to call the edge function via `supabase.functions.invoke("roast-wallet", { body: {...} })` instead of `roastWallet({ data: ... })`.
4. Update `vercel.json`:
   - `outputDirectory: "dist/client"`
   - keep the rewrite (now correctly falls back to `index.html`)

### Option B — Full SSR on Vercel (more work, keeps server functions)

Switch the build to TanStack Start's Vercel target so it emits `.vercel/output/functions/` that Vercel runs natively.

Changes:
1. Override `vite.config.ts` to swap the Cloudflare plugin for TanStack Start's Vercel preset (`target: "vercel"`).
2. Remove `outputDirectory` from `vercel.json` (Vercel auto-detects `.vercel/output`).
3. Keep `roast.functions.ts` as-is.
4. Re-add all server env vars in Vercel (BSCSCAN_API_KEY, LOVABLE_API_KEY, SUPABASE_*).

Pros: SSR + server functions work natively on Vercel.
Cons: Lovable preview keeps the Cloudflare target — needs conditional vite config (`process.env.VERCEL` check) to avoid breaking your live preview.

## Recommendation

**Go with Option A.** Your site is a connect-wallet → scan → show comic flow — SSR adds zero value, and the Supabase Edge Function is a more robust home for the scan logic anyway (it'll run on both the Lovable preview and the Vercel deploy with no env-var duplication).

## Files I'll touch (Option A)

- `vite.config.ts` — new file overriding Lovable's preset to drop the Cloudflare plugin in build mode
- `vercel.json` — fix output dir to `dist/client`
- `supabase/functions/roast-wallet/index.ts` — new edge function (port of `wallet.server.ts` logic)
- `src/routes/roast.tsx` — call edge function instead of `roastWallet` server fn
- `src/lib/roast.functions.ts` — delete (no longer needed)
- `DEPLOY_VERCEL.md` — update env-var list (drop Vercel-side server secrets, keep only `VITE_*` since the rest live in Lovable Cloud)

Approve and I'll implement Option A.

