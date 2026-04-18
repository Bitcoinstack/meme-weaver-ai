import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Web3Provider } from "@/components/Web3Provider";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "memco" },
      { name: "description", content: "Meme Weaver AI transforms your web3 activity into personalized, animated meme-style recaps." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "memco" },
      { property: "og:description", content: "Meme Weaver AI transforms your web3 activity into personalized, animated meme-style recaps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "memco" },
      { name: "twitter:description", content: "Meme Weaver AI transforms your web3 activity into personalized, animated meme-style recaps." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2cb0a1f7-8e50-421c-806a-d836f2a6c93f/id-preview-f3acb9cc--445ebe1e-d5d0-43b8-b241-93e50df04d01.lovable.app-1776518674867.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2cb0a1f7-8e50-421c-806a-d836f2a6c93f/id-preview-f3acb9cc--445ebe1e-d5d0-43b8-b241-93e50df04d01.lovable.app-1776518674867.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <Web3Provider>
      <Outlet />
    </Web3Provider>
  );
}
