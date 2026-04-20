# Deploying Memco to Vercel

This project ships as a **static SPA** on Vercel. The wallet-scan logic lives
in a Lovable Cloud edge function (`roast-wallet`), so Vercel only serves the
built frontend — no Vercel Functions, no server runtime config required.

## 1. Push to GitHub

In Lovable: top-right → **GitHub → Connect to GitHub** → create the repo.

## 2. Import to Vercel

1. <https://vercel.com/new> → import the repo
2. Framework preset: **Other** (Vercel will use `vercel.json`)
3. Build command: `bun run build` (already set)
4. Output directory: `dist/client` (already set)

## 3. Environment variables

Only **client-side** vars are needed in Vercel — the server secrets
(`BSCSCAN_API_KEY`, `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) live
inside Lovable Cloud and never leave it.

In Vercel → Project → Settings → Environment Variables, add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | from Lovable → Cloud |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | from Lovable → Cloud |
| `VITE_SUPABASE_PROJECT_ID` | your Supabase project ref |
| `WALLETCONNECT_PROJECT_ID` *(optional, for build-time wagmi config)* | from WalletConnect Cloud |

Apply each to **Production, Preview, Development**.

## 4. Deploy

Click **Deploy**. First build takes ~2 min. The wallet scan works immediately
because it calls the `roast-wallet` edge function on Lovable Cloud directly
from the browser — no Vercel-side server code involved.

## 5. Custom domain

Vercel → Settings → Domains → add `yourdomain.com`. Visitors only see your
domain — no Lovable, no Vercel branding.

## How it works

- Lovable preview: full TanStack Start runtime on Cloudflare Worker (SSR + server fns).
- Vercel production: SPA build (`dist/client`) — `vite.config.ts` strips the
  Cloudflare plugin when `process.env.VERCEL` is set.
- Wallet scan on both: same Supabase Edge Function (`roast-wallet`) hosted on
  Lovable Cloud, called via `supabase.functions.invoke()`.
