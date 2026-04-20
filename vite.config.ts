// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  vite: isVercel
    ? {
        plugins: [
          // Strip the Cloudflare plugin injected by the preset; Vercel can't run a Worker bundle.
          {
            name: "memco-strip-cloudflare",
            enforce: "pre",
            config(config) {
              if (config.plugins) {
                config.plugins = (config.plugins as any[]).filter(
                  (p) => !p || !p.name || !String(p.name).includes("cloudflare"),
                );
              }
              return config;
            },
          },
        ],
        build: {
          outDir: "dist/client",
          emptyOutDir: true,
        },
      }
    : undefined,
});
