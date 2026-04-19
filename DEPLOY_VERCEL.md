# Deploying Memco to Vercel

This project runs on TanStack Start. The Lovable preview uses a Cloudflare Worker
runtime; for production on **your own domain via Vercel**, follow the steps below.

## 1. Push to GitHub

In Lovable: top-right → **GitHub → Connect to GitHub** → create the repo.

## 2. Import to Vercel

1. Go to <https://vercel.com/new>
2. Import the GitHub repo you just created
3. Framework preset: **Other** (Vercel will use `vercel.json`)
4. Build command: `bun run build` (already set in `vercel.json`)
5. Output dir: `dist` (already set)

## 3. Environment variables (CRITICAL)

In Vercel → Project → Settings → Environment Variables, add **all** of these
(copy the values from Lovable → Cloud → Settings → Secrets):

### Server-side secrets (no `VITE_` prefix)

| Name | Where to get it |
|---|---|
| `BSCSCAN_API_KEY` | Etherscan v2 multichain key |
| `LOVABLE_API_KEY` | Lovable AI Gateway key |
| `WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud |
| `SUPABASE_URL` | Lovable Cloud |
| `SUPABASE_PUBLISHABLE_KEY` | Lovable Cloud |
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud (KEEP SECRET) |

### Client-side build vars (`VITE_` prefix — bundled into the browser JS)

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | same as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same as `SUPABASE_PUBLISHABLE_KEY` |
| `VITE_SUPABASE_PROJECT_ID` | your Supabase project ref |

Apply each to **Production, Preview, Development**.

## 4. Deploy

Click **Deploy**. First build takes ~2 min. The wallet scan (`/roast`) works
immediately because TanStack Start server functions run as Vercel Functions.

## 5. Custom domain

Vercel → Project → Settings → Domains → add `yourdomain.com`. Visitors only
ever see your domain — no Lovable, no Vercel branding.

## Why not Netlify?

TanStack Start's Netlify adapter is currently the least mature. The wallet-scan
server function tends to 404 or cold-start fail there. Vercel's serverless
runtime handles `createServerFn` cleanly without any adapter glue.

## Lovable preview keeps working

Nothing about the Cloudflare/Lovable setup was changed — `wrangler.jsonc` and
`vite.config.ts` are untouched. Lovable preview and Vercel production run in
parallel from the same repo.
