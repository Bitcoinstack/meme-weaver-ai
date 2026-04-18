import { http, createConfig } from "wagmi";
import { mainnet, polygon, arbitrum, bsc } from "wagmi/chains";
import { metaMask, coinbaseWallet, injected } from "wagmi/connectors";

// Multi-wallet setup:
// - EIP-6963 multi-injected discovery (default in wagmi v2) surfaces every
//   installed browser wallet as its own connector, so the user can pick.
// - Explicit metaMask + coinbaseWallet connectors guarantee those two appear
//   even if the user doesn't have them installed (deep-link / SDK fallback).
// - The fallback `injected()` is intentionally NOT included to avoid
//   auto-grabbing whichever wallet wins window.ethereum (was opening Trust).
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum],
  multiInjectedProviderDiscovery: true,
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: "Memco" }),
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});
