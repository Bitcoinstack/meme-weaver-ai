import { http, createConfig } from "wagmi";
import { mainnet, polygon, arbitrum, bsc } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Use injected (MetaMask, Rabby, etc.) — works without any project ID.
// WalletConnect dropped: it requires a 32-char public Project ID exposed to
// the browser, which we can't get through to the client cleanly here.
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, bsc],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
  },
  ssr: true,
});
